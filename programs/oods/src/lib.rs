use anchor_lang::prelude::*;

declare_id!("FpX8xX7H4GDUTdj23Hu3yFAWjVj44JurdY1UFQn587BS");

#[program]
pub mod oods {
    use super::*;

    /// Initialize a new token launch with discovery phase
    pub fn initialize_launch(
        ctx: Context<InitializeLaunch>,
        name: String,
        symbol: String,
        total_supply: u64,
        discovery_duration: i64,  // seconds
        predict_duration: i64,    // seconds
    ) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let clock = Clock::get()?;

        require!(name.len() <= 32, OodsError::NameTooLong);
        require!(symbol.len() <= 10, OodsError::SymbolTooLong);
        require!(discovery_duration > 0 && discovery_duration <= 3600, OodsError::InvalidDuration);
        require!(predict_duration > 0 && predict_duration <= 86400, OodsError::InvalidDuration);

        launch.authority = ctx.accounts.authority.key();
        launch.name = name;
        launch.symbol = symbol;
        launch.total_supply = total_supply;
        launch.phase = Phase::Discovery;
        launch.discovery_end = clock.unix_timestamp + discovery_duration;
        launch.predict_end = clock.unix_timestamp + discovery_duration + predict_duration;
        launch.total_votes = 0;
        launch.median_mcap = 0;
        launch.total_sol_locked = 0;
        launch.settlement_price = 0;
        launch.bump = ctx.bumps.launch;

        emit!(LaunchCreated {
            launch: launch.key(),
            name: launch.name.clone(),
            symbol: launch.symbol.clone(),
            discovery_end: launch.discovery_end,
            predict_end: launch.predict_end,
        });

