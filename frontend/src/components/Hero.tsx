'use client';

import { useModal, usePhantom } from '@phantom/react-sdk';

export function Hero() {
  const { open } = useModal();
  const { isConnected } = usePhantom();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      <div className="text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
          <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></span>
          <span className="text-white/70 text-sm">Prediction-Powered Token Launches</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
          <span className="text-white">BONDING CURVES</span>
          <br />
          <span className="gradient-text">ARE BULLSHIT</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
          First in, first win is not price discovery. It's a race. 
          <span className="text-white"> And you've already lost.</span>
        </p>

        {/* Problem Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-400">✕</span>
            <span className="text-white/70 text-sm">Insiders get cheap</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-400">✕</span>
            <span className="text-white/70 text-sm">Retail gets rekt</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-400">✕</span>
            <span className="text-white/70 text-sm">Whales frontrun</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!isConnected ? (
            <button
              onClick={open}
              className="px-8 py-4 bg-[#00ff88] text-black font-semibold rounded-xl hover:bg-[#00cc6a] transition-all glow text-lg"
            >
              Connect Wallet
            </button>
          ) : (
            <a
              href="#predict"
              className="px-8 py-4 bg-[#00ff88] text-black font-semibold rounded-xl hover:bg-[#00cc6a] transition-all glow text-lg"
            >
              Start Predicting
            </a>
          )}
          <a
            href="#how-it-works"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}
