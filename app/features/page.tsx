import React from 'react';
import { 
  Refrigerator, 
  Sparkles, 
  Leaf, 
  BarChart3, 
  Zap, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      title: "Smart Pantry Logic",
      description: "Stop wondering what's for dinner. NURA scans your available ingredients and suggests recipes so nothing goes to waste.",
      icon: <Refrigerator size={24} />,
      color: "bg-yellow-400"
    },
    {
      title: "AI Meal Architect",
      description: "Whether you're bulking or cutting, our Gemini-powered engine crafts 1-day plans that hit your macros and your values.",
      icon: <Sparkles size={24} />,
      color: "bg-yellow-400"
    },
    {
      title: "Eco-Swap Engine",
      description: "Discover low-carbon alternatives for your favorite high-impact foods without sacrificing taste or nutrition.",
      icon: <Leaf size={24} />,
      color: "bg-yellow-400"
    },
    {
      title: "Precision Analytics",
      description: "Track your calorie intake alongside your carbon footprint. Visual data that helps you balance body and planet.",
      icon: <BarChart3 size={24} />,
      color: "bg-yellow-400"
    },
    {
      title: "Real-time CO2 Tracking",
      description: "Instant analysis of your meals. We convert grams of food into kilograms of CO2 impact automatically.",
      icon: <Zap size={24} />,
      color: "bg-yellow-400"
    },
    {
      title: "Privacy First",
      description: "Your health data is yours. Securely stored and encrypted with Supabase, giving you full control over your profile.",
      icon: <ShieldCheck size={24} />,
      color: "bg-yellow-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-black pb-20">
      {/* Simple Nav for Info Pages */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <Leaf className="fill-black" /> NURA
        </Link>
        <Link href="/" className="text-sm font-bold bg-black text-white px-6 py-2 rounded-full hover:opacity-80 transition-all">
          Back to App
        </Link>
      </nav>

      {/* Hero Header */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-600 mb-4 block">
            Capabilities
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
            The future of <br />
            <span className="text-gray-300 italic">intelligent</span> eating.
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-xl">
            NURA combines generative AI with sustainability metrics to transform your kitchen into a center for high-performance, low-impact living.
          </p>
        </div>
      </header>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="group bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`${feature.color} w-14 h-14 rounded-[20px] flex items-center justify-center mb-8 shadow-lg shadow-yellow-400/20`}>
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* Bottom Call to Action */}
      <section className="max-w-6xl mx-auto px-6 mt-32">
        <div className="bg-black rounded-[56px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
              Ready to optimize <br />your footprint?
            </h2>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 bg-yellow-400 text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all active:scale-95"
            >
              Get Started with NURA <ArrowRight size={20} />
            </Link>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
}