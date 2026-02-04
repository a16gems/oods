'use client';

const STEPS = [
  {
    number: '01',
    title: 'ANNOUNCE',
    subtitle: 'Launch begins',
    time: '0-1h',
    points: [
      'Project announces token launch',
      '24-hour countdown begins',
      'Team shares vision & roadmap',
    ],
  },
  {
    number: '02',
    title: 'PREDICT',
    subtitle: 'Crowd bets',
    time: '1-23h',
    points: [
      'Users bet SOL on price levels',
      'Early bets = higher multiplier',
      'Accurate bets = more tokens',
    ],
  },
  {
    number: '03',
    title: 'SETTLE',
    subtitle: 'Find fair price',
    time: '23-24h',
    points: [
      'Algorithm finds equilibrium',
      'Settlement = crowd consensus',
      'All positions calculate',
    ],
  },
  {
    number: '04',
    title: 'TRADE',
    subtitle: 'Go live',
    time: '24h+',
    points: [
      'Liquidity deploys to Meteora',
      'Tokens distributed by formula',
      'Trading starts at fair price',
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00ff88] text-sm font-medium mb-2">THE PROCESS</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            24 HOURS<br />
            <span className="text-white/50">FROM ZERO TO TRADING</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#00ff88]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl font-bold text-white/10 group-hover:text-[#00ff88]/20 transition-colors">
                  {step.number}
                </span>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                  {step.time}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
              <p className="text-white/50 text-sm mb-4">{step.subtitle}</p>
              
              <ul className="space-y-2">
                {step.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-[#00ff88]">→</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="mt-12 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between text-sm text-white/50 mb-4">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
            <span className="text-[#00ff88]">→ LIVE</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-gradient-to-r from-[#00ff88] to-[#00ff88]/50 rounded-full" />
          </div>
          <p className="text-center text-white/40 text-sm mt-4">Current: PREDICT</p>
        </div>
      </div>
    </section>
  );
}
