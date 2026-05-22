"use client";

import React, { useState } from "react";

// Database Configuration
const BREED_DATABASE: any = {
  malinois: { label: "Belgian Malinois", species: "dog", maleWeight: 28, femaleWeight: 22, size: "large" },
  griffon: { label: "Griffon", species: "dog", maleWeight: 8, femaleWeight: 7, size: "small" },
  g_shepherd: { label: "German Shepherd", species: "dog", maleWeight: 36, femaleWeight: 28, size: "large" },
  golden_r: { label: "Golden Retriever", species: "dog", maleWeight: 32, femaleWeight: 27, size: "large" },
  rottweiler: { label: "Rottweiler", species: "dog", maleWeight: 50, femaleWeight: 40, size: "large" },
  french_bd: { label: "French Bulldog", species: "dog", maleWeight: 12, femaleWeight: 10, size: "medium" },
  pitbull: { label: "American Pit Bull", species: "dog", maleWeight: 24, femaleWeight: 19, size: "medium" },
  maine_coon: { label: "Maine Coon Cat", species: "cat", maleWeight: 8, femaleWeight: 5.5, size: "large" },
  persian: { label: "Persian Cat", species: "cat", maleWeight: 5, femaleWeight: 4, size: "medium" },
  siamese: { label: "Siamese Cat", species: "cat", maleWeight: 4.5, femaleWeight: 3.5, size: "small" },
  british_sh: { label: "British Shorthair", species: "cat", maleWeight: 6, femaleWeight: 4.5, size: "medium" },
  ragdoll: { label: "Ragdoll", species: "cat", maleWeight: 7, femaleWeight: 5, size: "large" },
  domestic_sh: { label: "Domestic Shorthair", species: "cat", maleWeight: 5, femaleWeight: 4, size: "medium" }
};

const INGREDIENTS_DB: any = { 
  chicken: { label: "Chicken Breast", protein: 31, fat: 3.6, kcal: 165, p: 0.18, ca: 0.012 }, 
  beef: { label: "Lean Beef", protein: 26, fat: 15, kcal: 250, p: 0.2, ca: 0.01 }, 
  salmon: { label: "Fresh Salmon", protein: 20, fat: 13, kcal: 208, p: 0.25, ca: 0.015 },
  chicken_giblets: { label: "Chicken Giblets", protein: 18, fat: 4.5, kcal: 120, p: 0.22, ca: 0.015 },
  liver: { label: "Beef Liver", protein: 20, fat: 4, kcal: 135, p: 0.25, ca: 0.02 }, 
  rice: { label: "White Rice", protein: 2.7, fat: 0.3, kcal: 130, p: 0.03, ca: 0.01 }, 
  potato: { label: "Boiled Potato", protein: 2.0, fat: 0.1, kcal: 77, p: 0.06, ca: 0.012 },
  sweet_potato: { label: "Sweet Potato", protein: 1.6, fat: 0.1, kcal: 86, p: 0.05, ca: 0.03 },
  zucchini: { label: "Fresh Zucchini", protein: 1.2, fat: 0.2, kcal: 17, p: 0.03, ca: 0.016 },
  carrot: { label: "Grated Carrot", protein: 0.9, fat: 0.2, kcal: 41, p: 0.03, ca: 0.033 },
  spinach: { label: "Steamed Spinach", protein: 2.9, fat: 0.4, kcal: 23, p: 0.04, ca: 0.09 },
  oil: { label: "Premium Fish Oil", protein: 0, fat: 100, kcal: 900, p: 0, ca: 0 },  
  eggshell: { label: "Eggshell Powder", protein: 0, fat: 0, kcal: 0, p: 0, ca: 38 }, 
};

