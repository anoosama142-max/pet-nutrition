'use client';

import React, { useState } from "react";

const BREED_DATABASE: Record<string, { label: string; species: "dog" | "cat"; maleWeight: number; femaleWeight: number; size: "small" | "medium" | "large" }> = {
  malinois: { label: "Belgian Malinois", species: "dog", maleWeight: 28, femaleWeight: 22 },
  griffon: { label: "Griffon", species: "dog", maleWeight: 8, femaleWeight: 7 },
  g_shepherd: { label: "German Shepherd", species: "dog", maleWeight: 36, femaleWeight: 28, size: "large" },
  golden_r: { label: "Golden Retriever", species: "dog", maleWeight: 32, femaleWeight: 27, size: "large" },
  rottweiler: { label: "Rottweiler", species: "dog", maleWeight: 50, femaleWeight: 40, size: "large" },
  french_bd: { label: "French Bulldog", species: "dog", maleWeight: 12, femaleWeight: 10, size: "medium" },
  poodle_std: { label: "Standard Poodle", species: "dog", maleWeight: 26, femaleWeight: 22, size: "large" },
  poodle_toy: { label: "Toy Poodle", species: "dog", maleWeight: 4, femaleWeight: 3.5, size: "small" },
  pug: { label: "Pug", species: "dog", maleWeight: 8, femaleWeight: 7, size: "small" },
  chihuahua: { label: "Chihuahua", species: "dog", maleWeight: 2.5, femaleWeight: 2, size: "small" },
  pitbull: { label: "American Pit Bull", species: "dog", maleWeight: 24, femaleWeight: 19, size: "medium" },
  maine_coon: { label: "Maine Coon Cat", species: "cat", maleWeight: 8, femaleWeight: 5.5, size: "large" },
  persian: { label: "Persian Cat", species: "cat", maleWeight: 5, femaleWeight: 4, size: "medium" },
  siamese: { label: "Siamese Cat", species: "cat", maleWeight: 4.5, femaleWeight: 3.5, size: "small" },
  domestic_sh: { label: "Domestic Shorthair", species: "cat", maleWeight: 5, femaleWeight: 4, size: "medium" }
};

const INGREDIENTS_DB: Record<string, { label: string; protein: number; fat: number; kcal: number; p: number; ca: number }> = { 
  chicken: { label: " Chicken Breast", protein: 31, fat: 3.6, kcal: 165, p: 0.18, ca: 0.012 }, 
  beef: { label: " Lean Beef", protein: 26, fat: 15, kcal: 250, p: 0.2, ca: 0.01 }, 
  salmon: { label: " Fresh Salmon", protein: 20, fat: 13, kcal: 208, p: 0.25, ca: 0.015 },
  chicken_giblets: { label: " Chicken Giblets", protein: 18, fat: 4.5, kcal: 120, p: 0.22, ca: 0.015 },
  liver: { label: " Beef Liver", protein: 20, fat: 4, kcal: 135, p: 0.25, ca: 0.02 }, 
  rice: { label: " White Rice", protein: 2.7, fat: 0.3, kcal: 130, p: 0.03, ca: 0.01 }, 
  potato: { label: " Boiled Potato", protein: 2.0, fat: 0.1, kcal: 77, p: 0.06, ca: 0.012 },
  sweet_potato: { label: " Sweet Potato", protein: 1.6, fat: 0.1, kcal: 86, p: 0.05, ca: 0.03 },
  zucchini: { label: " Fresh Zucchini", protein: 1.2, fat: 0.2, kcal: 17, p: 0.03, ca: 0.016 },
  carrot: { label: " Grated Carrot", protein: 0.9, fat: 0.2, kcal: 41, p: 0.03, ca: 0.033 },
  spinach: { label: " Steamed Spinach", protein: 2.9, fat: 0.4, kcal: 23, p: 0.04, ca: 0.09 },
  oil: { label: " Premium Fish Oil", protein: 0, fat: 100, kcal: 900, p: 0, ca: 0 }, 
};

