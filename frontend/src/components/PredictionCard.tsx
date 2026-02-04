'use client';

import { useState } from 'react';
import { usePhantom, useModal } from '@phantom/react-sdk';

interface PriceLevel {
  price: string;
  percentage: number;
  multiplier: string;
}

const PRICE_LEVELS: PriceLevel[] = [
  { price: '$0.001', percentage: 15, multiplier: '2.5x' },
  { price: '$0.005', percentage: 35, multiplier: '1.8x' },
  { price: '$0.01', percentage: 30, multiplier: '1.5x' },
  { price: '$0.02', percentage: 15, multiplier: '1.2x' },
  { price: '$0.05', percentage: 5, multiplier: '1.1x' },
];

export function PredictionCard() {
  const { isConnected } = usePhantom();
  const { open } = useModal();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePredict = () => {
    if (!isConnected) {
      open();
      return;
    }
    
    if (selectedLevel !== null && betAmount) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const selectedPriceLevel = selectedLevel !== null ? PRICE_LEVELS[selectedLevel] : null;
  const potentialTokens = betAmount && selectedPriceLevel 
    ? (parseFloat(betAmount) * parseFloat(selectedPriceLevel.multiplier) * 1000).toFixed(0)
    : '0';

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">$DEMO Token</h3>
          <p className="text-white/50 text-sm">Demo prediction • 18h 42m left</p>
        </div>
        <div className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full">
          <span className="text-[#00ff88] text-sm font-medium">PREDICT</span>
        </div>
      </div>

      {/* Price Level Selection */}
      <div className="space-y-3 mb-6">
        <label className="text-white/70 text-sm font-medium">Select Price Level</label>
        <div className="space-y-2">
          {PRICE_LEVELS.map((level, index) => (
            <button
              key={index}
              onClick={() => setSelectedLevel(index)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedLevel === index
                  ? 'bg-[#00ff88]/10 border-[#00ff88]/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-lg font-bold ${selectedLevel === index ? 'text-[#00ff88]' : 'text-white'}`}>
                  {level.price}
                </span>
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00ff88]/50 rounded-full"
                    style={{ width: `${level.percentage}%` }}
                  />
                </div>
                <span className="text-white/50 text-sm">{level.percentage}%</span>
              </div>
              <span className={`font-medium ${selectedLevel === index ? 'text-[#00ff88]' : 'text-white/70'}`}>
                {level.multiplier}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-3 mb-6">
        <label className="text-white/70 text-sm font-medium">Bet Amount (SOL)</label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#00ff88]/50 transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              onClick={() => setBetAmount('0.1')}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-white/70"
            >
              0.1
            </button>
            <button 
              onClick={() => setBetAmount('0.5')}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-white/70"
            >
              0.5
            </button>
            <button 
              onClick={() => setBetAmount('1')}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-white/70"
            >
              1
            </button>
          </div>
        </div>
      </div>

      {/* Potential Reward */}
      {selectedLevel !== null && betAmount && (
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Potential Tokens</span>
            <span className="text-2xl font-bold gradient-text">{potentialTokens} $DEMO</span>
          </div>
          <p className="text-white/40 text-xs mt-2">
            If the final price settles at {selectedPriceLevel?.price}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handlePredict}
        disabled={!selectedLevel && isConnected}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
          isConnected
            ? selectedLevel !== null && betAmount
              ? 'bg-[#00ff88] text-black hover:bg-[#00cc6a] glow'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
            : 'bg-[#00ff88] text-black hover:bg-[#00cc6a] glow'
        }`}
      >
        {isConnected ? 'Place Prediction' : 'Connect Wallet to Predict'}
      </button>

      {/* Success Message */}
      {showSuccess && (
        <div className="mt-4 p-4 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl text-center">
          <p className="text-[#00ff88] font-medium">🎉 Prediction placed successfully!</p>
          <p className="text-white/50 text-sm mt-1">This is a demo. No real transaction was made.</p>
        </div>
      )}
    </div>
  );
}