        Ok(())
    }

    /// Submit a vote for expected market cap during discovery phase
    pub fn submit_vote(
        ctx: Context<SubmitVote>,
        mcap_vote: u64,
    ) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let vote = &mut ctx.accounts.vote;
        let clock = Clock::get()?;

        require!(launch.phase == Phase::Discovery, OodsError::WrongPhase);
        require!(clock.unix_timestamp < launch.discovery_end, OodsError::PhaseEnded);
        require!(mcap_vote > 0, OodsError::InvalidVote);

        vote.launch = launch.key();
        vote.voter = ctx.accounts.voter.key();
        vote.mcap_vote = mcap_vote;
        vote.timestamp = clock.unix_timestamp;
        vote.bump = ctx.bumps.vote;

        launch.total_votes += 1;

        emit!(VoteSubmitted {
            launch: launch.key(),
            voter: vote.voter,
            mcap_vote,
        });

        Ok(())
    }

    /// Transition from discovery to predict phase (calculates median)
    pub fn start_predict_phase(
        ctx: Context<StartPredictPhase>,
        median_mcap: u64,  // Calculated off-chain from all votes
    ) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let clock = Clock::get()?;

        require!(launch.phase == Phase::Discovery, OodsError::WrongPhase);
        require!(clock.unix_timestamp >= launch.discovery_end, OodsError::PhaseNotEnded);
        require!(median_mcap > 0, OodsError::InvalidMedian);

        launch.phase = Phase::Predict;
        launch.median_mcap = median_mcap;

        emit!(PredictPhaseStarted {
            launch: launch.key(),
            median_mcap,
        });

        Ok(())
    }

    /// Place a prediction bet on a breakpoint
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        breakpoint: u64,
        is_yes: bool,
        amount: u64,
    ) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;

        require!(launch.phase == Phase::Predict, OodsError::WrongPhase);
        require!(clock.unix_timestamp < launch.predict_end, OodsError::PhaseEnded);
        require!(amount > 0, OodsError::InvalidAmount);
        require!(breakpoint > 0, OodsError::InvalidBreakpoint);

        // Calculate position multiplier based on SOL already on this breakpoint
        let multiplier = calculate_multiplier(launch.total_sol_locked);

        // Transfer SOL to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        bet.launch = launch.key();
        bet.bettor = ctx.accounts.bettor.key();
        bet.breakpoint = breakpoint;
        bet.is_yes = is_yes;
        bet.amount = amount;
        bet.multiplier = multiplier;
        bet.timestamp = clock.unix_timestamp;
        bet.claimed = false;
        bet.bump = ctx.bumps.bet;

        launch.total_sol_locked += amount;

        emit!(BetPlaced {
            launch: launch.key(),
            bettor: bet.bettor,
            breakpoint,
            is_yes,
            amount,
            multiplier,
        });

        Ok(())
    }

    /// Settle the launch and determine final price
    pub fn settle(
        ctx: Context<Settle>,
        settlement_price: u64,  // Calculated from auto-balance algorithm
    ) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let clock = Clock::get()?;

        require!(launch.phase == Phase::Predict, OodsError::WrongPhase);
        require!(clock.unix_timestamp >= launch.predict_end, OodsError::PhaseNotEnded);
        require!(settlement_price > 0, OodsError::InvalidSettlement);

        launch.phase = Phase::Settled;
        launch.settlement_price = settlement_price;

        emit!(LaunchSettled {
            launch: launch.key(),
            settlement_price,
            total_sol: launch.total_sol_locked,
        });

        Ok(())
    }

    /// Claim tokens based on bet accuracy
    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let launch = &ctx.accounts.launch;
        let bet = &mut ctx.accounts.bet;

        require!(launch.phase == Phase::Settled, OodsError::WrongPhase);
        require!(!bet.claimed, OodsError::AlreadyClaimed);
        require!(bet.bettor == ctx.accounts.claimer.key(), OodsError::NotBettor);

        // Calculate accuracy: 1 / (1 + (distance/P)²)
        let accuracy = calculate_accuracy(bet.breakpoint, launch.settlement_price, bet.is_yes);
        
        // Token weight = SOL × accuracy × multiplier
        let weight = (bet.amount as u128)
            .checked_mul(accuracy as u128).unwrap()
            .checked_mul(bet.multiplier as u128).unwrap()
            / 10000 / 100;  // Adjust for basis points

        // 80% of supply goes to participants
        let participant_pool = (launch.total_supply as u128) * 80 / 100;
        
        // This is simplified - in production would need total weight calculation
        let tokens = weight.min(participant_pool) as u64;

        bet.claimed = true;

        emit!(TokensClaimed {
            launch: launch.key(),
            claimer: ctx.accounts.claimer.key(),
            tokens,
            accuracy,
        });

        // TODO: Mint tokens to claimer

        Ok(())
    }
}

// Helper functions
fn calculate_multiplier(total_sol_on_breakpoint: u64) -> u16 {
    // Returns multiplier in basis points (150 = 1.5x)
    let sol_lamports = total_sol_on_breakpoint / 1_000_000_000; // Convert to SOL
    match sol_lamports {
        0..=99 => 150,      // 1.5x
        100..=199 => 130,   // 1.3x
        200..=299 => 110,   // 1.1x
        300..=399 => 100,   // 1.0x
        400..=499 => 80,    // 0.8x
        500..=599 => 60,    // 0.6x
        _ => 50,            // 0.5x
    }
}

fn calculate_accuracy(breakpoint: u64, settlement: u64, is_yes: bool) -> u16 {
    // Returns accuracy in basis points (10000 = 100%)
    let distance = if breakpoint > settlement {
        breakpoint - settlement
    } else {
        settlement - breakpoint
    };
    
    // accuracy = 1 / (1 + (distance/settlement)²)
    let ratio = (distance as u128 * 10000) / settlement as u128;
    let ratio_squared = ratio * ratio / 10000;
    let accuracy = 10000 * 10000 / (10000 + ratio_squared);
    
    // Adjust for correct/incorrect prediction
    let is_correct = if is_yes {
        settlement >= breakpoint
    } else {
        settlement < breakpoint
    };
    
    if is_correct {
        accuracy as u16
    } else {
        (accuracy * 67 / 100) as u16  // 67% penalty for wrong direction
    }
}

