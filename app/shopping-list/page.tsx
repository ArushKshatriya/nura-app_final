"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBasket,
  Plus,
  Trash2,
  Leaf,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  LayoutDashboard,
  User,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

// Helper to define badge colors based on the user's plan
const planStyles: Record<
  string,
  { bg: string; text: string; label: string; desc: string }
> = {
  "weight-gain": {
    bg: "bg-blue-100",
    text: "text-blue-600",
    label: "Bulk Mode",
    desc: "Optimizing your list for high-calorie, protein-dense surplus.",
  },
  "weight-loss": {
    bg: "bg-red-100",
    text: "text-red-600",
    label: "Cut Mode",
    desc: "Prioritizing high-volume, low-calorie density and fiber.",
  },
  bodybuilding: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    label: "Bodybuilding",
    desc: "Focusing on a mix of protein, carbs, and greens for muscle growth.",
  },
  "eco-maintenance": {
    bg: "bg-green-100",
    text: "text-green-600",
    label: "Eco-Maintenance",
    desc: "Maintaining a balanced approach to nutrition and sustainability.",
  },
};

export default function ShoppingList() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [userProfile, setUserProfile] = useState({
    name: "User",
    plan: "standard",
  });

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("Profiles")
        .select("full_name, current_plan")
        .eq("id", user.id)
        .single();
      if (profile)
        setUserProfile({
          name: profile.full_name || "User",
          plan: profile.current_plan || "standard",
        });
      const { data: shopData } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (shopData) setItems(shopData);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // DYNAMIC CALCULATIONS for progress bars and logic
  const stats = useMemo(() => {
    // 1. Sum up the actual numerical data Gemini saved to Supabase
    const totals = items.reduce(
      (acc, item) => ({
        protein: acc.protein + (item.protein || 0),
        fiber: acc.fiber + (item.carbs || 0), // Or if you added a fiber column specifically
      }),
      { protein: 0, fiber: 0 },
    );

    // 2. Set realistic weekly targets (in grams)
    const targets = {
      protein: 700, // e.g., 700g protein goal for the week
      fiber: 250, // e.g., 250g fiber/greens goal
    };

    return {
      // Percentage for the progress bars
      proteinPercent: Math.min((totals.protein / targets.protein) * 100, 100),
      greensPercent: Math.min((totals.fiber / targets.fiber) * 100, 100),

      // Raw counts for the labels
      proteinCount: Math.round(totals.protein),
      greensCount: Math.round(totals.fiber),
    };
  }, [items]);

  const currentStyle =
    planStyles[userProfile.plan] || planStyles["eco-maintenance"];
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!newItem.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 2. The 2026 AI Prompt
      // We give the AI a scale to prevent "hallucinated" high numbers
      const prompt = `
      Act as a nutrition and sustainability expert.
      Analyze the food item: "${newItem}".
      
      Reference CO2 Scale (kg per kg): 
      Beef: 27, Lamb: 39, Cheese: 13, Chicken: 7, Veggies/Grains: 1-2.
      
      Return ONLY a JSON object:
      {
        "name": "Standardized Name",
        "cal": number,
        "pro": number,
        "carb": number,
        "fat": number,
        "co2": number,
        "swap": "Eco-friendly alternative"
      }
    `;

      // 3. API Call to Gemini 3.1 Flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );

      const rawData = await response.json();

      if (!rawData.candidates || !rawData.candidates[0]) {
        throw new Error("AI failed to analyze the item.");
      }

      const aiData = JSON.parse(rawData.candidates[0].content.parts[0].text);

      // 4. Threshold Logic: Only store a swap if CO2 > 12
      const finalSwap = aiData.co2 > 12 ? aiData.swap : "";

      // 5. Insert into Supabase
      const { error } = await supabase.from("shopping_list").insert([
        {
          user_id: user.id,
          item_name: aiData.name || newItem,
          calories: Math.round(aiData.cal || 0),
          protein: Math.round(aiData.pro || 0),
          carbs: Math.round(aiData.carb || 0),
          fats: Math.round(aiData.fat || 0),
          co2_impact: aiData.co2,
          suggested_swap: finalSwap,
          is_bought: false,
        },
      ]);

      if (error) throw error;

      // 6. Success: Reset UI
      setNewItem("");
      fetchData(); // Refresh the list
    } catch (err) {
      console.error("NURA AddItem Error:", err);
      alert("Could not add item. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSwap = async (id: string, newName: string) => {
    // 1. Calculate the new (lower) CO2 for the swap item
    // Usually swaps are low-impact, so we default to a green score
    const newCo2 = 1.2;

    const { error } = await supabase
      .from("shopping_list")
      .update({
        item_name: newName,
        suggested_swap: null, // Clear the suggestion after swapping
        co2_impact: newCo2,
      })
      .eq("id", id);

    if (!error) {
      fetchData(); // Refresh the list to show the new name
    } else {
      console.error("Error swapping item:", error.message);
    }
  };

  const handleResetShopping = async () => {
    const confirmReset = window.confirm("Clear your shopping cart?");
    if (!confirmReset) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Nuclear wipe for the shopping list only
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear the local UI state
      setItems([]);
    } catch (err: any) {
      console.error("Shopping Reset Error:", err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#1a1c1e]">
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
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">eco</span>{" "}
            Eco-Swap
          </Link>
          <Link
            href="/shopping-list"
            className="flex items-center gap-3 px-4 py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-sm"
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
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
          {/* LEFT COLUMN: Header + Input + List */}
          <div className="xl:col-span-2 space-y-12">
            <header>
              <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
                {userProfile.name.split(" ")[0]}'s Pantry
              </h1>
              <p className="text-slate-400 font-medium">
                Your pantry is tracking live for the week.
              </p>

              {/* NEW STRATEGY SECTION */}
              <div className="mt-8 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm inline-block">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                  Current Strategy
                </p>
                <div className="flex flex-col items-start gap-3">
                  <div
                    className={`inline-flex items-center gap-2 ${currentStyle.bg} ${currentStyle.text} px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider shadow-sm border border-black/5`}
                  >
                    <Sparkles size={14} />
                    {currentStyle.label}
                  </div>
                  <p className="text-sm font-medium text-slate-500 italic max-w-xs leading-relaxed">
                    "{currentStyle.desc}"
                  </p>
                </div>
              </div>
            </header>

            {/* Input Form & List Area */}
            <div className="space-y-8">
              <form onSubmit={addItem} className="relative group">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add item (e.g. Steak, Oats, Spinach...)"
                  className="w-full p-6 bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border-none outline-none text-lg transition-all pr-40 focus:ring-4 focus:ring-[#facc15]/10"
                />
                <button
                  type="submit"
                  disabled={!newItem.trim()}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-[#facc15] text-[#231b00] rounded-2xl font-black hover:bg-[#fbd94b] transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} strokeWidth={3} /> Add
                </button>
              </form>

              <div className="flex justify-between items-center px-2 mb-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Grocery Economy
                </h3>

                <button
                  onClick={handleResetShopping}
                  className="flex items-center gap-2 group transition-all"
                >
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 text-sm transition-colors">
                    backspace
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500 transition-colors">
                    Clear All
                  </span>
                </button>
              </div>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="p-16 rounded-[3rem] border-2 border-dashed border-slate-100 bg-white/50 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl mb-4">
                      🛒
                    </div>
                    <p className="text-slate-400 font-bold">
                      Your pantry is ready for stocking.
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col transition-all ${
                        item.is_bought ? "opacity-40 grayscale shadow-none" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={async () => {
                              await supabase
                                .from("shopping_list")
                                .update({ is_bought: !item.is_bought })
                                .eq("id", item.id);
                              fetchData();
                            }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                              item.is_bought
                                ? "bg-green-500 text-white"
                                : "bg-slate-50 text-slate-300 hover:bg-[#facc15] hover:text-black shadow-inner"
                            }`}
                          >
                            <CheckCircle2 size={24} />
                          </button>
                          <div>
                            <h3 className="text-xl font-black text-slate-800">
                              {item.item_name}
                            </h3>
                            <div className="flex gap-4 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                <Leaf size={10} className="text-green-500" />{" "}
                                {item.co2_impact}kg CO2e
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await supabase
                              .from("shopping_list")
                              .delete()
                              .eq("id", item.id);
                            fetchData();
                          }}
                          className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>

                      {!item.is_bought && item.suggested_swap && (
                        <div className="mt-6 bg-[#fffbeb] rounded-2xl p-4 flex items-center justify-between border border-[#fef08a] animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#facc15] rounded-xl flex items-center justify-center shadow-sm">
                              <Zap size={18} fill="black" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[#854d0e] uppercase">
                                Eco-Swap Suggestion
                              </p>
                              <p className="text-sm font-bold text-[#735c00]">
                                Switch to {item.suggested_swap}?
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleSwap(item.id, item.suggested_swap)
                            }
                            className="bg-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border border-[#fef08a] hover:bg-black hover:text-[#facc15] transition-all active:scale-95"
                          >
                            Swap
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANELS: Now aligned with the Top of the page */}
          <div className="space-y-8 sticky top-12">
            <div className="bg-[#1a1c1e] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                <CalendarDays className="text-[#facc15]" size={20} /> Week
                Outlook
              </h2>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest text-slate-500">
                    <span>Protein Check</span>
                    <span className="text-[#facc15]">
                      {stats.proteinCount}/700 gms
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#facc15] transition-all duration-700"
                      style={{ width: `${stats.proteinPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest text-slate-500">
                    <span>Greens & Fiber</span>
                    <span className="text-green-400">
                      {stats.greensCount}/250 gms
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 transition-all duration-700"
                      style={{ width: `${stats.greensPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3">
                <AlertTriangle className="text-[#facc15] shrink-0" size={18} />
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                  {stats.proteinCount < 4
                    ? `Your pantry is low on protein. Based on your ${currentStyle.label} plan, consider adding paneer or chicken.`
                    : "Pantry looking strong! You have the foundation for a great week."}
                </p>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full bg-[#facc15] text-[#231b00] font-black py-4 rounded-2xl shadow-xl shadow-[#facc15]/20 flex items-center justify-center gap-2 hover:bg-[#fbd94b] active:scale-95 transition-all"
            >
              <LayoutDashboard size={18} strokeWidth={3} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
