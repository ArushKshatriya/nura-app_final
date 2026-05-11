"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Carrot, Bone, Leaf, Fish, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

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

  useEffect(() => {
    async function getProfile() {
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

          // 2. SET the states so the UI highlights the correct cards
          if (profileData.diet_type) setDietType(profileData.diet_type);
          if (profileData.current_plan)
            setCurrentPlan(profileData.current_plan);
        } else {
          setFullName(user.user_metadata?.full_name || "");
        }
      }
      setLoading(false);
    }
    getProfile();
  }, []);

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
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-100 p-8 flex flex-col gap-10 bg-white sticky top-0 h-screen">
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
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-black transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">
              restaurant_menu
            </span>{" "}
            Diet Plan
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 bg-[#facc15]/10 text-[#735c00] rounded-xl font-bold text-sm"
          >
            <span className="material-symbols-outlined text-sm">person</span>{" "}
            Profile
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-8 mb-12">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-200 overflow-hidden border-4 border-white shadow-xl">
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
              <h2 className="text-md font-medium text-slate-400 mt-4 italic">
                Don't forget to press "Save Changes" after updating your
                profile!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Info */}
              <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 space-y-8">
                <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Gender Toggle */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Gender
                    </label>
                    <div className="flex p-1.5 bg-[#f1f3f5] rounded-2xl w-fit">
                      {["male", "female", "other"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setGender(opt)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
                  {/* Weight Input Card */}
                  {/* Final Weight Input - Matches Gender Style */}
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

              {/* Section: Dietary Preference (The New Feature) */}
              <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Dietary Preference
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {dietOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDietType(option.id)} // Replace with setDietType if you've added that state
                      className={`relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 ${
                        dietType === option.id // Replace with dietType state check
                          ? "border-black bg-gray-50 shadow-inner"
                          : "border-gray-50 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${option.color}`}>
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
              <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50">
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
                          setCalorieGoal(parseInt(e.target.value))
                        }
                        className="w-full px-5 py-4 rounded-2xl bg-[#f1f3f5] outline-none font-bold text-lg"
                      />
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        kcal
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-300">
                    <span className="material-symbols-outlined text-4xl">
                      monitoring
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Carbon Goal Display */}
              <section className="bg-[#facc15] p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(250,204,21,0.2)] flex flex-col items-center text-center">
                <h3 className="text-[10px] font-bold text-[#735c00] uppercase tracking-widest mb-8">
                  Carbon Limit
                </h3>

                <div className="w-32 h-32 rounded-full border-[6px] border-[#735c00]/10 flex items-center justify-center relative">
                  {/* Dynamic Value Here */}
                  <div className="text-4xl font-black text-[#231b00]">
                    {carbonLimit}
                  </div>

                  <div className="absolute -bottom-3 bg-[#231b00] text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-tighter">
                    kg CO2e / Day
                  </div>
                </div>
              </section>

              {/* Security */}
              <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 space-y-6">
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
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Discard
            </button>
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="px-12 py-4 rounded-2xl bg-[#facc15] hover:bg-[#fbd94b] text-[#231b00] font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
