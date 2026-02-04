'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModal, usePhantom } from '@phantom/react-sdk';
import { Header } from '@/components/Header';
import { PriceChart } from '@/components/PriceChart';

// Types
interface Bet {
  type: 'yes' | 'no';
  x: number;
}

interface PriceLevel {
  price: number;
  yes: number;
  no: number;
  dots: Bet[];
}

interface PricePoint {
  time: number;
  price: number;
}

type Phase = 'discovery' | 'predict' | 'settlement';

// Preset mcaps for discovery phase
const PRESET_MCAPS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];

// Initial mock data for predict phase
const generatePriceLevels = (median: number): PriceLevel[] => {
  const multipliers = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
  return multipliers.map(m => ({
    price: Math.round(median * m),
    yes: Math.floor(Math.random() * 5),
    no: Math.floor(Math.random() * 3),
    dots: [],
  })).sort((a, b) => b.price - a.price);
};

const generateInitialHistory = (startPrice: number): PricePoint[] => {
  const points: PricePoint[] = [];
  let price = startPrice * 0.7;
  for (let t = 0; t <= 70; t += 2) {
    price += (Math.random() - 0.45) * startPrice * 0.15;
    price = Math.max(startPrice * 0.3, Math.min(startPrice * 2, price));
    points.push({ time: t, price });
  }
  return points;
};

const AMOUNTS = [0.5, 1, 2, 5];
const MULTIPLIER_TIERS = [
  { threshold: 0, multiplier: 1.5 },
  { threshold: 100, multiplier: 1.3 },
  { threshold: 200, multiplier: 1.1 },
  { threshold: 300, multiplier: 1.0 },
  { threshold: 400, multiplier: 0.8 },
  { threshold: 500, multiplier: 0.6 },
  { threshold: 600, multiplier: 0.5 },
];

