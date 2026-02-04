'use client';

import { useState } from 'react';
import { useModal, usePhantom } from '@phantom/react-sdk';

// Mock data for bets at different price levels
const PRICE_LEVELS = [
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

const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  container: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    gap: '16px',
  },
  chartPanel: {
    flex: 1,
    backgroundColor: '#000',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '24px',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orangeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f97316',
  },
  headerText: {
    color: '#666',
    fontSize: '12px',
    letterSpacing: '0.05em',
  },
  betsCount: {
    color: '#666',
    fontSize: '14px',
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
    right: '80px',
    height: '1px',
    backgroundColor: '#222',
  },
  dot: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  betCounts: {
    width: '96px',
    textAlign: 'right' as const,
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  betPanel: {
    width: '320px',
    backgroundColor: '#000',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '24px',
  },
  panelTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    marginBottom: '24px',
  },
  label: {
    color: '#666',
    fontSize: '12px',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'block',
  },
  breakpointValue: {
    color: '#fff',
    fontSize: '24px',
    fontFamily: 'monospace',
    marginBottom: '24px',
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  toggleBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  predictionHint: {
    color: '#444',
    fontSize: '14px',
    marginBottom: '24px',
  },
  amountContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  amountBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
};

export default function Home() {
  const { open } = useModal();
  const { isConnected } = usePhantom();
  
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<number>(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const totalBets = PRICE_LEVELS.reduce((sum, level) => sum + level.yes + level.no, 0);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price / 1000}k`;
    }
    return `$${price}`;
  };

  const handlePlaceBet = () => {
    if (!isConnected) {
      open();
      return;
    }
    alert(`Demo: Placing ${prediction.toUpperCase()} bet of ${amount} SOL at ${formatPrice(selectedBreakpoint!)}`);
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        
        {/* Left - Chart */}
        <div style={styles.chartPanel}>
          <div style={styles.chartHeader}>
            <div style={styles.headerLeft}>
              <span style={styles.orangeDot}></span>
              <span style={styles.headerText}>CLICK TO SELECT BREAKPOINT</span>
            </div>
            <span style={styles.betsCount}>{totalBets} bets</span>
          </div>

          <div>
            {PRICE_LEVELS.map((level) => (
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
        </div>

        {/* Right - Bet Panel */}
        <div style={styles.betPanel}>
          <h2 style={styles.panelTitle}>PLACE YOUR BET</h2>

          <label style={styles.label}>SELECTED BREAKPOINT</label>
          <div style={styles.breakpointValue}>
            {selectedBreakpoint ? formatPrice(selectedBreakpoint) : 'Click chart to select'}
          </div>

          <label style={styles.label}>YOUR PREDICTION</label>
          <div style={styles.toggleContainer}>
            <button
              onClick={() => setPrediction('yes')}
              style={{
                ...styles.toggleBtn,
                backgroundColor: prediction === 'yes' ? '#22c55e' : '#333',
                color: prediction === 'yes' ? '#000' : '#888',
              }}
            >
              YES
            </button>
            <button
              onClick={() => setPrediction('no')}
              style={{
                ...styles.toggleBtn,
                backgroundColor: prediction === 'no' ? '#ef4444' : '#333',
                color: prediction === 'no' ? '#000' : '#888',
              }}
            >
              NO
            </button>
          </div>
          <p style={styles.predictionHint}>
            Price will be {prediction === 'yes' ? '≥' : '<'} {selectedBreakpoint ? formatPrice(selectedBreakpoint) : '?'}
          </p>

          <label style={styles.label}>AMOUNT (SOL)</label>
          <div style={styles.amountContainer}>
            {AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                style={{
                  ...styles.amountBtn,
                  backgroundColor: amount === amt ? '#f97316' : '#333',
                  color: amount === amt ? '#000' : '#888',
                }}
              >
                {amt}
              </button>
            ))}
          </div>

          <button
            onClick={handlePlaceBet}
            style={{
              ...styles.submitBtn,
              backgroundColor: !isConnected || selectedBreakpoint ? '#22c55e' : '#333',
              color: !isConnected || selectedBreakpoint ? '#000' : '#666',
              cursor: !isConnected || selectedBreakpoint ? 'pointer' : 'not-allowed',
            }}
          >
            {!isConnected ? 'CONNECT WALLET' : selectedBreakpoint ? 'PLACE BET' : 'SELECT A BREAKPOINT'}
          </button>
        </div>
      </div>
    </main>
  );
}
