"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) alert(error.message);
      else alert("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
      else router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-sans antialiased">
      {/* Navigation */}
      <header className="flex justify-between items-center px-8 md:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-[#735c00]">🍃</span> NURA
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className="text-black border-b-2 border-[#facc15] pb-1"
          >
            Home
          </Link>
          <Link href="/features" className="hover:text-black transition-colors">
            Features
          </Link>
          <Link href="/sustainability" className="hover:text-black transition-colors">
            Sustainability
          </Link>
          <button
            onClick={() => setIsSignUp(false)}
            className="bg-[#facc15] px-6 py-2 rounded-lg text-[#231b00] font-bold text-xs active:scale-95 transition-transform"
          >
            Log In
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-8 md:px-12 pt-8 md:pt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left Column: Hero Content */}
        <div className="space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#e2e2e6] text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Sustainable Diet Planning
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-[#0f172a]">
            Fuel your body. <br />
            <span className="italic font-serif text-[#735c00]">
              Balance your footprint.
            </span>
          </h1>

          <ul className="space-y-5">
            {[
              { icon: "📊", text: "Track Eco-Scores" },
              { icon: "🔄", text: "Intelligent Food Swaps" },
              { icon: "🍴", text: "Personalized Sustainable Meal Plans" },
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-4 text-sm font-bold text-slate-700"
              >
                <span className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center shadow-sm">
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          {/* Hero Images */}
          <div className="relative pt-6">
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                alt="Healthy Bowl"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-4 w-32 h-32 md:w-44 md:h-44 rounded-[1.5rem] overflow-hidden border-8 border-[#f8f9fa] shadow-2xl hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400"
                alt="Vegetables"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100">
            {/* Tab Switcher */}
            <div className="flex bg-[#f1f3f5] p-1.5 rounded-full mb-10">
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${
                  isSignUp
                    ? "bg-[#facc15] shadow-md text-[#231b00]" // Changed from bg-white to yellow
                    : "text-slate-500"
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 text-xs font-bold rounded-full transition-all ${!isSignUp ? "bg-[#facc15] shadow-md text-[#231b00]" : "text-slate-500"}`}
              >
                Log In
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0f172a]">
                {isSignUp ? "Join NURA" : "Welcome back."}
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                {isSignUp
                  ? "Start your sustainable journey today."
                  : "Sign in to continue your journey."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] border-none focus:ring-2 focus:ring-[#facc15] outline-none transition-all"
                    placeholder="Arush"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] border-none focus:ring-2 focus:ring-[#facc15] outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Password
                  </label>
                  {!isSignUp && (
                    <Link
                      href="#"
                      className="text-[10px] font-bold text-[#735c00] hover:underline"
                    >
                      FORGOT PASSWORD?
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] border-none focus:ring-2 focus:ring-[#facc15] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] border-none focus:ring-2 focus:ring-[#facc15] outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-bold py-4 rounded-2xl shadow-xl shadow-yellow-100 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
              >
                {loading
                  ? "Processing..."
                  : isSignUp
                    ? "Create Account"
                    : "Log In"}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white px-4 text-slate-300">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-[#0f172a] font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </div>
        </div>
      </main>

      {/* Footer / Impact Section */}
      <section className="max-w-7xl mx-auto px-12 py-24 mt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-bold mb-4 text-[#0f172a]">
            Designed for impact.
          </h2>
          <p className="text-slate-500 italic max-w-lg text-lg">
            "NURA combines state-of-the-art nutritional science with a deep
            commitment to planetary health."
          </p>
        </div>
        <div className="bg-white px-10 py-6 rounded-3xl text-center shadow-lg border border-slate-50 relative group">
          <div className="text-5xl font-black text-[#0f172a] group-hover:text-[#735c00] transition-colors">
            85%
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Carbon Reduction
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-[#facc15]/5 rounded-3xl -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-12 py-8 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div>NURA</div>
        <div className="flex gap-8">
          <Link href="#">Terms of Service</Link>
          <span>© 2026 NURA Sustainability. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