// Account structures
#[account]
#[derive(InitSpace)]
pub struct Launch {
    pub authority: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    pub total_supply: u64,
    pub phase: Phase,
    pub discovery_end: i64,
    pub predict_end: i64,
    pub total_votes: u32,
    pub median_mcap: u64,
    pub total_sol_locked: u64,
    pub settlement_price: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Vote {
    pub launch: Pubkey,
    pub voter: Pubkey,
    pub mcap_vote: u64,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub launch: Pubkey,
    pub bettor: Pubkey,
    pub breakpoint: u64,
    pub is_yes: bool,
    pub amount: u64,
    pub multiplier: u16,
    pub timestamp: i64,
    pub claimed: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Phase {
    Discovery,
    Predict,
    Settled,
}

// Contexts
#[derive(Accounts)]
#[instruction(name: String, symbol: String)]
pub struct InitializeLaunch<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Launch::INIT_SPACE,
        seeds = [b"launch", name.as_bytes()],
        bump
    )]
    pub launch: Account<'info, Launch>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(mut)]
    pub launch: Account<'info, Launch>,
    
    #[account(
        init,
        payer = voter,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", launch.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartPredictPhase<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        has_one = authority,
    )]
    pub launch: Account<'info, Launch>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    #[account(mut)]
    pub launch: Account<'info, Launch>,
    
    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", launch.key().as_ref(), bettor.key().as_ref(), &bettor.key().to_bytes()[..8]],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    /// CHECK: Vault PDA for holding SOL
    #[account(
        mut,
        seeds = [b"vault", launch.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        has_one = authority,
    )]
    pub launch: Account<'info, Launch>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    
    pub launch: Account<'info, Launch>,
    
    #[account(
        mut,
        has_one = launch,
        constraint = bet.bettor == claimer.key() @ OodsError::NotBettor,
    )]
    pub bet: Account<'info, Bet>,
}

// Events
#[event]
pub struct LaunchCreated {
    pub launch: Pubkey,
    pub name: String,
    pub symbol: String,
    pub discovery_end: i64,
    pub predict_end: i64,
}

#[event]
pub struct VoteSubmitted {
    pub launch: Pubkey,
    pub voter: Pubkey,
    pub mcap_vote: u64,
}

#[event]
pub struct PredictPhaseStarted {
    pub launch: Pubkey,
    pub median_mcap: u64,
}

#[event]
pub struct BetPlaced {
    pub launch: Pubkey,
    pub bettor: Pubkey,
    pub breakpoint: u64,
    pub is_yes: bool,
    pub amount: u64,
    pub multiplier: u16,
}

#[event]
pub struct LaunchSettled {
    pub launch: Pubkey,
    pub settlement_price: u64,
    pub total_sol: u64,
}

#[event]
pub struct TokensClaimed {
    pub launch: Pubkey,
    pub claimer: Pubkey,
    pub tokens: u64,
    pub accuracy: u16,
}

// Errors
#[error_code]
pub enum OodsError {
    #[msg("Name too long (max 32 chars)")]
    NameTooLong,
    #[msg("Symbol too long (max 10 chars)")]
    SymbolTooLong,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Wrong phase for this action")]
    WrongPhase,
    #[msg("Phase has ended")]
    PhaseEnded,
    #[msg("Phase has not ended yet")]
    PhaseNotEnded,
    #[msg("Invalid vote amount")]
    InvalidVote,
    #[msg("Invalid median value")]
    InvalidMedian,
    #[msg("Invalid bet amount")]
    InvalidAmount,
    #[msg("Invalid breakpoint")]
    InvalidBreakpoint,
    #[msg("Invalid settlement price")]
    InvalidSettlement,
    #[msg("Tokens already claimed")]
    AlreadyClaimed,
    #[msg("Not the original bettor")]
    NotBettor,
}
