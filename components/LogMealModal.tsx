"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LogMealModal({ isOpen, onClose, onSave }: any) {
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  const handleSave = async () => {
    if (!mealName) return alert("Please enter a meal name!");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealName, mealType }),
      });

      const aiData = await response.json();

      if (aiData.error) throw new Error(aiData.error);

      // --- NEW: CO2 SANITY CHECK ---
      // If the AI sends '25' for a coffee, it's definitely grams.
      // Standard meals are rarely > 10kg CO2. We convert to kg automatically.
      let correctedCO2 = Number(aiData.co2) || 0;
      if (correctedCO2 > 5) {
        correctedCO2 = correctedCO2 / 1000;
      }
      // -----------------------------

      const { error } = await supabase.from("meals").insert([
        {
          user_id: user?.id,
          meal_name: aiData.name || mealName,
          meal_type: mealType,
          calories: aiData.cal,
          protein: aiData.pro,
          carbs: aiData.carb,
          fats: aiData.fat,
          co2_impact: correctedCO2, // Use the corrected value here
        },
      ]);

      if (error) throw error;

      onSave();
      setMealName("");
      onClose();
    } catch (err: any) {
      console.error("Meal Log Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black tracking-tight mb-2 text-[#1a1c1e]">
          Log Meal
        </h2>
        <p className="text-slate-400 text-sm font-medium mb-8">
          What are we eating today, Arush?
        </p>

        <div className="space-y-8">
          {/* Input Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Meal Name
            </label>
            <input
              type="text"
              value={mealName}
              placeholder="e.g. Avocado Toast"
              className="w-full px-6 py-5 bg-[#f8f9fa] rounded-2xl outline-none focus:ring-2 focus:ring-[#facc15] font-semibold transition-all border-none text-black"
              onChange={(e) => setMealName(e.target.value)}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {mealTypes.map((type) => {
                const isActive = mealType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border-2 ${
                      isActive
                        ? "bg-[#facc15] border-[#facc15] text-[#1a1600] shadow-md"
                        : "bg-white border-slate-200 text-[#334155] hover:border-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 bg-[#1a1c1e] text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Confirm Entry"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
