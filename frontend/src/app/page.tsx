'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModal, usePhantom } from '@phantom/react-sdk';
import { Header } from '@/components/Header';

// Types
interface Bet {
  type: 'yes' | 'no';
  x: number; // position on timeline (0-100)
}

interface PriceLevel {
  price: number;
  yes: number;
  no: number;
  dots: Bet[];
}

// Initial mock data
const INITIAL_PRICE_LEVELS: PriceLevel[] = [
  { price: 250000, yes: 1, no: 1, dots: [{ type: 'yes', x: 75 }, { type: 'no', x: 85 }] },
  { price: 200000, yes: 1, no: 1, dots: [{ type: 'yes', x: 25 }, { type: 'no', x: 80 }] },
  { price: 150000, yes: 2, no: 1, dots: [{ type: 'yes', x: 55 }, { type: 'yes', x: 70 }, { type: 'no', x: 82 }] },
  { price: 125000, yes: 1, no: 0, dots: [{ type: 'no', x: 30 }] },
  { price: 100000, yes: 1, no: 2, dots: [{ type: 'no', x: 40 }, { type: 'yes', x: 60 }, { type: 'no', x: 75 }] },
  { price: 75000, yes: 1, no: 2, dots: [{ type: 'no', x: 25 }, { type: 'yes', x: 50 }, { type: 'no', x: 78 }] },
  { price: 50000, yes: 4, no: 1, dots: [{ type: 'yes', x: 30 }, { type: 'yes', x: 38 }, { type: 'yes', x: 55 }, { type: 'no', x: 72 }, { type: 'yes', x: 85 }] },
  { price: 25000, yes: 2, no: 0, dots: [{ type: 'yes', x: 45 }, { type: 'yes', x: 62 }] },
];

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

