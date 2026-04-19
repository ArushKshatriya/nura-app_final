"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Flame, Utensils, Clock } from "lucide-react";

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

export default function DietPlan() {
  const [selectedGoal, setSelectedGoal] = useState("standard");
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDailyPlan = async () => {
    if (isGenerating) return; // Prevent multiple clicks
    setIsGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      // 1. Fetch User Profile (Check your case sensitivity here!)
      const { data: profile, error: profileError } = await supabase
        .from("Profiles") // Change to "profiles" if your DB uses lowercase
        .select("diet_type, current_plan")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Supabase Profile Error:", profileError.message);
        // Fallback so the AI still works for testing
      }

      // 2. Fetch Ingredients
      const { data: items } = await supabase
        .from("shopping_list")
        .select("name");
      const ingredientsList = items?.map((i) => i.name) || [];

      // 3. Call the AI Route
      const res = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietType: profile?.diet_type || "veg",
          currentPlan: profile?.current_plan || "eco maintenance",
          ingredients: ingredientsList,
        }),
      });

      if (!res.ok) throw new Error("AI Route failed");

      const data = await res.json();
      console.log("Plan Received:", data);

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
            setSelectedGoal(data.current_plan);
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

  // 3. Optional: Add a loading state so it doesn't "flicker"
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbf9]">
        <div className="animate-pulse text-[#735c00] font-bold">
          Loading Strategy...
        </div>
      </div>
    );
  }
  function MealCard({ type, data, color, iconColor }: any) {
    // If data is missing for some reason, don't crash
    if (!data) return null;

    return (
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
        <div className={`w-fit p-3 rounded-2xl mb-6 ${color} ${iconColor}`}>
          <Utensils size={24} />
        </div>

        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
          {type}
        </span>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
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

        <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
          {data.description || data.instructions}
        </p>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-[#fbfbf9] text-[#1a1c1e] font-sans">
      {/* Sidebar - Consistent with Dashboard */}
      <aside className="w-64 border-r border-slate-100 p-8 flex flex-col gap-10 bg-white hidden lg:flex">
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

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="mb-12">
          {/* Header Section */}
          <div className="max-w-4xl mx-auto mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-black mb-4">
              Daily Meal Planner
            </h1>
            <p className="text-gray-500 mb-8">
              AI-generated meals based on your pantry and diet goals.
            </p>
            <p className="text-md text-gray-500 mb-1">
              For vegetarian plans, change your diet type in your profile
              settings for the time!
            </p>

            <button
              onClick={generateDailyPlan}
              disabled={isGenerating}
              className="group relative inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-[32px] font-bold text-lg hover:scale-105 transition-all active:scale-95 disabled:bg-gray-400"
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

          {/* Meals Grid - This only appears when mealPlan is not null */}
          {mealPlan && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          )}

          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Your Strategy.
          </h1>
          <p className="text-slate-500 mt-1">
            Select a goal to automatically adjust your daily targets.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DIET_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 group ${
                selectedGoal === goal.id
                  ? "border-[#facc15] bg-white shadow-xl scale-[1.02]"
                  : "border-transparent bg-white hover:border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${goal.color}`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {goal.icon}
                  </span>
                </div>
                {selectedGoal === goal.id && (
                  <div className="bg-[#facc15] text-[#735c00] text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    Active
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {goal.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Target Adjustment
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {goal.impact}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="mt-12 bg-[#1a1c1e] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h4 className="font-bold text-lg text-[#facc15]">Ready to sync?</h4>
            <p className="text-slate-400 text-sm">
              Saving will update your Dashboard rings immediately.
            </p>
          </div>
          <button
            onClick={handleApplyPlan}
            className="bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#facc15]/20"
          >
            Apply Diet Plan
          </button>
        </div>
      </main>
    </div>
  );
}
