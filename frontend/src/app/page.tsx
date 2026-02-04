'use client';

import { Header, Hero, TryItYourself, HowItWorks } from "@/components";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <Hero />
      <TryItYourself />
      <HowItWorks />
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">OODS</span>
              <span className="text-white/40 text-sm">Prediction-Powered Launches</span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://oods.to" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Website
              </a>
              <a 
                href="https://x.com/oodsto" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Twitter
              </a>
              <a 
                href="https://github.com/a16gems/oods" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                GitHub
              </a>
            </div>
          </div>
          <p className="text-center text-white/30 text-xs mt-8">
            © 2026 Oods. Built for the Colosseum Agent Hackathon.
          </p>
        </div>
      </footer>
    </main>
  );
}