export default function PetNutritionWebsite() {
  const [form, setForm] = useState({ 
    name: "", 
    species: "dog" as "dog" | "cat",
    breedKey: "g_shepherd",
    gender: "male",
    reproductionStatus: "normal",
    ageStage: "adult",
    activity: "normal", 
    disease: "none", 
    selectedIngredients: ["chicken", "rice", "oil"] 
  });

  const [result, setResult] = useState<any>(null); 
  const [recipe, setRecipe] = useState<any>(null);
  const [totals, setTotals] = useState({ protein: 0, fat: 0, p: 0, ca: 0 });

  const getDynamicWeight = () => {
    const breed = BREED_DATABASE[form.breedKey];
    if (!breed) return 20;
    return form.gender === "male" ? breed.maleWeight : breed.femaleWeight;
  };

  const calculateFEDIAF_MER = () => {
    const weight = getDynamicWeight();
    const breed = BREED_DATABASE[form.breedKey] || { size: "medium" };
    let baseEnergy = 0;
    
    if (form.species === "cat") {
      if (form.ageStage === "adult") {
        const factors: Record<string, number> = { low: 75, normal: 100, active: 140 };
        baseEnergy = (factors[form.activity] || 100) * Math.pow(weight, 0.67);
      } else {
        if (form.ageStage === "kitten_young") baseEnergy = 250 * Math.pow(weight, 0.67); 
        else if (form.ageStage === "kitten_mid") baseEnergy = 175 * Math.pow(weight, 0.67);   
        else baseEnergy = 100 * Math.pow(weight, 0.67); 
      }
      if (form.gender === "female") {
        if (form.reproductionStatus === "pregnant") baseEnergy *= 1.40;
        if (form.reproductionStatus === "lactating") baseEnergy *= 2.80;
      }
      return baseEnergy;
    }
    
    if (form.species === "dog") {
      if (form.ageStage === "adult") {
        const factors: Record<string, number> = { low: 95, normal: 110, active: 130, working: 210 };
        baseEnergy = (factors[form.activity] || 110) * Math.pow(weight, 0.75);
      } else {
        let growthFactor = 130; 
        if (form.ageStage === "puppy_young") {
          growthFactor = breed.size === "large" ? 190 : 175; 
        } else if (form.ageStage === "puppy_older" && breed.size === "large") {
          growthFactor = 140; 
        }
        baseEnergy = growthFactor * Math.pow(weight, 0.75);
      }
      if (form.gender === "female") {
        if (form.reproductionStatus === "pregnant") baseEnergy *= 1.50; 
        if (form.reproductionStatus === "lactating") baseEnergy *= 3.00;
      }
      return baseEnergy;
    }
    return 110 * Math.pow(weight, 0.75);
  };

  const handleCalculate = () => { 
    const mer = calculateFEDIAF_MER();
    const breed = BREED_DATABASE[form.breedKey] || { size: "medium" };
    const isDemanding = form.reproductionStatus !== "normal" || form.ageStage !== "adult";
    
    let target = { protein: 35, fat: 11, p: 0.6, ca: 0.8 };
    if (form.species === "cat") {
      target = isDemanding ? { protein: 72, fat: 24, p: 1.15, ca: 1.45 } : { protein: 50, fat: 18, p: 0.8, ca: 1.0 };
    } else {
      if (isDemanding) {
        if (breed.size === "large") target = { protein: 60, fat: 17, p: 0.85, ca: 1.1 };
        else if (breed.size === "small") target = { protein: 54, fat: 16, p: 0.80, ca: 1.2 };
        else target = { protein: 56, fat: 15, p: 0.82, ca: 1.15 };
      }
    }

    const diseaseRules: Record<string, any> = { 
      none: { protein: 1, fat: 1, p: 1, ca: 1 }, 
      kidney: { protein: 0.80, fat: 1.20, p: 0.50, ca: 0.9 }, 
      obesity: { protein: 1.20, fat: 0.60, p: 1, ca: 1 },    
      hepatic: { protein: 0.85, fat: 0.85, p: 0.9, ca: 1 }, 
    };
    const rule = diseaseRules[form.disease] || diseaseRules.none;
    const base = mer / form.selectedIngredients.length || mer; 
    
    let optimized: Record<string, number> = {}; 
    form.selectedIngredients.forEach((ing) => { 
      optimized[ing] = base / (INGREDIENTS_DB[ing].kcal / 100); 
    }); 

    for (let i = 0; i < 7; i++) { 
      let protein = 0; let fat = 0; let p = 0; 
      Object.keys(optimized).forEach((ing) => { 
        const qty = optimized[ing]; 
        protein += (INGREDIENTS_DB[ing].protein * qty) / 100; 
        fat += (INGREDIENTS_DB[ing].fat * qty) / 100; 
        p += (INGREDIENTS_DB[ing].p * qty) / 100; 
      }); 
      if (protein < target.protein * rule.protein) { optimized.chicken = (optimized.chicken || 0) * 1.06; } 
      if (p > target.p * rule.p) { 
        if (optimized.liver) optimized.liver *= 0.82; 
        if (optimized.chicken_giblets) optimized.chicken_giblets *= 0.88; 
      } 
      if (fat < target.fat * rule.fat) { if (optimized.oil) optimized.oil *= 1.18; } 
    } 

    let tProtein = 0; let tFat = 0; let tP = 0; let tCa = 0;
    Object.entries(optimized).forEach(([ing, qty]) => {
      tProtein += (INGREDIENTS_DB[ing].protein * qty) / 100;
      tFat += (INGREDIENTS_DB[ing].fat * qty) / 100;
      tP += (INGREDIENTS_DB[ing].p * qty) / 100;
      tCa += (INGREDIENTS_DB[ing].ca * qty) / 100;
    });

    setResult({ mer, water: mer * 1.0 }); 
    setRecipe(optimized); 
    setTotals({ protein: tProtein, fat: tFat, p: tP, ca: tCa });
  };

  const toggleIngredient = (ing: string) => { 
    setForm((prev) => { 
      const exists = prev.selectedIngredients.includes(ing); 
      return { ...prev, selectedIngredients: exists ? prev.selectedIngredients.filter((i) => i !== ing) : [...prev.selectedIngredients, ing] }; 
    }); 
  };

  const activeBreeds = Object.entries(BREED_DATABASE).filter(([_, b]) => b.species === form.species);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-6xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="p-6 md:p-8 bg-slate-900 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔬</span>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                FEDIAF Clinical Formulation
              </h1>
            </div>
            <p className="text-slate-500 text-xs mb-6">Precision clinical nutrition engine tracking real breed dynamics.</p>

            {!result && (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 mt-8 bg-slate-950/40">
                <span className="text-5xl block mb-4">📊</span>Configure pet metrics and execute engine.
              </div>
            )}

            {result && (
              <div className="space-y-5 mt-2">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">⚡ Daily Metabolic Thresholds</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/10">
                      <span className="text-[10px] text-emerald-400 block font-semibold mb-0.5">Energy Target (MER)</span>
                      <span className="text-xl font-bold text-emerald-400">{result.mer.toFixed(0)} <span className="text-xs font-normal text-slate-500">kcal</span></span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-teal-500/10">
                      <span className="text-[10px] text-teal-400 block font-semibold mb-0.5">Fluid Requirement</span>
                      <span className="text-xl font-bold text-teal-400">{result.water.toFixed(0)} <span className="text-xs font-normal text-slate-500">ml</span></span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 text-center font-mono">
                    Calculated Weight Reference: <span className="text-teal-400 font-bold">{getDynamicWeight()} kg</span>
                  </div>
                </div>

                <div className="bg-emerald-950/10 p-4 rounded-xl border border-emerald-500/10">
                  <h3 className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-3">🥗 Daily Recipe Formula</h3>
                  <div className="space-y-2">
                    {Object.entries(recipe).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-900">
                        <span className="font-medium text-slate-300 text-sm">{INGREDIENTS_DB[k]?.label || k}</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{(v as number).toFixed(1)} g</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-950/20 border border-blue-500/20 p-2 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-blue-400 uppercase">Protein</span>
                    <span className="text-sm font-black text-blue-200">{totals.protein.toFixed(1)}g</span>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-500/20 p-2 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-amber-400 uppercase">Fat</span>
                    <span className="text-sm font-black text-amber-200">{totals.fat.toFixed(1)}g</span>
                  </div>
                  <div className="bg-purple-950/20 border border-purple-500/20 p-2 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-purple-400 uppercase">Phos</span>
                    <span className="text-sm font-black text-purple-200">{totals.p.toFixed(2)}g</span>
                  </div>
                  <div className="bg-teal-950/20 border border-teal-500/20 p-2 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-teal-400 uppercase">Calc</span>
                    <span className="text-sm font-black text-teal-200">{totals.ca.toFixed(2)}g</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">FEDIAF Standard v2</div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 md:p-8 space-y-4 bg-slate-950/10">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">⚙️ Parameter Profiler</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Pet Name</label>
              <input className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Species</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.species} onChange={(e) => {
                const sp = e.target.value as "dog" | "cat";
                const first = Object.keys(BREED_DATABASE).find(k => BREED_DATABASE[k].species === sp) || "";
                setForm({ ...form, species: sp, breedKey: first, ageStage: "adult" });
              }}>
                <option value="dog">🐶 Dog</option>
                <option value="cat">🐱 Cat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Breed</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.breedKey} onChange={(e) => setForm({ ...form, breedKey: e.target.value })}>
                {activeBreeds.map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Age Stage</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.ageStage} onChange={(e) => setForm({ ...form, ageStage: e.target.value })}>
                <option value="adult">🐕 Adult</option>
                {form.species === "dog" && <option value="puppy_young">🍼 Puppy (&lt; 3mo)</option>}
                {form.species === "dog" && <option value="puppy_older">🦴 Puppy (3-12mo)</option>}
                {form.species === "cat" && <option value="kitten_young">🍼 Kitten (&lt; 4mo)</option>}
                {form.species === "cat" && <option value="kitten_mid">🐈 Kitten (4-9mo)</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
              <select className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value, reproductionStatus: "normal" })}>
                <option value="male">♂️ Male</option>
                <option value="female">♀️ Female</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Physiology</label>
              <select className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none" value={form.reproductionStatus} onChange={(e) => setForm({ ...form, reproductionStatus: e.target.value })} disabled={form.gender !== "female" || form.ageStage !== "adult"}>
                <option value="normal">Standard</option>
                <option value="pregnant">🤰 Pregnant</option>
                <option value="lactating">🥛 Lactating</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Activity</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} disabled={form.ageStage !== "adult" || form.reproductionStatus !== "normal"}>
                <option value="low">Sedentary</option>
                <option value="normal">Normal</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Pathology</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none" value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })}>
                <option value="none">🌿 Healthy</option>
                <option value="kidney">🏥 Renal (Low P)</option>
                <option value="obesity">⚖️ Obesity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">Ingredients Pool</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {Object.keys(INGREDIENTS_DB).map((ing) => (
                <button key={ing} type="button" onClick={() => toggleIngredient(ing)} className={`p-2 border rounded-xl text-xs transition-all flex items-center justify-between ${form.selectedIngredients.includes(ing) ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
                  <span>{INGREDIENTS_DB[ing].label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleCalculate} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black p-3 rounded-xl uppercase tracking-wider text-xs">
            🚀 Execute Optimization Engine
          </button>
        </div>

      </div>
    </div>
  );
}
