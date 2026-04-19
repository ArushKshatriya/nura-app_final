import React from 'react';
import { Leaf, Globe, Wind, Droplets, ArrowLeft, Scale } from 'lucide-react';
import Link from 'next/link';

export default function SustainabilityPage() {
  const pillars = [
    {
      title: "Carbon Intelligence",
      description: "We calculate the life-cycle CO2e of every ingredient, from farm-gate to your kitchen.",
      icon: <Wind size={20} className="text-blue-500" />,
      metric: "Real-time tracking"
    },
    {
      title: "Water Conservation",
      description: "Prioritizing recipes that use crops with lower irrigation requirements.",
      icon: <Droplets size={20} className="text-cyan-500" />,
      metric: "Liter-optimized"
    },
    {
      title: "Bio-Diversity",
      description: "Encouraging a diverse diet to support soil health and resilient ecosystems.",
      icon: <Leaf size={20} className="text-green-500" />,
      metric: "Varied sourcing"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-black">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center gap-8">
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <Leaf className="fill-black" /> NURA
        </Link>
        <div className="h-4 w-[2px] bg-gray-400" />
        <Link href="/" className="text-lg font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-2">
          <ArrowLeft size={20} /> Return to Nura
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32">
        {/* Editorial Header */}
        <div className="max-w-4xl mb-24">
          <span className="text-[13px] font-black uppercase tracking-[0.3em] text-green-600 mb-6 block">
            The Mission
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-10">
            Eating for the <br /> 
            <span className="text-gray-300 italic font-serif">Next Century.</span>
          </h1>
          <p className="text-2xl text-gray-500 leading-relaxed font-medium">
            Food production accounts for over <span className="text-black font-bold">25% of global emissions</span>. 
            NURA bridges the gap between personal health and planetary survival.
          </p>
        </div>

        {/* The "Math" Section - Glassmorphism Card */}
        <section className="bg-black rounded-[56px] p-8 md:p-16 text-white mb-24 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-6">How we calculate your impact.</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Our AI doesn't just guess. It utilizes environmental impact datasets to cross-reference 
                ingredient weight, transport distance, and production intensity.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                    <Scale size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Life Cycle Assessment (LCA)</p>
                    <p className="text-xs text-gray-500">Tracking impact from seed to table.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual Math Representation */}
            <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-10 border border-white/10 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">The NURA Formula</p>
                <div className="text-3xl md:text-4xl font-mono font-bold tracking-tighter">
                  (Mass × EF) + Transport = <span className="text-green-400">CO2e</span>
                </div>
                <div className="mt-8 h-[1px] w-full bg-white/10" />
                <p className="mt-6 text-sm text-gray-400">
                  By optimizing this equation, NURA users reduce their average food footprint by up to 30%.
                </p>
            </div>
          </div>
        </section>

        {/* The Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <div key={i} className="group p-10 bg-white rounded-[40px] border border-gray-100 transition-all hover:shadow-xl">
              <div className="mb-6">{pillar.icon}</div>
              <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {pillar.description}
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                {pillar.metric}
              </span>
            </div>
          ))}
        </div>

        {/* Simple Footer Callout */}
        <footer className="mt-32 text-center border-t border-gray-100 pt-20">
          <Globe className="mx-auto text-gray-200 mb-8" size={48} />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            NURA Project 2026 • Build with ❤️ by Arush for the planet.
          </p>
        </footer>
      </main>
    </div>
  );
}