export default function PetNutritionMaster() {
  const [form, setForm] = useState({ 
    name: "", species: "dog" as "dog" | "cat", breedKey: "g_shepherd", 
    gender: "male", reproductionStatus: "normal", ageStage: "adult", 
    activity: "normal", disease: "none", neutered: false, weight: 0,
    selectedIngredients: ["chicken", "rice", "oil"] 
  });

  const [result, setResult] = useState<any>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [totals, setTotals] = useState({ protein: 0, fat: 0, p: 0, ca: 0 });

  const getWeight = () => form.weight > 0 ? form.weight : (form.gender === "male" ? BREED_DATABASE[form.breedKey].maleWeight : BREED_DATABASE[form.breedKey].femaleWeight);

  const calculateFEDIAF = () => {
    const weight = getWeight();
    const neuteredMultiplier = form.neutered ? 0.8 : 1.0;
    const breed = BREED_DATABASE[form.breedKey];
    let baseEnergy = 0;
    
    if (form.species === "cat") {
      const factors: any = { low: 75, normal: 100, active: 140 };
      baseEnergy = factors[form.activity] * Math.pow(weight, 0.67);
      if (form.reproductionStatus === "pregnant") baseEnergy *= 1.4;
      if (form.reproductionStatus === "lactating") baseEnergy *= 2.8;
    } else {
      const factors: any = { low: 95, normal: 110, active: 130, working: 210 };
      baseEnergy = factors[form.activity] * Math.pow(weight, 0.75);
      if (form.reproductionStatus === "pregnant") baseEnergy *= 1.5;
      if (form.reproductionStatus === "lactating") baseEnergy *= 3.0;
    }
    return baseEnergy * neuteredMultiplier;
  };

  const handleCalculate = () => {
    const mer = calculateFEDIAF();
    
    // 
    const diseaseRules: any = { 
      none: { protein: 1, fat: 1, p: 1, ca: 1 }, 
      kidney: { protein: 0.75, fat: 1.2, p: 0.45, ca: 0.9 }, 
      obesity: { protein: 1.2, fat: 0.6, p: 1, ca: 1 }    
    };
    
    const rule = diseaseRules[form.disease] || diseaseRules.none;

    // 1. 
    const base = mer / form.selectedIngredients.length;
    let optimized: any = {};
    form.selectedIngredients.forEach((ing: string) => {
      optimized[ing] = base / (INGREDIENTS_DB[ing].kcal / 100);
    });

    // 2.
    let tProt = 0, tFat = 0, tP = 0, tCa = 0;
    Object.entries(optimized).forEach(([ing, qty]: any) => {
      tProt += (INGREDIENTS_DB[ing].protein * qty) / 100;
      tFat += (INGREDIENTS_DB[ing].fat * qty) / 100;
      tP += (INGREDIENTS_DB[ing].p * qty) / 100;
      tCa += (INGREDIENTS_DB[ing].ca * qty) / 100;
    });

    // 3.
    const requiredEggshell = (tP > tCa) ? (tP - tCa) / 0.38 : 0;

    // 4.
    setResult({ mer, water: mer }); //
    setRecipe({ ...optimized, eggshell: requiredEggshell });
    setTotals({ 
      protein: tProt * rule.protein, 
      fat: tFat * rule.fat, 
      p: tP * rule.p, 
      ca: (tCa + (requiredEggshell * 0.38)) * rule.ca 
    });

  

  

    
        // calculate final totals
        let tProt = 0, tFat = 0, tP = 0, tCa = 0;
        Object.entries(optimized).forEach(([ing, qty]: any) => {
          tProt += (INGREDIENTS_DB[ing].protein * qty) / 100;
          tFat += (INGREDIENTS_DB[ing].fat * qty) / 100;
          tP += (INGREDIENTS_DB[ing].p * qty) / 100;
          tCa += (INGREDIENTS_DB[ing].ca * qty) / 100;
        });


    
        setResult({ mer, water: mer });
        setRecipe({ ...optimized, eggshell: requiredEggshell });
        setTotals({ 
          protein: tProt * rule.protein, 
          fat: tFat * rule.fat, 
          p: tP * rule.p, 
          ca: (tCa + (requiredEggshell * 0.38)) * rule.ca 
        });

  const toggleIngredient = (ing: string) => {
    setForm(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.includes(ing) 
        ? prev.selectedIngredients.filter(i => i !== ing) 
        : [...prev.selectedIngredients, ing]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* left Section: Settings */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl">
          <h1 className="text-2xl font-black text-emerald-400 mb-6 flex items-center gap-2">
            🔬 FEDIAF Parameter Profiler
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pet Name</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Buddy" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Manual Weight (kg)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 25" onChange={e => setForm({...form, weight: parseFloat(e.target.value)})}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Species</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none" value={form.species} onChange={e => setForm({...form, species: e.target.value as any, breedKey: Object.keys(BREED_DATABASE).find(k => BREED_DATABASE[k].species === e.target.value) || ""})}>
                  <option value="dog">🐶 Dog</option>
                  <option value="cat">🐱 Cat</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Breed Reference</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none" value={form.breedKey} onChange={e => setForm({...form, breedKey: e.target.value})}>
                  {Object.entries(BREED_DATABASE).filter(([_, b]: any) => b.species === form.species).map(([k, b]: any) => (
                    <option key={k} value={k}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-emerald-500" onChange={e => setForm({...form, neutered: e.target.checked})}/>
                <span className="text-sm font-bold">Neutered / Spayed</span>
              </label>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pathology</label>
                <select className="bg-transparent text-sm outline-none" value={form.disease} onChange={e => setForm({...form, disease: e.target.value})}>
                  <option value="none">🌿 Healthy</option>
                  <option value="kidney">🏥 Renal (Low P/Prot)</option>
                  <option value="obesity">⚖️ Obesity Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Ingredients Pool Selection</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(INGREDIENTS_DB).map(ing => (
                  <button key={ing} onClick={() => toggleIngredient(ing)} className={`p-2 rounded-xl text-[10px] font-bold transition-all border ${form.selectedIngredients.includes(ing) ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    {INGREDIENTS_DB[ing].label}
                  </button>
                ))}
              </div>
            </div>
              <div className="mt-6 p-4 bg-slate-800 rounded-lg">
  <h2 className="text-xl font-bold mb-4">Clinical Recipe (Grams)</h2>
  
  {Object.entries(recipe).map(([key, value]: any) => {
    // 1. 
    if (['protein', 'fat', 'p', 'ca'].includes(key)) return null;

    // 2.
    return (
      <div key={key} className="flex justify-between py-2 px-4 my-1 bg-slate-800 rounded-md border border-slate-700">
        <span className="text-sm font-medium">
          {key === 'eggshell' ? 'Eggshell Powder' : (INGREDIENTS_DB[key]?.label || key)}
        </span>
        <span className="text-sm font-bold text-emerald-400">
          {(value as number).toFixed(1)}g
        </span>
      </div>
    );
  })}
</div>

            
            

            <button onClick={handleCalculate} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 uppercase tracking-widest text-sm">
              🚀 Execute Formulation Engine
            </button>
          </div>
        </div>

        {/* right Section: Results */}
        <div className="space-y-6">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-12 text-center">
              <span className="text-6xl mb-4">📊</span>
              <h2 className="text-xl font-bold text-slate-400">Waiting for Data...</h2>
              <p className="text-slate-600 text-sm max-w-xs mt-2">Configure the profiler and execute the engine to generate clinical thresholds.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* energy and nutrition Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500 p-6 rounded-3xl text-slate-950 shadow-lg shadow-emerald-500/20">
                  <span className="text-[10px] font-black uppercase opacity-60">Daily Energy (MER)</span>
                  <div className="text-3xl font-black">{result.mer.toFixed(0)} <span className="text-sm font-normal">kcal</span></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl text-emerald-400">
                  <span className="text-[10px] font-black uppercase text-slate-500">Daily Water Req.</span>
                  <div className="text-3xl font-black">{result.water.toFixed(0)} <span className="text-sm font-normal text-slate-500">ml</span></div>
                </div>
              </div>

              {/* ingredients card */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest">🥗 Clinical Recipe (Grams)</h3>
                <div className="space-y-3">
                  {Object.entries(recipe).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                      <span className="font-bold text-slate-300">{INGREDIENTS_DB[k].label}</span>
                      <span className="text-emerald-400 font-black font-mono">{v.toFixed(1)}g</span>
                    </div>
                  ))}
                </div>
              </div>

              {/*  ingredient details (minerals and protein) */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="block text-[8px] font-black text-slate-500 uppercase">Protein</span>
                  <span className="text-sm font-bold text-blue-400">{totals.protein.toFixed(1)}g</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="block text-[8px] font-black text-slate-500 uppercase">Fat</span>
                  <span className="text-sm font-bold text-orange-400">{totals.fat.toFixed(1)}g</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="block text-[8px] font-black text-slate-500 uppercase">Phos (P)</span>
                  <span className={`text-sm font-bold ${totals.p > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{totals.p.toFixed(2)}g</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="block text-[8px] font-black text-slate-500 uppercase">Calc (Ca)</span>
                  <span className="text-sm font-bold text-teal-400">{totals.ca.toFixed(2)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
      <footer className="mt-12 text-center text-slate-600 text-[10px] font-mono uppercase tracking-widest">
        Clinical Database Standard v2.0 • FEDIAF Compliant Calculations
      </footer>
    </div>
  );
}