export default function Home() {
  const { open } = useModal();
  const { isConnected } = usePhantom();
  
  // Phase state
  const [phase, setPhase] = useState<Phase>('discovery');
  const [discoveryVotes, setDiscoveryVotes] = useState<number[]>([]);
  const [selectedMcap, setSelectedMcap] = useState<number | null>(null);
  const [medianMcap, setMedianMcap] = useState<number>(100000);
  
  // Predict phase state
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([]);
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<number>(1);
  const [settlementPrice, setSettlementPrice] = useState<number>(87500);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [timeProgress, setTimeProgress] = useState(70);
  
  // Countdown
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 58, seconds: 30 });

  const totalBets = priceLevels.reduce((sum, level) => sum + level.yes + level.no, 0);
  const totalSOL = priceLevels.reduce((sum, level) => sum + (level.yes + level.no) * 15, 0);

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${Math.round(price / 1000)}k`;
    return `$${price}`;
  };

  // Discovery phase: calculate median and transition
  useEffect(() => {
    if (phase === 'discovery' && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0) {
      // Calculate median from votes
      if (discoveryVotes.length > 0) {
        const sorted = [...discoveryVotes].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        setMedianMcap(median);
      }
      // Transition to predict phase
      setPhase('predict');
      setPriceLevels(generatePriceLevels(medianMcap));
      setPriceHistory(generateInitialHistory(medianMcap));
      setSettlementPrice(medianMcap * 0.9);
      setCountdown({ hours: 23, minutes: 0, seconds: 0 });
    }
  }, [phase, countdown, discoveryVotes, medianMcap]);

  // Simulate discovery votes
  useEffect(() => {
    if (phase !== 'discovery') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomMcap = PRESET_MCAPS[Math.floor(Math.random() * PRESET_MCAPS.length)];
        setDiscoveryVotes(prev => [...prev, randomMcap]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const calculateSettlement = useCallback(() => {
    if (priceLevels.length === 0) return medianMcap;
    let total = 0;
    let weightedSum = 0;
    priceLevels.forEach(level => {
      const netBets = level.yes - level.no * 0.5;
      weightedSum += level.price * netBets;
      total += Math.abs(netBets);
    });
    const base = total > 0 ? weightedSum / total : medianMcap;
    const variance = (Math.random() - 0.5) * medianMcap * 0.2;
    return Math.max(medianMcap * 0.2, Math.min(medianMcap * 3, base + variance));
  }, [priceLevels, medianMcap]);

  const calculateAccuracy = (breakpoint: number, settlement: number, betType: 'yes' | 'no') => {
    const distance = Math.abs(breakpoint - settlement);
    const baseAccuracy = 1 / (1 + Math.pow(distance / settlement, 2));
    const isCorrect = betType === 'yes' ? settlement >= breakpoint : settlement < breakpoint;
    return isCorrect ? baseAccuracy : baseAccuracy * 0.67;
  };

  const getMultiplier = (breakpoint: number) => {
    const level = priceLevels.find(l => l.price === breakpoint);
    if (!level) return 1.5;
    const totalSOLOnBreakpoint = (level.yes + level.no) * 20;
    const tier = MULTIPLIER_TIERS.find(t => totalSOLOnBreakpoint < t.threshold + 100) || MULTIPLIER_TIERS[MULTIPLIER_TIERS.length - 1];
    return tier.multiplier;
  };

  const calculateTokens = (breakpoint: number, sol: number, settlement: number) => {
    const accuracy = calculateAccuracy(breakpoint, settlement, prediction);
    const multiplier = getMultiplier(breakpoint);
    const weight = sol * accuracy * multiplier;
    const totalWeight = 500;
    const tokens = 800000000 * (weight / totalWeight);
    return { tokens, accuracy, multiplier };
  };

  // Predict phase simulation
  useEffect(() => {
    if (phase !== 'predict') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5 && priceLevels.length > 0) {
        const randomLevel = priceLevels[Math.floor(Math.random() * priceLevels.length)];
        const betType = Math.random() > 0.5 ? 'yes' : 'no';
        const betAmount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
        
        setPriceLevels(prev => {
          const newLevels = [...prev];
          const levelIndex = newLevels.findIndex(l => l.price === randomLevel.price);
          if (levelIndex !== -1) {
            const newDot: Bet = { type: betType, x: 85 + Math.random() * 10 };
            newLevels[levelIndex] = {
              ...newLevels[levelIndex],
              [betType]: newLevels[levelIndex][betType] + 1,
              dots: [...newLevels[levelIndex].dots, newDot],
            };
          }
          return newLevels;
        });

        const names = ['anon', 'whale.sol', 'degen_42', 'early_bird', 'diamond_hands', 'ser_pump', 'moon_boy'];
        const name = names[Math.floor(Math.random() * names.length)];
        setActivities(prev => [
          `${name} bet ${betAmount} SOL ${betType.toUpperCase()} @ ${formatPrice(randomLevel.price)}`,
          ...prev.slice(0, 6)
        ]);
      }

      const newSettlement = calculateSettlement();
      setSettlementPrice(newSettlement);
      
      setTimeProgress(prev => {
        const newTime = Math.min(95, prev + 0.3);
        setPriceHistory(history => [...history, { time: newTime, price: newSettlement }]);
        return newTime;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [phase, priceLevels, calculateSettlement]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 0; minutes = 0; seconds = 0; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDiscoveryVote = () => {
    if (!isConnected) {
      open();
      return;
    }
    if (selectedMcap) {
      setDiscoveryVotes(prev => [...prev, selectedMcap]);
      setActivities(prev => [`You voted for ${formatPrice(selectedMcap)} mcap`, ...prev.slice(0, 6)]);
    }
  };

  const handlePlaceBet = () => {
    if (!isConnected) {
      open();
      return;
    }
    if (selectedBreakpoint) {
      setPriceLevels(prev => {
        const newLevels = [...prev];
        const levelIndex = newLevels.findIndex(l => l.price === selectedBreakpoint);
        if (levelIndex !== -1) {
          const newDot: Bet = { type: prediction, x: timeProgress };
          newLevels[levelIndex] = {
            ...newLevels[levelIndex],
            [prediction]: newLevels[levelIndex][prediction] + 1,
            dots: [...newLevels[levelIndex].dots, newDot],
          };
        }
        return newLevels;
      });
      setActivities(prev => [
        `You bet ${amount} SOL ${prediction.toUpperCase()} @ ${formatPrice(selectedBreakpoint)}`,
        ...prev.slice(0, 6)
      ]);
    }
  };

  const selectedLevel = priceLevels.find(l => l.price === selectedBreakpoint);
  const currentMultiplier = selectedBreakpoint ? getMultiplier(selectedBreakpoint) : 1.5;
  const solOnBreakpoint = selectedLevel ? (selectedLevel.yes + selectedLevel.no) * 20 : 0;
  const maxBets = Math.max(...priceLevels.map(l => l.yes + l.no), 1);

  // Get vote counts for discovery
  const voteCounts = PRESET_MCAPS.map(mcap => ({
    mcap,
    count: discoveryVotes.filter(v => v === mcap).length,
  }));
  const maxVotes = Math.max(...voteCounts.map(v => v.count), 1);

  return (
    <>
      <Header />
      <div style={containerStyle}>
        {/* Top Bar */}
        <div style={topBarStyle}>
          <div style={projectNameStyle}>
            <span style={projectTitleStyle}>$DEMO Token Launch</span>
          </div>
          <div style={phaseIndicatorStyle(phase)}>
            {phase === 'discovery' ? 'DISCOVERY PHASE' : phase === 'predict' ? 'PREDICT PHASE' : 'SETTLEMENT'}
          </div>
          {phase === 'predict' && (
            <div style={settlementDisplayStyle}>
              <span style={settlementLabelStyle}>SETTLEMENT</span>
              <span style={settlementValueStyle}>{formatPrice(settlementPrice)}</span>
            </div>
          )}
          <div style={countdownStyle}>
            {String(countdown.hours).padStart(2, '0')}:
            {String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Main Content */}
        <div style={contentStyle}>
          {/* DISCOVERY PHASE */}
          {phase === 'discovery' && (
            <>
              <div style={discoveryLeftStyle}>
                <div style={sectionHeaderStyle}>
                  <span style={headerTextStyle}>SELECT EXPECTED MARKET CAP</span>
                  <span style={betsCountStyle}>{discoveryVotes.length} votes</span>
                </div>
                
                <div style={mcapGridStyle}>
                  {PRESET_MCAPS.map(mcap => {
                    const voteData = voteCounts.find(v => v.mcap === mcap);
                    const count = voteData?.count || 0;
                    const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                    const isSelected = selectedMcap === mcap;
                    
                    return (
                      <div
                        key={mcap}
                        onClick={() => setSelectedMcap(mcap)}
                        style={mcapItemStyle(isSelected)}
                      >
                        <div style={mcapLabelStyle(isSelected)}>{formatPrice(mcap)}</div>
                        <div style={mcapBarContainerStyle}>
                          <div style={mcapBarStyle(barWidth)}></div>
                        </div>
                        <div style={mcapCountStyle}>{count}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={discoveryInfoStyle}>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>YOUR VOTE</span>
                    <span style={infoValueStyle}>{selectedMcap ? formatPrice(selectedMcap) : 'Select above'}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>CURRENT MEDIAN</span>
                    <span style={infoValueStyle}>
                      {discoveryVotes.length > 0 
                        ? formatPrice(discoveryVotes.sort((a,b) => a-b)[Math.floor(discoveryVotes.length/2)])
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={discoveryRightStyle}>
                <div style={panelTitleStyle}>DISCOVERY PHASE</div>
                <p style={descriptionStyle}>
                  Vote on what you think this token's market cap should be. After the discovery phase ends, 
                  the median of all votes will determine the breakpoints for the prediction phase.
                </p>
                <div style={phaseInfoBoxStyle}>
                  <div style={phaseInfoRowStyle}>
                    <span style={phaseInfoLabelStyle}>PHASE</span>
                    <span style={phaseInfoValueStyle}>1 of 3</span>
                  </div>
                  <div style={phaseInfoRowStyle}>
                    <span style={phaseInfoLabelStyle}>DURATION</span>
                    <span style={phaseInfoValueStyle}>1 hour</span>
                  </div>
                  <div style={phaseInfoRowStyle}>
                    <span style={phaseInfoLabelStyle}>NEXT</span>
                    <span style={phaseInfoValueStyle}>Predict Phase (23h)</span>
                  </div>
                </div>
                <button
                  onClick={handleDiscoveryVote}
                  style={submitBtnStyle(!isConnected || !!selectedMcap)}
                >
                  {!isConnected ? 'CONNECT WALLET' : selectedMcap ? 'SUBMIT VOTE' : 'SELECT MARKET CAP'}
                </button>
              </div>
            </>
          )}

          {/* PREDICT PHASE */}
          {phase === 'predict' && (
            <>
              <div style={chartPanelStyle}>
                <div style={sectionHeaderStyle}>
                  <span style={headerTextStyle}>CLICK CHART TO SELECT BREAKPOINT</span>
                  <span style={betsCountStyle}>{totalBets} bets / {totalSOL} SOL</span>
                </div>

                <PriceChart
                  priceHistory={priceHistory}
                  currentPrice={settlementPrice}
                  minPrice={medianMcap * 0.15}
                  maxPrice={medianMcap * 3.5}
                  onSelectPrice={setSelectedBreakpoint}
                  selectedPrice={selectedBreakpoint}
                />

                <div style={breakpointsPanelStyle}>
                  <div style={breakpointsTitleStyle}>BET DISTRIBUTION</div>
                  {priceLevels.map(level => {
                    const total = level.yes + level.no;
                    const yesWidth = total > 0 ? (level.yes / maxBets) * 100 : 0;
                    const noWidth = total > 0 ? (level.no / maxBets) * 100 : 0;
                    const isSelected = selectedBreakpoint === level.price;
                    
                    return (
                      <div 
                        key={level.price}
                        onClick={() => setSelectedBreakpoint(level.price)}
                        style={breakpointRowStyle(isSelected)}
                      >
                        <div style={breakpointPriceStyle(isSelected)}>{formatPrice(level.price)}</div>
                        <div style={breakpointBarContainerStyle}>
                          <div style={yesBarStyle(yesWidth)}></div>
                          <div style={noBarStyle(noWidth)}></div>
                        </div>
                        <div style={breakpointCountsStyle}>
                          <span style={{ color: '#22c55e' }}>{level.yes}</span>
                          <span style={{ color: '#333' }}> / </span>
                          <span style={{ color: '#ef4444' }}>{level.no}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activities.length > 0 && (
                  <div style={activityFeedStyle}>
                    <div style={activityTitleStyle}>LIVE ACTIVITY</div>
                    {activities.map((activity, i) => (
                      <div key={i} style={activityItemStyle}>{activity}</div>
                    ))}
                  </div>
                )}
              </div>

              <div style={betPanelStyle}>
                <div style={panelTitleStyle}>PLACE YOUR BET</div>

                <div style={sectionStyle}>
                  <div style={labelStyle}>SELECTED BREAKPOINT</div>
                  <div style={breakpointValueStyle}>
                    {selectedBreakpoint ? formatPrice(selectedBreakpoint) : 'Click chart'}
                  </div>
                </div>

                <div style={sectionStyle}>
                  <div style={labelStyle}>YOUR PREDICTION</div>
                  <div style={toggleContainerStyle}>
                    <button
                      onClick={() => setPrediction('yes')}
                      style={toggleBtnStyle(prediction === 'yes', 'yes')}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setPrediction('no')}
                      style={toggleBtnStyle(prediction === 'no', 'no')}
                    >
                      NO
                    </button>
                  </div>
                  <div style={hintStyle}>
                    Price will be {prediction === 'yes' ? '>=' : '<'} {selectedBreakpoint ? formatPrice(selectedBreakpoint) : '?'}
                  </div>
                </div>

                <div style={sectionStyle}>
                  <div style={labelStyle}>AMOUNT (SOL)</div>
                  <div style={amountContainerStyle}>
                    {AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt)}
                        style={amountBtnStyle(amount === amt)}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBreakpoint && (
                  <div style={multiplierBoxStyle}>
                    <div style={multiplierRowStyle}>
                      <span style={labelStyle}>YOUR MULTIPLIER</span>
                      <span style={multiplierValueStyle}>{currentMultiplier.toFixed(1)}x</span>
                    </div>
                    <div style={multiplierHintStyle}>
                      {solOnBreakpoint.toFixed(0)} SOL on this breakpoint
                    </div>
                  </div>
                )}

                {selectedBreakpoint && (
                  <div style={calculatorBoxStyle}>
                    <div style={calculatorTitleStyle}>IF SETTLEMENT IS...</div>
                    {[selectedBreakpoint * 0.75, selectedBreakpoint, selectedBreakpoint * 1.5].map((settlement, i) => {
                      const { tokens, accuracy } = calculateTokens(selectedBreakpoint, amount, settlement);
                      const isHighlight = i === 1;
                      return (
                        <div key={i} style={calculatorRowStyle(isHighlight)}>
                          <span style={calculatorPriceStyle}>{formatPrice(settlement)}</span>
                          <span style={calculatorTokensStyle(isHighlight)}>
                            {(tokens / 1000000).toFixed(1)}M
                          </span>
                          <span style={calculatorAccuracyStyle}>
                            {(accuracy * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handlePlaceBet}
                  style={submitBtnStyle(!isConnected || !!selectedBreakpoint)}
                >
                  {!isConnected ? 'CONNECT WALLET' : selectedBreakpoint ? 'PLACE BET' : 'SELECT A BREAKPOINT'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '60px',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 24px',
  borderBottom: '1px solid #222',
  flexWrap: 'wrap',
  gap: '12px',
};

const projectNameStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const projectTitleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '16px',
  fontWeight: 600,
};

const phaseIndicatorStyle = (phase: Phase): React.CSSProperties => ({
  padding: '6px 12px',
  backgroundColor: phase === 'discovery' ? '#f97316' : phase === 'predict' ? '#22c55e' : '#3b82f6',
  color: '#000',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
});

const settlementDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const settlementLabelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '11px',
};

const settlementValueStyle: React.CSSProperties = {
  color: '#22c55e',
  fontSize: '16px',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const countdownStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '20px',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  padding: '16px',
  gap: '16px',
  flexDirection: 'row',
  flexWrap: 'wrap',
};

// Discovery styles
const discoveryLeftStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const discoveryRightStyle: React.CSSProperties = {
  width: '320px',
  minWidth: '280px',
  flex: '0 0 auto',
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const mcapGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '16px',
};

const mcapItemStyle = (isSelected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#1a1a1a' : 'transparent',
  borderLeft: isSelected ? '2px solid #f97316' : '2px solid transparent',
  transition: 'all 0.15s',
});

const mcapLabelStyle = (isSelected: boolean): React.CSSProperties => ({
  width: '80px',
  color: isSelected ? '#fff' : '#888',
  fontSize: '13px',
  fontFamily: 'monospace',
});

const mcapBarContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '16px',
  backgroundColor: '#111',
  marginRight: '12px',
};

const mcapBarStyle = (width: number): React.CSSProperties => ({
  height: '100%',
  width: `${width}%`,
  backgroundColor: '#f97316',
  transition: 'width 0.3s',
});

const mcapCountStyle: React.CSSProperties = {
  width: '40px',
  textAlign: 'right',
  color: '#666',
  fontSize: '12px',
  fontFamily: 'monospace',
};

const discoveryInfoStyle: React.CSSProperties = {
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '16px',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #1a1a1a',
};

const infoLabelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '11px',
  letterSpacing: '0.05em',
};

const infoValueStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'monospace',
};

const descriptionStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '13px',
  lineHeight: 1.5,
};

const phaseInfoBoxStyle: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #222',
  padding: '12px',
};

const phaseInfoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
};

const phaseInfoLabelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '11px',
};

const phaseInfoValueStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '12px',
};

// Predict styles
const chartPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const headerTextStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '11px',
  letterSpacing: '0.05em',
};

const betsCountStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '12px',
};

const breakpointsPanelStyle: React.CSSProperties = {
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '12px',
};

const breakpointsTitleStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '10px',
  letterSpacing: '0.1em',
  marginBottom: '8px',
};

const breakpointRowStyle = (isSelected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 0',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#111' : 'transparent',
});

const breakpointPriceStyle = (isSelected: boolean): React.CSSProperties => ({
  width: '60px',
  color: isSelected ? '#fff' : '#666',
  fontSize: '12px',
  fontFamily: 'monospace',
});

const breakpointBarContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '14px',
  display: 'flex',
  gap: '1px',
};

const yesBarStyle = (width: number): React.CSSProperties => ({
  backgroundColor: '#22c55e',
  height: '100%',
  width: `${width}%`,
  transition: 'width 0.3s',
});

const noBarStyle = (width: number): React.CSSProperties => ({
  backgroundColor: '#ef4444',
  height: '100%',
  width: `${width}%`,
  transition: 'width 0.3s',
});

const breakpointCountsStyle: React.CSSProperties = {
  width: '70px',
  textAlign: 'right',
  fontSize: '11px',
  fontFamily: 'monospace',
};

const activityFeedStyle: React.CSSProperties = {
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '12px',
  maxHeight: '120px',
  overflow: 'auto',
};

const activityTitleStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '10px',
  letterSpacing: '0.1em',
  marginBottom: '6px',
};

const activityItemStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '11px',
  padding: '3px 0',
  borderBottom: '1px solid #1a1a1a',
};

const betPanelStyle: React.CSSProperties = {
  width: '320px',
  minWidth: '280px',
  flex: '0 0 auto',
  backgroundColor: '#000',
  border: '1px solid #333',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const panelTitleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.05em',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '10px',
  letterSpacing: '0.1em',
};

const breakpointValueStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '24px',
  fontFamily: 'monospace',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
};

const toggleBtnStyle = (isActive: boolean, type: 'yes' | 'no'): React.CSSProperties => ({
  flex: 1,
  padding: '10px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: isActive ? (type === 'yes' ? '#22c55e' : '#ef4444') : '#222',
  color: isActive ? '#000' : '#666',
  transition: 'all 0.15s',
});

const hintStyle: React.CSSProperties = {
  color: '#444',
  fontSize: '12px',
};

const amountContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
};

const amountBtnStyle = (isActive: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px',
  fontFamily: 'monospace',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: isActive ? '#f97316' : '#222',
  color: isActive ? '#000' : '#666',
  transition: 'all 0.15s',
});

const multiplierBoxStyle: React.CSSProperties = {
  backgroundColor: '#111',
  padding: '10px',
  border: '1px solid #222',
};

const multiplierRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const multiplierValueStyle: React.CSSProperties = {
  color: '#f97316',
  fontSize: '16px',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const multiplierHintStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '10px',
  marginTop: '4px',
};

const calculatorBoxStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #1a1a1a',
  padding: '12px',
};

const calculatorTitleStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '10px',
  letterSpacing: '0.1em',
  marginBottom: '8px',
};

const calculatorRowStyle = (isHighlight: boolean): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid #1a1a1a',
  backgroundColor: isHighlight ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
  margin: isHighlight ? '0 -12px' : 0,
  paddingLeft: isHighlight ? '12px' : 0,
  paddingRight: isHighlight ? '12px' : 0,
});

const calculatorPriceStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '12px',
  fontFamily: 'monospace',
};

const calculatorTokensStyle = (isHighlight: boolean): React.CSSProperties => ({
  color: isHighlight ? '#22c55e' : '#fff',
  fontSize: '12px',
  fontFamily: 'monospace',
});

const calculatorAccuracyStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '10px',
};

const submitBtnStyle = (isActive: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '14px',
  fontWeight: 600,
  cursor: isActive ? 'pointer' : 'not-allowed',
  border: 'none',
  backgroundColor: isActive ? '#22c55e' : '#222',
  color: isActive ? '#000' : '#444',
  marginTop: 'auto',
  transition: 'all 0.15s',
});
