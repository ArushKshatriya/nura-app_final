"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Leaf, Zap, Droplets } from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- 1. TYPES & INTERFACES ---
interface SwapData {
  name: string;
  carbon: number;
  ingredient: string;
  saving: number;
  reason: string;
}

// --- 2. THE CONTENT COMPONENT (Internal logic) ---
function EcoSwapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get("id");

  const [mealData, setMealData] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<SwapData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch specific meal details based on the URL ID
  useEffect(() => {
    async function fetchMeal() {
      if (!mealId) return;
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", mealId)
        .single();

      if (data) setMealData(data);
      if (error) console.error("Error fetching meal:", error.message);
    }
    fetchMeal();
  }, [mealId]);

  useEffect(() => {
    async function getAISuggestion() {
      if (!mealData || suggestion) return;
      setLoading(true);
      try {
        const response = await fetch("/api/analyze-swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mealName: mealData.meal_name }),
        });

        // REMOVE the line: const text = await response.text();
        // It "eats" the data before .json() can get to it.

        const aiSwap = await response.json(); // This is the only call you need

        if (aiSwap.error) throw new Error(aiSwap.error);

        setSuggestion({
          name: aiSwap.name,
          carbon: aiSwap.co2,
          ingredient: aiSwap.ingredient || aiSwap.name,
          saving: Number((mealData.co2_impact - aiSwap.co2).toFixed(2)),
          reason: aiSwap.reason,
        });
      } catch (err) {
        console.error("AI Swap Error:", err);
      } finally {
        setLoading(false);
      }
    }
    getAISuggestion();
  }, [mealData]);

  // Handle the database updates
  const handleSwap = async (mealId: string, swapData: SwapData) => {
    console.log("🚀 Starting swap for Meal ID:", mealId);

    try {
      // 1. Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        alert("You must be logged in to swap meals.");
        return;
      }

      console.log("👤 Authenticated User ID:", user.id);

      // 2. Update the meal in the database
      // Check: Are your columns 'meal_name' and 'co2_impact' exactly as written below?
      const { data: updateData, error: mealError } = await supabase
        .from("meals")
        .update({
          meal_name: swapData.name,
          co2_impact: swapData.carbon,
        })
        .eq("id", mealId)
        .eq("user_id", user.id)
        .select(); // Adding .select() helps verify if the update actually happened

      if (mealError) {
        console.error("❌ Supabase Meal Error:", mealError);
        throw mealError;
      }

      console.log("✅ Meal updated successfully:", updateData);

      // 3. Insert into shopping list
      const { error: listError } = await supabase.from("shopping_list").insert([
        {
          user_id: user.id,
          item_name: swapData.ingredient,
          carbon_saving: swapData.saving,
          is_bought: false,
        },
      ]);

      if (listError) {
        console.error("❌ Supabase Shopping List Error:", listError);
        throw listError;
      }

      alert("Swap successful! Redirecting to dashboard...");

      // 4. Force a hard refresh to clear cache
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error("🚨 Detailed Error Log:", error);
      alert(`Swap failed: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfcfc]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-100 p-8 flex flex-col gap-10 bg-white z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-xl">🍃</span>
          <span className="text-[#1a1c1e]">NURA</span>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>{" "}
            Dashboard
          </Link>
          <Link
            href="/eco-swap"
            className="flex items-center gap-3 px-4 py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-sm"
          >
            <span className="material-symbols-outlined text-sm">eco</span>{" "}
            Eco-Swap
          </Link>
          <Link
            href="/shopping-list"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">
              shopping_basket
            </span>{" "}
            Pantry
          </Link>
          <Link
            href="/diet-plan"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">
              restaurant_menu
            </span>{" "}
            Diet Plan
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">person</span>{" "}
            Profile
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8 lg:p-16">
        <header className="max-w-4xl mx-auto mb-12 text-center lg:text-left">
          <h1 className="text-5xl font-bold text-[#1a1c1e] mb-4 tracking-tight">
            Eco-Swap
          </h1>
          <p className="text-lg text-slate-500 max-w-xl leading-relaxed mx-auto lg:mx-0">
            We’ve found a way to significantly reduce your carbon footprint for
            today’s lunch.
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Left Card: High Impact (Dynamic Data) */}
            <div className="flex-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm w-full">
              <span className="bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Current Choice
              </span>
              <h3 className="text-2xl font-bold mt-6 mb-2">
                {mealData?.meal_name || "Loading..."}
              </h3>
              <p className="text-sm text-slate-400 font-medium mb-8">
                {mealData?.calories || "0"} kcal •{" "}
                {mealData?.meal_type || "Meal"}
              </p>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center text-slate-400">
                  <div className="flex items-center gap-3">
                    <Leaf size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Carbon
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {mealData?.co2_impact || "0"}kg CO2
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Connector */}
            <div className="z-10 -my-4 lg:my-0 lg:-mx-8">
              <div className="w-14 h-14 bg-[#facc15] rounded-full flex items-center justify-center shadow-lg border-8 border-[#fcfcfc]">
                <Zap className="text-[#231b00]" size={20} fill="#231b00" />
              </div>
            </div>

            {/* Right Card: Recommendation */}
            {/* RIGHT CARD: SUSTAINABILITY WIN */}
            <div className="flex-1 p-8 bg-white border-2 border-[#facc15] rounded-[40px] shadow-sm relative">
              <div className="absolute top-6 left-8 bg-[#f1f8e9] text-[#2e7d32] px-4 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                Sustainability Win
              </div>

              <div className="mt-10">
                {/* If suggestion exists, show the AI data. Otherwise, show the placeholder. */}
                {suggestion ? (
                  <>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                      {suggestion.name}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm italic">
                      "{suggestion.reason}"
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-gray-400 leading-tight">
                      {loading
                        ? "NURA is thinking..."
                        : "Your Swap will appear here!"}
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                      {loading
                        ? "Searching for eco-friendly alternatives..."
                        : "Swap will appear on dashboard when levels go high!"}
                    </p>
                  </>
                )}
              </div>

              <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <Leaf size={18} className="text-[#2e7d32]" />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Carbon
                  </span>
                </div>
                <div className="text-right">
                  {/* Update the CO2 number dynamically */}
                  <span className="text-xl font-bold text-[#2e7d32]">
                    {suggestion ? `${suggestion.carbon}kg CO2` : "0kg CO2"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <button
              disabled={loading || !suggestion}
              onClick={() => {
                if (mealId && suggestion) {
                  handleSwap(mealId, suggestion);
                }
              }}
              className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#1a1c1e] px-8 py-5 transition-all duration-300 hover:bg-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]"
            >
              {/* The Inner Content */}
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span className="text-sm font-bold uppercase tracking-widest text-white/70">
                      Analyzing...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold uppercase tracking-widest text-white">
                      Commit to Swap
                    </span>
                    <Zap
                      size={16}
                      className="text-[#facc15] transition-transform duration-300 group-hover:rotate-12"
                      fill="#facc15"
                    />
                  </>
                )}
              </div>

              {/* Subtle Shine Effect on Hover */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
            <Link
              href="/dashboard"
              className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-600"
            >
              Keep Original
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- 3. THE MAIN PAGE COMPONENT (Wrapped in Suspense) ---
export default function EcoSwapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fcfcfc] font-bold text-slate-400">
          Initializing Eco-Swap...
        </div>
      }
    >
      <EcoSwapContent />
    </Suspense>
  );
}