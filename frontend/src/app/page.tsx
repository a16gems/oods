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

export default function Home() {
  const { open } = useModal();
  const { isConnected } = usePhantom();
  
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<number>(1);

  const totalBets = PRICE_LEVELS.reduce((sum, level) => sum + level.yes + level.no, 0);
  const selectedLevel = PRICE_LEVELS.find(l => l.price === selectedBreakpoint);

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
    // TODO: Place bet logic
    alert(`Demo: Placing ${prediction.toUpperCase()} bet of ${amount} SOL at ${formatPrice(selectedBreakpoint!)}`);
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        
        {/* Left - Chart */}
        <div className="flex-1 bg-black border border-zinc-800 rounded-lg p-6">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-zinc-500 text-xs tracking-wider">CLICK TO SELECT BREAKPOINT</span>
            </div>
            <span className="text-zinc-500 text-sm">{totalBets} bets</span>
          </div>

          {/* Chart Area */}
          <div className="relative">
            {PRICE_LEVELS.map((level, index) => (
              <div 
                key={level.price}
                onClick={() => setSelectedBreakpoint(level.price)}
                className={`flex items-center h-12 cursor-pointer transition-all hover:bg-zinc-900/50 ${
                  selectedBreakpoint === level.price ? 'bg-zinc-900' : ''
                }`}
              >
                {/* Price Label */}
                <div className="w-16 text-zinc-500 text-sm font-mono">
                  {formatPrice(level.price)}
                </div>

                {/* Dots Area */}
                <div className="flex-1 relative h-full">
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-0 right-20 h-px bg-zinc-800/50"></div>
                  
                  {/* Dots */}
                  {level.dots.map((dot, dotIndex) => (
                    <div
                      key={dotIndex}
                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
                        dot.type === 'yes' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ left: `${dot.x}%` }}
                    ></div>
                  ))}
                </div>

                {/* Bet Counts */}
                <div className="w-24 text-right text-xs font-mono">
                  {level.yes > 0 && <span className="text-green-500">{level.yes} YES</span>}
                  {level.yes > 0 && level.no > 0 && <span className="text-zinc-600"> </span>}
                  {level.no > 0 && <span className="text-red-500">{level.no} NO</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Bet Panel */}
        <div className="w-full lg:w-80 bg-black border border-zinc-800 rounded-lg p-6">
          <h2 className="text-white text-lg font-semibold tracking-wide mb-6">PLACE YOUR BET</h2>

          {/* Selected Breakpoint */}
          <div className="mb-6">
            <label className="text-zinc-500 text-xs tracking-wider block mb-2">SELECTED BREAKPOINT</label>
            <div className="text-white text-2xl font-mono">
              {selectedBreakpoint ? formatPrice(selectedBreakpoint) : 'Click chart to select'}
            </div>
          </div>

          {/* Prediction Toggle */}
          <div className="mb-6">
            <label className="text-zinc-500 text-xs tracking-wider block mb-2">YOUR PREDICTION</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPrediction('yes')}
                className={`flex-1 py-3 rounded font-semibold transition-all ${
                  prediction === 'yes'
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setPrediction('no')}
                className={`flex-1 py-3 rounded font-semibold transition-all ${
                  prediction === 'no'
                    ? 'bg-red-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                NO
              </button>
            </div>
            <p className="text-zinc-600 text-sm mt-2">
              Price will be {prediction === 'yes' ? '≥' : '<'} {selectedBreakpoint ? formatPrice(selectedBreakpoint) : '?'}
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="text-zinc-500 text-xs tracking-wider block mb-2">AMOUNT (SOL)</label>
            <div className="flex gap-2">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`flex-1 py-3 rounded font-mono transition-all ${
                    amount === amt
                      ? 'bg-orange-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePlaceBet}
            disabled={!selectedBreakpoint && isConnected}
            className={`w-full py-4 rounded font-semibold transition-all ${
              !isConnected
                ? 'bg-green-500 text-black hover:bg-green-400'
                : selectedBreakpoint
                  ? 'bg-green-500 text-black hover:bg-green-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {!isConnected ? 'CONNECT WALLET' : selectedBreakpoint ? 'PLACE BET' : 'SELECT A BREAKPOINT'}
          </button>
        </div>
      </div>
    </main>
  );
}
