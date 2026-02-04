'use client';

import { useModal, usePhantom, useAccounts, useDisconnect } from '@phantom/react-sdk';
import { useState } from 'react';

export function Header() {
  const { open } = useModal();
  const { isConnected, isLoading } = usePhantom();
  const accounts = useAccounts();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  // Get the first Solana address from accounts
  const solanaAddress = accounts && accounts.length > 0 ? accounts[0].address : '';
  const truncatedAddress = solanaAddress 
    ? `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`
    : '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold gradient-text">OODS</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#predict" className="text-white/70 hover:text-white transition-colors">
              Predict
            </a>
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="https://oods.to" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
              About
            </a>
          </nav>

          {/* Wallet Button */}
          <div className="relative">
            {isLoading ? (
              <button className="px-4 py-2 bg-white/10 rounded-lg text-white/50 cursor-wait">
                Loading...
              </button>
            ) : isConnected ? (
              <div>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-[#00ff88] hover:bg-[#00ff88]/20 transition-all"
                >
                  <span className="w-2 h-2 bg-[#00ff88] rounded-full"></span>
                  {truncatedAddress}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl">
                    <button
                      onClick={() => {
                        disconnect();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={open}
                className="px-6 py-2 bg-[#00ff88] text-black font-semibold rounded-lg hover:bg-[#00cc6a] transition-all glow-hover"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
