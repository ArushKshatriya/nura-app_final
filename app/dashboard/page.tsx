"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogMealModal from "@/components/LogMealModal";
import { Zap } from "lucide-react";

export default function Dashboard() {
  const [hasUnread, setHasUnread] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    calorieGoal: number;
    currentPlan: string;
    weight: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);

  // Conversion Constants
  const CO2_TO_TREES = 0.02; // 1kg CO2 ≈ 0.02 of a tree's monthly absorption
  const CO2_TO_KM = 4.0; // 1kg CO2 ≈ 4km of driving a standard gas car

  const fetchMeals = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setMeals(data);
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("Profiles")
          .select("full_name, calorie_goal, current_plan, weight")
          .eq("id", user.id)
          .single();

        if (data) {
          setUserProfile({
            name: data.full_name,
            calorieGoal: data.calorie_goal || 2000,
            currentPlan: data.current_plan || "standard",
            weight: data.weight || 55,
          });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProfile();
    fetchMeals();
  }, [getProfile, fetchMeals]);

  useEffect(() => {
    const performAutoReset = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date in IST (Thane timezone)
      const today = new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      const lastResetDate = localStorage.getItem("nura_last_reset");

      if (lastResetDate !== today) {
        try {
          // Delete logs for a fresh daily start
          const { error } = await supabase
            .from("meals")
            .delete()
            .eq("user_id", user.id);

          if (!error) {
            setMeals([]); // Clear the UI
            localStorage.setItem("nura_last_reset", today); // Mark today as done
          }
        } catch (err) {
          console.error("Auto-reset failed:", err);
        }
      }
    };

    performAutoReset();
  }, []); // Empty dependency array means it runs once on mount

  const adjustedGoal = useMemo(() => {
    const base = userProfile?.calorieGoal || 2200;

    // If the plan is missing, null, or 'standard', return the base goal exactly
    if (!userProfile?.currentPlan || userProfile?.currentPlan === "standard") {
      return base;
    }

    // Only apply math for specific active plans
    switch (userProfile.currentPlan) {
      case "weight-loss":
        return base - 500;
      case "weight-gain":
        return base + 500;
      case "bodybuilding":
        return base + 300;
      default:
        return base;
    }
  }, [userProfile]);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (Number(meal.calories) || 0),
        co2: acc.co2 + (Number(meal.co2_impact) || 0),
        protein: acc.protein + (Number(meal.protein) || 0),
        carbs: acc.carbs + (Number(meal.carbs) || 0), // Added carbs
        fats: acc.fats + (Number(meal.fats) || 0), // Added fats
      }),
      { calories: 0, co2: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [meals]);

  const caloriePercentage = Math.min(
    (totals.calories / (adjustedGoal || 2000)) * 100,
    100,
  );
  const dashOffset = 364 - (364 * caloriePercentage) / 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };
  const getMacroTargets = (weight: number, plan: string) => {
    const w = weight || 55; // Defaults to your 55kg base
    const activePlan = plan || "standard";

    // Base Logic (Standard Maintenance)
    let targets = {
      calories: 2200,
      protein: w * 1.2,
      carbs: w * 3,
      fats: w * 0.8,
    };

    // Plan Specific Overrides
    if (activePlan === "bodybuilding") {
      targets.protein = w * 2; // High protein target
      targets.calories = 2800;
    } else if (activePlan === "cutting") {
      targets.calories = 1800;
      targets.protein = w * 1.5;
    }

    return targets;
  };
  const deleteMeal = async (id: string) => {
    // Optional: Add a quick confirmation
    if (!confirm("Remove this meal?")) return;

    try {
      const { error } = await supabase.from("meals").delete().eq("id", id); // This matches the specific meal ID

      if (error) throw error;

      // Refresh your local state so the meal disappears immediately
      setMeals((prev) => prev.filter((meal) => meal.id !== id));
    } catch (err: any) {
      console.error("Delete error:", err.message);
      alert("Could not delete meal. Try again.");
    }
  };

  const displayName = userProfile?.name || "User";

  const handleDailyReset = async () => {
    // 1. Safety Check
    const confirmReset = window.confirm(
      "Are you sure? This will wipe all logs for today.",
    );
    if (!confirmReset) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Clear Supabase (Filtering by user_id)
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // 3. Clear Local State
      setMeals([]);

      // Optional: Flash a success message
      alert("NURA Intelligence Reset: Ready for a new day.");
    } catch (err: any) {
      console.error("Reset failed:", err.message);
      alert("Could not reset logs. Check connection.");
    }
  };

  const getSeasonalData = () => {
    const month = new Date().getMonth(); // April is 3

    switch (month) {
      case 2: // March
      case 3: // April
      case 4: // May
        return {
          season: "Summer Peak",
          items: [
            { name: "Alphonso Mango", impact: "-30% CO2" },
            { name: "Watermelon", impact: "Hydrating" },
            { name: "Muskmelon", impact: "Low Water" },
          ],
        };
      case 5:
      case 6:
      case 7: // Monsoon
        return {
          season: "Monsoon",
          items: [
            { name: "Corn (Bhutta)", impact: "Local" },
            { name: "Jamun", impact: "High Antioxidant" },
            { name: "Custard Apple", impact: "Native" },
          ],
        };
      default:
        return {
          season: "Standard",
          items: [
            { name: "Papaya", impact: "Year-round" },
            { name: "Banana", impact: "-10% CO2" },
            { name: "Coconut", impact: "Local" },
          ],
        };
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fbfbf9] text-[#1a1c1e] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-100 p-8 flex flex-col gap-10 bg-white hidden lg:flex">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-[#735c00]">🍃</span> NURA
        </div>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-sm"
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
        <button
          onClick={() => setIsModalOpen(true)}
          className={`fixed bottom-8 left-8 z-[100] bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-bold py-4 px-8 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] flex items-center gap-2 active:scale-95 transition-all duration-300 ${
            meals.length === 0 ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <span className="material-symbols-outlined">add</span> Log Meal
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {getGreeting()}, {displayName}.
            </h1>
            <h2 className="text-slate-500 mt-1 text-xl italic font-medium">
              Don't forget to update your pantry and log meals for the most
              accurate insights!
            </h2>
          </div>
        </header>

        <DailyIntelligenceCard userProfile={userProfile} meals={meals} />

        {/* Diet Plan Reminder Note */}
        {(!userProfile?.currentPlan ||
          userProfile?.currentPlan === "standard") && (
          <div className="mb-8 p-4 bg-[#fffbeb] border border-[#fef08a] rounded-2xl flex items-center justify-between group animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#facc15] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[#735c00] text-xl">
                  tips_and_updates
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-[#854d0e]">
                  Set your Diet Strategy
                </p>
                <p className="text-[15px] text-[#a16207] font-medium">
                  Update your profile and diet plan to get personalized
                  tracking!
                </p>
              </div>
            </div>
            <Link href="/profile">
              <button className="px-4 py-2 bg-white border border-[#fef08a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#facc15] hover:text-[#1a1c1e] transition-all active:scale-95 shadow-sm">
                Go to Profile
              </button>
            </Link>
            <Link href="/diet-plan">
              <button className="px-4 py-2 bg-white border border-[#fef08a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#facc15] hover:text-[#1a1c1e] transition-all active:scale-95 shadow-sm">
                Choose Plan
              </button>
            </Link>
          </div>
        )}

        {/* Top Stats Grid */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Health Progress Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#f1f3f5"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#facc15"
                  strokeWidth="12"
                  strokeDasharray="364"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-xl font-black text-[#1a1c1e]">
                  {totals.calories.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  KCAL
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Daily Fuel
                  </div>
                  <div className="text-2xl font-black text-[#1a1c1e]">
                    {Math.round(caloriePercentage)}
                    <span className="text-sm ml-0.5 text-slate-400">%</span>
                  </div>
                </div>
                <div className="text-right">
                  {/* The Dynamic Plan Badge */}
                  <div
                    className={`text-[13px] font-black uppercase px-2 py-0.5 rounded-md mb-1 inline-block ${
                      userProfile?.currentPlan === "weight-loss"
                        ? "bg-orange-100 text-orange-600"
                        : userProfile?.currentPlan === "weight-gain"
                          ? "bg-blue-100 text-blue-600"
                          : userProfile?.currentPlan === "bodybuilding"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-slate-100 text-green-500"
                    }`}
                  >
                    {userProfile?.currentPlan?.replace("-", " ") || "Standard"}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Target
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {adjustedGoal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#facc15] transition-all duration-1000 ease-out"
                    style={{ width: `${caloriePercentage}%` }}
                  ></div>
                </div>
                <p className="text-[13px] font-medium text-slate-500 italic">
                  {userProfile?.currentPlan === "weight-loss" &&
                    "🔥 Weight loss active: -500kcal applied. "}
                  {userProfile?.currentPlan === "weight-gain" &&
                    "💪 Bulk mode: +500kcal applied. "}
                  {userProfile?.currentPlan === "bodybuilding" &&
                    "🏋️ Performance: +300kcal applied. "}

                  {caloriePercentage >= 100
                    ? "Goal reached!"
                    : `${Math.round(100 - caloriePercentage)}% remaining.`}
                </p>
              </div>
            </div>
          </div>

          {/* Sustainability Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#f1f3f5"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#735c00"
                  strokeWidth="12"
                  strokeDasharray="364"
                  strokeDashoffset={364 - 364 * Math.min(totals.co2 / 15, 1)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-black text-[#1a1c1e]">
                  {totals.co2.toFixed(1)}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  KG CO2e
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Daily Footprint
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${totals.co2 < 5 ? "bg-green-100 text-green-700" : totals.co2 < 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                >
                  {totals.co2 < 5
                    ? "Low Impact"
                    : totals.co2 < 10
                      ? "Moderate"
                      : "High Impact"}
                </div>
              </div>
              <div className="bg-[#f8fafc] p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">
                  <span className="material-symbols-outlined text-sm">
                    cloud
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Status
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {totals.co2 > 10 ? "Try an Eco-Swap!" : "Looks Positive!"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Meal Log + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Meal Log List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold">Daily Meal Log</h2>
            <div className="space-y-4">
              {meals.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                  <span className="text-4xl mb-4 block">🥗</span>
                  <p className="text-slate-400 font-medium">
                    Ready to log your first meal?
                  </p>
                  <div className="h-6" />
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center bg-[#facc15] hover:bg-black hover:text-[#facc15] text-[#231b00] font-black py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                    Start Logging
                  </button>
                </div>
              ) : (
                meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#facc15]/10 flex items-center justify-center text-xl">
                        {meal.meal_type === "Breakfast"
                          ? "🍳"
                          : meal.meal_type === "Lunch"
                            ? "🍱"
                            : "🍽️"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{meal.meal_name}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase">
                          {meal.meal_type} • {meal.calories} kcal
                        </p>
                      </div>

                      {/* Action Area: CO2 Badge + Delete Button */}
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          {meal.co2_impact} KG CO2
                        </div>
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          title="Delete Meal"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>

                    {meal.co2_impact > 3 && (
                      <div className="mt-4 bg-[#fefce8] p-3 rounded-xl flex items-center justify-between border border-[#fef08a]">
                        <p className="text-[11px] font-bold text-[#854d0e]">
                          💡 High impact! Tap swap to reduce CO2.
                        </p>
                        <Link href={`/eco-swap?id=${meal.id}`}>
                          <button className="bg-[#facc15] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform">
                            <Zap size={10} fill="currentColor" /> Swap
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Sidebar Widgets Wrapper */}
          <div className="flex flex-col gap-8 sticky top-12">
            {/* Eco-Impact Card */}
            <div className="bg-[#1a1c1e] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#facc15]/10 rounded-full blur-3xl group-hover:bg-[#facc15]/20 transition-colors duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Real-World Impact
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#facc15] text-sm">
                      auto_awesome
                    </span>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-blue-400">
                        directions_car
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-black italic">
                        {(totals.co2 * CO2_TO_KM).toFixed(1)}
                        <span className="text-xs font-bold text-slate-500 ml-1 uppercase italic-none text-[10px]">
                          km
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight">
                        Driving avoided today.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-green-400">
                        forest
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-black italic">
                        {(totals.co2 * CO2_TO_TREES).toFixed(3)}
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight">
                        Tree absorption equivalent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Seasonality Widget */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 h-full">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    calendar_today
                  </span>
                  Seasonality
                </h3>
                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {getSeasonalData().season}
                </span>
              </div>

              <div className="space-y-3">
                {getSeasonalData().items.map((item, index) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                      index === 0
                        ? "bg-green-50 border-green-100/50"
                        : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-lg">
                        {/* Using emojis for zero-latency icons */}
                        {item.name.includes("Mango")
                          ? "🥭"
                          : item.name.includes("Watermelon")
                            ? "🍉"
                            : "🥗"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {item.name}
                        </p>
                        <p
                          className={`text-[9px] font-black uppercase tracking-tight ${
                            index === 0 ? "text-green-600" : "text-slate-400"
                          }`}
                        >
                          {index === 0 ? "Peak Season" : "Local Choice"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 bg-white/50 px-2 py-1 rounded-lg">
                      {item.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <LogMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          fetchMeals();
          getProfile();
        }}
      />
    </div>
  );
}

// PASTE THIS AT THE VERY BOTTOM OF YOUR DASHBOARD FILE
function DailyIntelligenceCard({
  userProfile,
  meals,
}: {
  userProfile: any;
  meals: any[];
}) {
  // 1. Calculate Targets using the function you defined in Dashboard
  // Note: Since getMacroTargets is inside Dashboard, you might need
  // to move it here or pass the results as a prop.
  // For now, let's assume it's passed or defined here.

  const w = userProfile?.weight || 55;
  const plan = userProfile?.currentPlan || "standard";

  // Inline target logic to ensure it works immediately
  let targets = {
    calories: userProfile?.calorieGoal || 2200,
    protein: w * 1.2,
    carbs: w * 3,
    fats: w * 0.8,
  };

  if (plan === "bodybuilding") {
    targets.protein = w * 2;
    targets.calories = 2800;
  } else if (plan === "cutting") {
    targets.calories = 1800;
    targets.protein = w * 1.5;
  }

  // 2. Aggregate Today's Consumption
  const totals = meals.reduce(
    (acc, meal) => ({
      cal: acc.cal + (Number(meal.calories) || 0),
      pro: acc.pro + (Number(meal.protein) || 0),
      carb: acc.carb + (Number(meal.carbs) || 0),
      fat: acc.fat + (Number(meal.fats) || 0),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );

  return (
    <div className="bg-slate-950 p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[#facc15] font-black italic uppercase tracking-tighter text-xl">
          Daily Intelligence
        </h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase">
            {w}kg
          </span>
          <span className="px-3 py-1 bg-[#facc15]/10 rounded-full text-[10px] font-bold text-[#facc15] uppercase">
            {plan}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          {
            label: "Energy",
            val: totals.cal,
            max: targets.calories,
            unit: "kcal",
            color: "#facc15",
          },
          {
            label: "Protein",
            val: totals.pro,
            max: targets.protein,
            unit: "g",
            color: "#3b82f6",
          },
          {
            label: "Carbs",
            val: totals.carb,
            max: targets.carbs,
            unit: "g",
            color: "#fb923c",
          },
          {
            label: "Fats",
            val: totals.fat,
            max: targets.fats,
            unit: "g",
            color: "#ec4899",
          },
        ].map((item) => (
          <div key={item.label} className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {item.label}
              </span>
              <span className="text-xs font-bold text-white">
                {Math.round(item.val)}
                <span className="text-white/20 ml-1">
                  / {Math.round(item.max)}
                  {item.unit}
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width: `${Math.min((item.val / item.max) * 100, 100)}%`,
                  backgroundColor: item.color,
                  boxShadow: `0 0 12px ${item.color}30`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