const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column' as const,
    paddingTop: '60px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #222',
  },
  projectName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  projectEmoji: {
    fontSize: '24px',
  },
  projectTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
  },
  phaseIndicator: {
    padding: '6px 12px',
    backgroundColor: '#22c55e',
    color: '#000',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  countdown: {
    color: '#fff',
    fontSize: '24px',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  content: {
    flex: 1,
    display: 'flex',
    padding: '24px',
    gap: '24px',
  },
  chartPanel: {
    flex: 1,
    backgroundColor: '#000',
    border: '1px solid #333',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orangeDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#f97316',
  },
  headerText: {
    color: '#666',
    fontSize: '12px',
    letterSpacing: '0.05em',
  },
  settlementDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  settlementLabel: {
    color: '#666',
    fontSize: '12px',
  },
  settlementValue: {
    color: '#22c55e',
    fontSize: '16px',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  betsCount: {
    color: '#666',
    fontSize: '14px',
  },
  chartArea: {
    flex: 1,
    position: 'relative' as const,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  priceLabel: {
    width: '64px',
    color: '#666',
    fontSize: '14px',
    fontFamily: 'monospace',
  },
  dotsArea: {
    flex: 1,
    position: 'relative' as const,
    height: '100%',
  },
  horizontalLine: {
    position: 'absolute' as const,
    top: '50%',
    left: 0,
    right: '100px',
    height: '1px',
    backgroundColor: '#222',
  },
  settlementLine: {
    position: 'absolute' as const,
    left: 0,
    right: '100px',
    height: '2px',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 10px #22c55e',
    transition: 'top 0.5s ease-out',
    zIndex: 10,
  },
  dot: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '12px',
  },
  betCounts: {
    width: '100px',
    textAlign: 'right' as const,
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  betPanel: {
    width: '360px',
    backgroundColor: '#000',
    border: '1px solid #333',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  panelTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.1em',
  },
  breakpointValue: {
    color: '#fff',
    fontSize: '28px',
    fontFamily: 'monospace',
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    flex: 1,
    padding: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  predictionHint: {
    color: '#444',
    fontSize: '13px',
  },
  amountContainer: {
    display: 'flex',
    gap: '8px',
  },
  amountBtn: {
    flex: 1,
    padding: '12px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  multiplierBox: {
    backgroundColor: '#111',
    padding: '12px',
    border: '1px solid #333',
  },
  multiplierRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multiplierValue: {
    color: '#f97316',
    fontSize: '18px',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  multiplierHint: {
    color: '#666',
    fontSize: '11px',
    marginTop: '4px',
  },
  calculatorBox: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #222',
    padding: '16px',
  },
  calculatorTitle: {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.1em',
    marginBottom: '12px',
  },
  calculatorRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  calculatorPrice: {
    color: '#888',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  calculatorTokens: {
    color: '#fff',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  calculatorAccuracy: {
    color: '#666',
    fontSize: '11px',
  },
  calculatorHighlight: {
    backgroundColor: '#22c55e10',
    margin: '0 -16px',
    padding: '8px 16px',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    marginTop: 'auto',
  },
  activityFeed: {
    borderTop: '1px solid #222',
    paddingTop: '16px',
    marginTop: '16px',
  },
  activityTitle: {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  activityItem: {
    color: '#444',
    fontSize: '12px',
    padding: '4px 0',
  },
};

export default function Home() {
  const { open } = useModal();
  const { isConnected } = usePhantom();
  
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>(INITIAL_PRICE_LEVELS);
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<number>(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [settlementPrice, setSettlementPrice] = useState<number>(87500);
  const [countdown, setCountdown] = useState({ hours: 18, minutes: 42, seconds: 31 });
  const [activities, setActivities] = useState<string[]>([]);

  // Calculate total bets
  const totalBets = priceLevels.reduce((sum, level) => sum + level.yes + level.no, 0);
  const totalSOL = priceLevels.reduce((sum, level) => sum + (level.yes + level.no) * 15, 0); // rough estimate

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${price / 1000}k`;
    return `$${price}`;
  };

  // Calculate settlement price based on YES/NO distribution
  const calculateSettlement = useCallback(() => {
    let bestEquilibrium = priceLevels[Math.floor(priceLevels.length / 2)].price;
    let bestDiff = Infinity;

    for (let i = 0; i < priceLevels.length; i++) {
      const yesAbove = priceLevels.slice(i).reduce((sum, l) => sum + l.yes, 0);
      const noBelow = priceLevels.slice(0, i).reduce((sum, l) => sum + l.no, 0);
      const diff = Math.abs(yesAbove - noBelow);
      
      if (diff < bestDiff) {
        bestDiff = diff;
        bestEquilibrium = priceLevels[i].price;
      }
    }
    
    // Add some randomness for demo effect
    const variance = (Math.random() - 0.5) * 20000;
    return Math.max(25000, Math.min(250000, bestEquilibrium + variance));
  }, [priceLevels]);

  // Calculate accuracy for a given breakpoint
  const calculateAccuracy = (breakpoint: number, settlement: number, betType: 'yes' | 'no') => {
    const distance = Math.abs(breakpoint - settlement);
    const baseAccuracy = 1 / (1 + Math.pow(distance / settlement, 2));
    
    // Penalty for wrong direction
    const isCorrect = betType === 'yes' ? settlement >= breakpoint : settlement < breakpoint;
    return isCorrect ? baseAccuracy : baseAccuracy * 0.67;
  };

  // Get multiplier for a breakpoint
  const getMultiplier = (breakpoint: number) => {
    const level = priceLevels.find(l => l.price === breakpoint);
    if (!level) return 1.5;
    
    const totalSOLOnBreakpoint = (level.yes + level.no) * 20; // rough SOL estimate
    const tier = MULTIPLIER_TIERS.find(t => totalSOLOnBreakpoint < t.threshold + 100) || MULTIPLIER_TIERS[MULTIPLIER_TIERS.length - 1];
    return tier.multiplier;
  };

  // Calculate potential tokens
  const calculateTokens = (breakpoint: number, sol: number, settlement: number) => {
    const accuracy = calculateAccuracy(breakpoint, settlement, prediction);
    const multiplier = getMultiplier(breakpoint);
    const weight = sol * accuracy * multiplier;
    const totalWeight = 500; // simplified total
    const tokens = 800000000 * (weight / totalWeight);
    return { tokens, accuracy, multiplier };
  };

  // Simulate activity
  useEffect(() => {
    const interval = setInterval(() => {
      // Random bet simulation
      if (Math.random() > 0.6) {
        const randomLevel = priceLevels[Math.floor(Math.random() * priceLevels.length)];
        const betType = Math.random() > 0.5 ? 'yes' : 'no';
        const betAmount = [0.5, 1, 2, 5][Math.floor(Math.random() * 4)];
        
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

        // Add activity
        const names = ['anon', 'whale.sol', 'degen_42', 'early_bird', 'diamond_hands'];
        const name = names[Math.floor(Math.random() * names.length)];
        setActivities(prev => [
          `${name} bet ${betAmount} SOL ${betType.toUpperCase()} on ${formatPrice(randomLevel.price)}`,
          ...prev.slice(0, 4)
        ]);
      }

      // Update settlement
      setSettlementPrice(calculateSettlement());
    }, 3000);

    return () => clearInterval(interval);
  }, [priceLevels, calculateSettlement]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) hours = 0;
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceBet = () => {
    if (!isConnected) {
      open();
      return;
    }
    if (selectedBreakpoint) {
      // Add user's bet to the chart
      setPriceLevels(prev => {
        const newLevels = [...prev];
        const levelIndex = newLevels.findIndex(l => l.price === selectedBreakpoint);
        if (levelIndex !== -1) {
          const newDot: Bet = { type: prediction, x: 90 };
          newLevels[levelIndex] = {
            ...newLevels[levelIndex],
            [prediction]: newLevels[levelIndex][prediction] + 1,
            dots: [...newLevels[levelIndex].dots, newDot],
          };
        }
        return newLevels;
      });
      
      setActivities(prev => [
        `You bet ${amount} SOL ${prediction.toUpperCase()} on ${formatPrice(selectedBreakpoint)}`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  // Calculate settlement line position
  const getSettlementLinePosition = () => {
    const prices = priceLevels.map(l => l.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const position = ((settlementPrice - minPrice) / range) * 100;
    return Math.max(0, Math.min(100, 100 - position)); // Invert because 0 is top
  };

  const selectedLevel = priceLevels.find(l => l.price === selectedBreakpoint);
  const currentMultiplier = selectedBreakpoint ? getMultiplier(selectedBreakpoint) : 1.5;
  const solOnBreakpoint = selectedLevel ? (selectedLevel.yes + selectedLevel.no) * 20 : 0;

  return (
    <>
      <Header />
      <main style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.projectName}>
            <span style={styles.projectEmoji}>🚀</span>
            <span style={styles.projectTitle}>$DEMO Token Launch</span>
          </div>
          <div style={styles.phaseIndicator}>PREDICT PHASE</div>
          <div style={styles.countdown}>
            {String(countdown.hours).padStart(2, '0')}:
            {String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {/* Chart Panel */}
          <div style={styles.chartPanel}>
            <div style={styles.chartHeader}>
              <div style={styles.headerLeft}>
                <span style={styles.orangeDot}></span>
                <span style={styles.headerText}>CLICK TO SELECT BREAKPOINT</span>
              </div>
              <div style={styles.settlementDisplay}>
                <span style={styles.settlementLabel}>SETTLEMENT</span>
                <span style={styles.settlementValue}>{formatPrice(settlementPrice)}</span>
              </div>
              <span style={styles.betsCount}>{totalBets} bets · ~{totalSOL} SOL</span>
            </div>

            <div style={styles.chartArea}>
              {/* Settlement Line */}
              <div style={{
                ...styles.settlementLine,
                top: `${getSettlementLinePosition()}%`,
              }}></div>

              {priceLevels.map((level) => (
                <div 
                  key={level.price}
                  onClick={() => setSelectedBreakpoint(level.price)}
                  onMouseEnter={() => setHoveredRow(level.price)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    ...styles.priceRow,
                    backgroundColor: selectedBreakpoint === level.price 
                      ? '#111' 
                      : hoveredRow === level.price 
                        ? '#0a0a0a' 
                        : 'transparent',
                  }}
                >
                  <div style={styles.priceLabel}>{formatPrice(level.price)}</div>
                  <div style={styles.dotsArea}>
                    <div style={styles.horizontalLine}></div>
                    {level.dots.map((dot, dotIndex) => (
                      <div
                        key={dotIndex}
                        style={{
                          ...styles.dot,
                          backgroundColor: dot.type === 'yes' ? '#22c55e' : '#ef4444',
                          left: `${dot.x}%`,
                        }}
                      ></div>
                    ))}
                  </div>
                  <div style={styles.betCounts}>
                    {level.yes > 0 && <span style={{ color: '#22c55e' }}>{level.yes} YES</span>}
                    {level.yes > 0 && level.no > 0 && <span style={{ color: '#333' }}> </span>}
                    {level.no > 0 && <span style={{ color: '#ef4444' }}>{level.no} NO</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Feed */}
            {activities.length > 0 && (
              <div style={styles.activityFeed}>
                <div style={styles.activityTitle}>RECENT ACTIVITY</div>
                {activities.map((activity, i) => (
                  <div key={i} style={styles.activityItem}>{activity}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bet Panel */}
          <div style={styles.betPanel}>
            <div style={styles.panelTitle}>PLACE YOUR BET</div>

            {/* Selected Breakpoint */}
            <div style={styles.section}>
              <div style={styles.label}>SELECTED BREAKPOINT</div>
              <div style={styles.breakpointValue}>
                {selectedBreakpoint ? formatPrice(selectedBreakpoint) : 'Click chart'}
              </div>
            </div>

            {/* Prediction Toggle */}
            <div style={styles.section}>
              <div style={styles.label}>YOUR PREDICTION</div>
              <div style={styles.toggleContainer}>
                <button
                  onClick={() => setPrediction('yes')}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: prediction === 'yes' ? '#22c55e' : '#222',
                    color: prediction === 'yes' ? '#000' : '#666',
                  }}
                >
                  YES
                </button>
                <button
                  onClick={() => setPrediction('no')}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: prediction === 'no' ? '#ef4444' : '#222',
                    color: prediction === 'no' ? '#000' : '#666',
                  }}
                >
                  NO
                </button>
              </div>
              <div style={styles.predictionHint}>
                Price will be {prediction === 'yes' ? '≥' : '<'} {selectedBreakpoint ? formatPrice(selectedBreakpoint) : '?'}
              </div>
            </div>

            {/* Amount */}
            <div style={styles.section}>
              <div style={styles.label}>AMOUNT (SOL)</div>
              <div style={styles.amountContainer}>
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    style={{
                      ...styles.amountBtn,
                      backgroundColor: amount === amt ? '#f97316' : '#222',
                      color: amount === amt ? '#000' : '#666',
                    }}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier */}
            {selectedBreakpoint && (
              <div style={styles.multiplierBox}>
                <div style={styles.multiplierRow}>
                  <span style={styles.label}>YOUR MULTIPLIER</span>
                  <span style={styles.multiplierValue}>{currentMultiplier.toFixed(1)}x</span>
                </div>
                <div style={styles.multiplierHint}>
                  {solOnBreakpoint.toFixed(0)} SOL already on this breakpoint
                </div>
              </div>
            )}

            {/* Token Calculator */}
            {selectedBreakpoint && (
              <div style={styles.calculatorBox}>
                <div style={styles.calculatorTitle}>IF SETTLEMENT IS...</div>
                {[selectedBreakpoint * 0.75, selectedBreakpoint, selectedBreakpoint * 1.5].map((settlement, i) => {
                  const { tokens, accuracy } = calculateTokens(selectedBreakpoint, amount, settlement);
                  const isSelected = i === 1;
                  return (
                    <div 
                      key={i} 
                      style={{
                        ...styles.calculatorRow,
                        ...(isSelected ? styles.calculatorHighlight : {}),
                      }}
                    >
                      <span style={styles.calculatorPrice}>{formatPrice(settlement)}</span>
                      <span style={{
                        ...styles.calculatorTokens,
                        color: isSelected ? '#22c55e' : '#fff',
                      }}>
                        {(tokens / 1000000).toFixed(1)}M tokens
                      </span>
                      <span style={styles.calculatorAccuracy}>
                        {(accuracy * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePlaceBet}
              style={{
                ...styles.submitBtn,
                backgroundColor: !isConnected || selectedBreakpoint ? '#22c55e' : '#222',
                color: !isConnected || selectedBreakpoint ? '#000' : '#444',
                cursor: !isConnected || selectedBreakpoint ? 'pointer' : 'not-allowed',
              }}
            >
              {!isConnected ? 'CONNECT WALLET' : selectedBreakpoint ? 'PLACE BET' : 'SELECT A BREAKPOINT'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
