"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Carrot, Bone, Leaf, Fish, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();

  // State for user data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("Thane, India");
  const [gender, setGender] = useState("male");
  const [weight, setWeight] = useState(55);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dietType, setDietType] = useState("non-veg");
  const [currentPlan, setCurrentPlan] = useState("eco-maintenance");

  const dietOptions = [
    {
      id: "veg",
      label: "Vegetarian",
      icon: <Carrot size={20} />,
      color: "bg-green-100 text-green-700",
    },
    {
      id: "non-veg",
      label: "Non-Veg",
      icon: <Bone size={20} />,
      color: "bg-red-100 text-red-700",
    },
    {
      id: "vegan",
      label: "Vegan",
      icon: <Leaf size={20} />,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      icon: <Fish size={20} />,
      color: "bg-blue-100 text-blue-700",
    },
  ];

  const getProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("Profiles")
        .select(
          "full_name, gender, calorie_goal, weight, location, diet_type, current_plan",
        )
        .eq("id", user.id)
        .single();

      if (profileData) {
        setFullName(profileData.full_name || "");
        setGender(profileData.gender || "male");
        setCalorieGoal(profileData.calorie_goal || 2000);
        setWeight(profileData.weight || 55);
        setLocation(profileData.location || "Thane, India");

        if (profileData.diet_type) setDietType(profileData.diet_type);
        if (profileData.current_plan) setCurrentPlan(profileData.current_plan);
      } else {
        setFullName(user.user_metadata?.full_name || "");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: dbError } = await supabase
        .from("Profiles")
        .update({
          full_name: fullName,
          gender: gender,
          calorie_goal: calorieGoal,
          location: location,
          weight: weight,
          diet_type: dietType,
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (authError) throw authError;

      alert("Profile updated successfully!");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate dynamic limit: (Calories * 2 grams) / 1000 to get kg
  const carbonLimit = ((calorieGoal * 2) / 1000).toFixed(1);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fbfbf9]">
        <div className="animate-pulse font-bold text-[#735c00]">
          Loading NURA Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fbfbf9] text-[#1a1c1e] font-sans">
      {/* SIDEBAR FOR BIG SCREENS / BOTTOM NAV FOR MOBILE */}
      <aside className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 p-4 flex flex-row justify-around items-center z-50 lg:sticky lg:inset-y-0 lg:left-0 lg:w-64 lg:h-screen lg:border-t-0 lg:border-r lg:p-8 lg:flex-col lg:justify-start lg:gap-10">
        <div className="hidden lg:flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-[#735c00]">🍃</span> NURA
        </div>
        <nav className="flex w-full flex-row justify-around lg:flex-col lg:gap-2">
          <Link
            href="/dashboard"
            className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 transition-colors text-xs lg:text-sm font-medium ${
              pathname === "/dashboard"
                ? "text-black font-bold"
                : "text-slate-400 hover:text-black"
            }`}
          >
            <span className="material-symbols-outlined text-lg lg:text-sm">
              dashboard
            </span>{" "}
            <span className="text-[10px] lg:text-sm">Dashboard</span>
          </Link>
          <Link
            href="/eco-swap"
            className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 transition-colors text-xs lg:text-sm font-medium ${
              pathname === "/eco-swap"
                ? "text-black font-bold"
                : "text-slate-400 hover:text-black"
            }`}
          >
            <span className="material-symbols-outlined text-lg lg:text-sm">
              eco
            </span>{" "}
            <span className="text-[10px] lg:text-sm">Eco-Swap</span>
          </Link>
          <Link
            href="/shopping-list"
            className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 transition-colors text-xs lg:text-sm font-medium ${
              pathname === "/shopping-list"
                ? "text-black font-bold"
                : "text-slate-400 hover:text-black"
            }`}
          >
            <span className="material-symbols-outlined text-lg lg:text-sm">
              shopping_basket
            </span>{" "}
            <span className="text-[10px] lg:text-sm">Pantry</span>
          </Link>
          <Link
            href="/diet-plan"
            className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 transition-colors text-xs lg:text-sm font-medium ${
              pathname === "/diet-plan"
                ? "text-black font-bold"
                : "text-slate-400 hover:text-black"
            }`}
          >
            <span className="material-symbols-outlined text-lg lg:text-sm">
              restaurant_menu
            </span>{" "}
            <span className="text-[10px] lg:text-sm">Diet Plan</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-4 py-2 lg:px-4 lg:py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-xs lg:text-sm"
          >
            <span className="material-symbols-outlined text-lg lg:text-sm">
              person
            </span>{" "}
            <span className="text-[10px] lg:text-sm">Profile</span>
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12 text-center sm:text-left">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-[2.5rem] bg-slate-200 overflow-hidden border-4 border-white shadow-xl">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || "Arush"}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">
                Profile & Settings
              </h1>
              <p className="text-slate-400 font-medium mt-1">
                Curate your sustainable lifestyle journey.
              </p>
              <h2 className="text-sm font-medium text-amber-600 mt-3 italic">
                Don't forget to press "Save Changes" after updating your
                profile!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Info */}
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-50 space-y-8">
                <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] opacity-60 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender Toggle */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Gender
                    </label>
                    <div className="flex p-1.5 bg-[#f1f3f5] rounded-2xl w-full sm:w-fit overflow-x-auto">
                      {["male", "female", "other"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setGender(opt)}
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            gender === opt
                              ? "bg-white text-black shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Weight Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1 tracking-wider">
                      Current Weight
                    </label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                        monitor_weight
                      </span>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full pl-12 pr-14 py-4 rounded-2xl bg-[#f1f3f5] outline-none font-bold text-lg transition-all focus:ring-2 focus:ring-[#facc15] focus:bg-white"
                        placeholder="55"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-[10px] uppercase">
                        KG
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Dietary Preference */}
              <section className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Dietary Preference
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dietOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDietType(option.id)}
                      className={`relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 ${
                        dietType === option.id
                          ? "border-black bg-gray-50 shadow-inner"
                          : "border-gray-50 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl shrink-0 ${option.color}`}
                      >
                        {option.icon}
                      </div>
                      <span className="font-bold text-sm tracking-tight text-gray-900">
                        {option.label}
                      </span>

                      {dietType === option.id && (
                        <div className="absolute top-4 right-4 bg-black rounded-full p-1">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Preferences */}
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-50">
                <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                  Daily Nutrition Goal
                </h2>
                <div className="flex items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Target Calories
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calorieGoal}
                        onChange={(e) =>
                          setCalorieGoal(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] outline-none font-bold text-lg"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        kcal
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-300 hidden sm:block">
                    <span className="material-symbols-outlined text-4xl">
                      monitoring
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Carbon Goal Display */}
              <section className="bg-[#facc15] p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(250,204,21,0.2)] flex flex-col items-center text-center">
                <h3 className="text-[10px] font-bold text-[#735c00] uppercase tracking-widest mb-8">
                  Carbon Limit
                </h3>

                <div className="w-32 h-32 rounded-full border-[6px] border-[#735c00]/10 flex items-center justify-center relative">
                  <div className="text-4xl font-black text-[#231b00]">
                    {carbonLimit}
                  </div>

                  <div className="absolute -bottom-3 bg-[#231b00] text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-tighter whitespace-nowrap">
                    kg CO2e / Day
                  </div>
                </div>
              </section>

              {/* Security */}
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-50 space-y-6">
                <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Security & Account
                </h2>
                <button
                  onClick={handleLogout}
                  className="w-full p-5 rounded-[1.5rem] bg-red-50 text-red-500 flex items-center justify-between group hover:bg-red-100 transition-colors"
                >
                  <span className="text-[15px] font-bold">Logout</span>
                  <span className="material-symbols-outlined text-red-400">
                    logout
                  </span>
                </button>
              </section>
            </div>
          </div>

          <div className="flex justify-end items-center gap-6 mt-12 pt-8 border-t border-slate-100">
            <button
              onClick={() => getProfile()}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="px-8 md:px-12 py-4 rounded-2xl bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
