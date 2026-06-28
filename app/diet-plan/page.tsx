"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  Flame,
  Utensils,
  Clock,
  Zap,
} from "lucide-react";

const DIET_GOALS = [
  {
    id: "weight-loss",
    title: "Weight Loss",
    description: "Burn fat while maintaining energy levels.",
    icon: "trending_down",
    color: "bg-blue-50 text-blue-600",
    impact: "-500 kcal deficit",
  },
  {
    id: "weight-gain",
    title: "Weight Gain",
    description: "Increase muscle mass with a caloric surplus.",
    icon: "trending_up",
    color: "bg-orange-50 text-orange-600",
    impact: "+500 kcal surplus",
  },
  {
    id: "bodybuilding",
    title: "Body Building",
    description: "High protein focus for strength and growth.",
    icon: "fitness_center",
    color: "bg-purple-50 text-purple-600",
    impact: "Max Protein focus",
  },
  {
    id: "eco-maintenance",
    title: "Eco-Warrior",
    description: "Maintain weight with zero-waste meal logic.",
    icon: "eco",
    color: "bg-green-50 text-green-600",
    impact: "Low CO2 focus",
  },
];

// Helper Component defined cleanly outside the main component body
function MealCard({ type, data, color, iconColor }: any) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className={`w-fit p-3 rounded-2xl mb-6 ${color} ${iconColor}`}>
        <Utensils size={24} />
      </div>

      <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
        {type}
      </span>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 leading-tight">
        {data.name}
      </h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 text-gray-500 text-sm font-semibold">
          <Flame size={16} className="text-red-400" />
          {data.cals || data.calories} kcal
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm font-semibold">
          <Clock size={16} />
          15-20 min
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
        {data.description || data.instructions}
      </p>
    </div>
  );
}

export default function DietPlan() {
  const [selectedGoal, setSelectedGoal] = useState("standard");
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDailyPlan = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("Profiles")
        .select("diet_type, current_plan")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Supabase Profile Error:", profileError.message);
      }

      const { data: items } = await supabase
        .from("shopping_list")
        .select("name");
      const ingredientsList = items?.map((i) => i.name) || [];

      const res = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietType: profile?.diet_type || "veg",
          currentPlan: profile?.current_plan || "eco-maintenance",
          ingredients: ingredientsList,
        }),
      });

      if (!res.ok) throw new Error("AI Route failed");

      const data = await res.json();
      setMealPlan(data);
    } catch (err: any) {
      console.error("Plan Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in to save your plan!");
        return;
      }

      const { error } = await supabase
        .from("Profiles")
        .update({ current_plan: selectedGoal })
        .eq("id", user.id);

      if (error) throw error;

      alert(`Success! Your plan is now set to ${selectedGoal}.`);
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan. Make sure the database column exists!");
    }
  };

  useEffect(() => {
    const fetchSavedPlan = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("Profiles")
            .select("current_plan")
            .eq("id", user.id)
            .single();

          if (data?.current_plan) {
            // Safe fallback structure normalizing spaces into dash strings
            const formattedGoal = data.current_plan
              .toLowerCase()
              .replace(" ", "-");
            setSelectedGoal(formattedGoal);
          }
        }
      } catch (error) {
        console.error("Error fetching saved plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPlan();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbf9]">
        <div className="animate-pulse text-[#735c00] font-bold">
          Loading Strategy...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fbfbf9] text-[#1a1c1e] font-sans">
      {/* Sidebar Layout panel */}
      <aside className="w-64 border-r border-slate-100 p-8 flex-col gap-10 bg-white hidden lg:flex shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-[#735c00]">🍃</span> NURA
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
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
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
            className="flex items-center gap-3 px-4 py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-sm"
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

      {/* Main Container Stream */}
      <main className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-12 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black mb-4">
            Daily Meal Planner
          </h1>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            AI-generated meals based on your pantry and diet goals.
          </p>
          <p className="text-xs sm:text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl inline-block mb-8 font-medium">
            💡 For vegetarian options, match your configurations inside Profile
            settings.
          </p>

          <div>
            <button
              onClick={generateDailyPlan}
              disabled={isGenerating}
              className="group relative inline-flex items-center gap-3 bg-black text-white px-8 py-4 sm:px-10 sm:py-5 rounded-[32px] font-bold text-base sm:text-lg hover:scale-105 transition-all active:scale-95 disabled:bg-gray-400 shadow-xl"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  NURA is cooking...
                </span>
              ) : (
                <>
                  <Sparkles size={20} className="text-yellow-400" />
                  Generate Today's Plan
                </>
              )}
            </button>
          </div>
        </header>

        {/* Generated Meal Cards Field Grid */}
        {mealPlan && (
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <MealCard
                type="Breakfast"
                data={mealPlan.breakfast}
                color="bg-orange-50"
                iconColor="text-orange-500"
              />
              <MealCard
                type="Lunch"
                data={mealPlan.lunch}
                color="bg-blue-50"
                iconColor="text-blue-500"
              />
              <MealCard
                type="Dinner"
                data={mealPlan.dinner}
                color="bg-indigo-50"
                iconColor="text-indigo-500"
              />
            </div>
          </section>
        )}

        {/* Strategy Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Your Strategy
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a goal to automatically adjust your daily targets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIET_GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-6 sm:p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 group flex flex-col justify-between ${
                  selectedGoal === goal.id
                    ? "border-[#facc15] bg-white shadow-xl scale-[1.01]"
                    : "border-transparent bg-white hover:border-slate-200 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${goal.color}`}
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">
                        {goal.icon}
                      </span>
                    </div>
                    {selectedGoal === goal.id && (
                      <div className="bg-[#facc15] text-[#735c00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        Active
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                    {goal.title}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                    {goal.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 w-full">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Target Adjustment
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {goal.impact}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Action Persistent Interface Bar */}
        <footer className="bg-[#1a1c1e] p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-bold text-base sm:text-lg text-[#facc15]">
              Ready to sync?
            </h4>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Saving will update your Dashboard rings immediately.
            </p>
          </div>
          <button
            onClick={handleApplyPlan}
            className="w-full md:w-auto bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-black py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#facc15]/10 text-sm uppercase tracking-wider whitespace-nowrap"
          >
            Apply Diet Plan
          </button>
        </footer>
      </main>
    </div>
  );
}
