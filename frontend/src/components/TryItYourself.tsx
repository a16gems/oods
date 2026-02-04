'use client';

import { PredictionCard } from './PredictionCard';

export function TryItYourself() {
  return (
    <section id="predict" className="py-20 px-4 bg-gradient-to-b from-transparent to-[#0a0a0a]/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div>
            <p className="text-[#00ff88] text-sm font-medium mb-2">TRY IT YOURSELF</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Predict the<br />
              <span className="gradient-text">Fair Price</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Pick a price level you think the token will settle at. 
              The earlier you bet, the higher your multiplier. 
              The more accurate your prediction, the more tokens you receive.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00ff88]">1</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Select a price level</h4>
                  <p className="text-white/50 text-sm">Choose where you think the token will settle</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00ff88]">2</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Enter your bet amount</h4>
                  <p className="text-white/50 text-sm">Bet SOL on your predicted price level</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00ff88]">3</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Receive tokens at settlement</h4>
                  <p className="text-white/50 text-sm">Accurate predictions = more tokens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Prediction Card */}
          <div className="flex justify-center lg:justify-end">
            <PredictionCard />
          </div>
        </div>
      </div>
    </section>
  );
}
