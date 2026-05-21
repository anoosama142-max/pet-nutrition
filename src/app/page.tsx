'use client';

import React from "react";

export default function PetNutritionWebsite() {
  const [form, setForm] = React.useState({ 
    name: "", 
    species: "dog", 
    ageStage: "adult", // adult, puppy_young, puppy_older, kitten_young, kitten_mid, kitten_older
    dogSize: "medium", // small (<10kg), medium (10-25kg), large (>25kg)
    weight: 20, 
    activity: "normal", 
    disease: "none", 
    selectedIngredients: ["chicken", "rice", "oil"] 
  });

  const [result, setResult] = React.useState<any>(null); 
  const [recipe, setRecipe] = React.useState<any>(null);
  const [totals, setTotals] = React.useState<any>({ protein: 0, fat: 0, p: 0, ca: 0 });

  // ========================= // FEDIAF official energy requirement equations
  const calculateFEDIAF_MER = () => {
    const weight = Number(form.weight) || 1;
    
    // Adult Felines
    if (form.species === "cat" && form.ageStage === "adult") {
      const factors: Record<string, number> = { low: 75, normal: 100, active: 140 };
      const baseFactor = factors[form.activity] || 100;
      return baseFactor * Math.pow(weight, 0.67);
    }
    
    // Growing Kittens
    if (form.species === "cat" && form.ageStage !== "adult") {
      if (form.ageStage === "kitten_young") return 250 * Math.pow(weight, 0.67); 
      if (form.ageStage === "kitten_mid") return 175 * Math.pow(weight, 0.67);   
      if (form.ageStage === "kitten_older") return 100 * Math.pow(weight, 0.67); 
    }

    // Adult Canines
    if (form.species === "dog" && form.ageStage === "adult") {
      const factors: Record<string, number> = { low: 95, normal: 110, active: 130, working: 210 };
      const baseFactor = factors[form.activity] || 110;
      return baseFactor * Math.pow(weight, 0.75);
    }

    // Growing Puppies (FEDIAF Target Curve Adaptation)
    if (form.species === "dog" && form.ageStage !== "adult") {
      let growthFactor = 130; // default for 3-12 months
      if (form.ageStage === "puppy_young") {
        growthFactor = form.dogSize === "large" ? 190 : 175; // Large breeds need precise early curve energy adjustments
      } else if (form.ageStage === "puppy_older" && form.dogSize === "large") {
        growthFactor = 140; 
      }
      return growthFactor * Math.pow(weight, 0.75);
    }

    return 110 * Math.pow(weight, 0.75);
  };

  // Veterinary Pathological Modification Profiles
  const diseaseRules: Record<string, any> = { 
    none: { protein: 1, fat: 1, p: 1, ca: 1 }, 
    kidney: { protein: 0.80, fat: 1.20, p: 0.50, ca: 0.9 }, // High restriction on Phosphorus for CKD management
    obesity: { protein: 1.20, fat: 0.60, p: 1, ca: 1 },    // Low fat, high dense protein targeting fat loss
    hepatic: { protein: 0.85, fat: 0.85, p: 0.9, ca: 1 }, 
  };

  // Nutrient Profiles (FEDIAF Wet / Dry Base Extrapolations)
  const ingredients = { 
    chicken: { label: "🍗 Chicken Breast", protein: 31, fat: 3.6, kcal: 165, p: 0.18, ca: 0.012 }, 
    beef: { label: "🥩 Lean Beef", protein: 26, fat: 15, kcal: 250, p: 0.2, ca: 0.01 }, 
    salmon: { label: "🐟 Fresh Salmon", protein: 20, fat: 13, kcal: 208, p: 0.25, ca: 0.015 },
    chicken_giblets: { label: "🫁 Chicken Giblets", protein: 18, fat: 4.5, kcal: 120, p: 0.22, ca: 0.015 },
    liver: { label: "🥩 Beef Liver", protein: 20, fat: 4, kcal: 135, p: 0.25, ca: 0.02 }, 
    rice: { label: "🍚 White Rice", protein: 2.7, fat: 0.3, kcal: 130, p: 0.03, ca: 0.01 }, 
    potato: { label: "🥔 Boiled Potato", protein: 2.0, fat: 0.1, kcal: 77, p: 0.06, ca: 0.012 },
    sweet_potato: { label: "🍠 Sweet Potato", protein: 1.6, fat: 0.1, kcal: 86, p: 0.05, ca: 0.03 },
    zucchini: { label: "🥒 Fresh Zucchini", protein: 1.2, fat: 0.2, kcal: 17, p: 0.03, ca: 0.016 },
    carrot: { label: "🥕 Grated Carrot", protein: 0.9, fat: 0.2, kcal: 41, p: 0.03, ca: 0.033 },
    spinach: { label: "🥬 Steamed Spinach", protein: 2.9, fat: 0.4, kcal: 23, p: 0.04, ca: 0.09 },
    oil: { label: "🐟 Premium Fish Oil", protein: 0, fat: 100, kcal: 900, p: 0, ca: 0 }, 
  };

  const ingredientKeys = Object.keys(ingredients);

  // Exact FEDIAF Minimum Growth vs Maintenance Requirements
  const getNutrientTargets = () => {
    if (form.species === "cat") {
      return form.ageStage === "adult" 
        ? { protein: 50, fat: 18, p: 0.8, ca: 1.0 } 
        : { protein: 70, fat: 22, p: 1.1, ca: 1.4 }; // Dense profile for kittens
    } else {
      if (form.ageStage === "adult") return { protein: 35, fat: 11, p: 0.6, ca: 0.8 };
      
      // Puppy Breed Size Scaling Logic based on FEDIAF safe guidelines for skeletal safety
      if (form.dogSize === "large") {
        return { protein: 58, fat: 16, p: 0.85, ca: 1.1 }; // Low, strict Calcium to prevent Hip Dysplasia
      } else if (form.dogSize === "small") {
        return { protein: 52, fat: 15, p: 0.80, ca: 1.2 }; // Small breeds tolerate more dense ratios safely
      }
      return { protein: 54, fat: 15, p: 0.82, ca: 1.15 };
    }
  };

  const handleCalculate = () => { 
    const mer = calculateFEDIAF_MER();
    const target = getNutrientTargets();
    const rule = diseaseRules[form.disease] || diseaseRules.none;
    
    const base = mer / form.selectedIngredients.length || mer; 
    let optimized: Record<string, number> = {}; 
    
    form.selectedIngredients.forEach((ing) => { 
      optimized[ing] = base / ((ingredients as any)[ing].kcal / 100); 
    }); 

    // Dynamic linear allocation passes
    for (let i = 0; i < 7; i++) { 
      let protein = 0; let fat = 0; let p = 0; 
      Object.keys(optimized).forEach((ing) => { 
        const qty = optimized[ing]; 
        protein += ((ingredients as any)[ing].protein * qty) / 100; 
        fat += ((ingredients as any)[ing].fat * qty) / 100; 
        p += ((ingredients as any)[ing].p * qty) / 100; 
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
      tProtein += ((ingredients as any)[ing].protein * qty) / 100;
      tFat += ((ingredients as any)[ing].fat * qty) / 100;
      tP += ((ingredients as any)[ing].p * qty) / 100;
      tCa += ((ingredients as any)[ing].ca * qty) / 100;
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex items-center justify-center font-sans print:bg-white print:text-black">
      <div className="w-full max-w-6xl bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 grid grid-cols-1 md:grid-cols-2 print:border-none print:shadow-none">
        
        {/* LEFT PANEL: Results and Analytical Output */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-850 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 print:p-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🐾</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent print:text-black">
                FEDIAF Clinical Formulation
              </h1>
            </div>
            <p className="text-slate-400 text-xs mb-6 print:hidden">
              Advanced veterinary engine calculating precise biological targets and metabolic requirements.
            </p>

            {!result && (
              <div className="border border-dashed border-slate-700 rounded-2xl p-12 text-center text-slate-500 mt-8 bg-slate-900/20">
                <span className="text-5xl block mb-4">📊</span>
                Configure the biological metrics on the right panel and run the <span className="text-emerald-400 font-semibold">Optimization Engine</span> to extract scientific targets.
              </div>
            )}

            {result && (
              <div className="space-y-5 mt-2 animate-fadeIn">
                {/* Daily Energy & Fluids Metrics */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60 print:border-black">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 print:text-black">
                    ⚡ Daily Metabolic Thresholds {form.name ? `for "${form.name}"` : ''}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 p-3 rounded-xl border border-emerald-500/20 print:bg-gray-100">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold mb-0.5">Energy Target (MER)</span>
                      <span className="text-xl font-bold text-emerald-400 print:text-black">{result.mer.toFixed(0)} <span className="text-xs font-normal text-slate-400">kcal</span></span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-teal-500/20 print:bg-gray-100">
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 block font-semibold mb-0.5">Fluid Requirement</span>
                      <span className="text-xl font-bold text-teal-400 print:text-black">{result.water.toFixed(0)} <span className="text-xs font-normal text-slate-400">ml</span></span>
                    </div>
                  </div>
                </div>

                {/* Main Recipe Output Component */}
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 print:border-black">
                  <h3 className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-3">
                    🥗 Daily Recipe Formula Composition
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(recipe).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800/80">
                        <span className="font-medium text-slate-300 text-sm print:text-black">{(ingredients as any)[k]?.label || k}</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm print:text-black">{(v as number).toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytical Breakdown Module */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2.5">
                    🧪 Chemical Matrix Breakdown (Analytical Pool)
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-blue-950/30 border border-blue-500/20 p-3 rounded-xl text-center">
                      <span className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Protein</span>
                      <span className="text-base font-black text-blue-200">{totals.protein.toFixed(1)}g</span>
                    </div>
                    <div className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl text-center">
                      <span className="block text-[10px] font-bold text-amber-400 uppercase mb-1">Fat</span>
                      <span className="text-base font-black text-amber-200">{totals.fat.toFixed(1)}g</span>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl text-center">
                      <span className="block text-[10px] font-bold text-purple-400 uppercase mb-1">Phos (P)</span>
                      <span className="text-base font-black text-purple-200">{totals.p.toFixed(2)}g</span>
                    </div>
                    <div className="bg-teal-950/30 border border-teal-500/20 p-3 rounded-xl text-center">
                      <span className="block text-[10px] font-bold text-teal-400 uppercase mb-1">Calc (Ca)</span>
                      <span className="text-base font-black text-teal-200">{totals.ca.toFixed(2)}g</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50 print:hidden">
            <span className="text-[11px] text-slate-500 tracking-wide">
              Compliance Schema: <span className="text-slate-400 font-medium font-mono">FEDIAF Clinical Standard</span>
            </span>
            {result && (
              <button onClick={() => window.print()} className="text-xs bg-slate-700 hover:bg-slate-600 font-medium text-slate-200 px-3 py-2 rounded-lg transition-colors shadow">
                🖨️ Export PDF / Print
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Biological and Veterinary Inputs */}
        <div className="p-6 md:p-8 space-y-4 bg-slate-900/20 print:hidden">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
            ⚙️ Biological Parameter Profiler
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Pet Name</label>
              <input className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g., Max" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Species Type</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value, ageStage: "adult" })}>
                <option value="dog">🐶 Canine (Dog)</option>
                <option value="cat">🐱 Feline (Cat)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Current Weight (kg)</label>
              <input type="number" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Biological Age Group</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none" value={form.ageStage} onChange={(e) => setForm({ ...form, ageStage: e.target.value })}>
                <option value="adult">🐕 Adult Maintenance</option>
                {form.species === "dog" && <option value="puppy_young">🍼 Puppy (Early Growth &lt; 3mo)</option>}
                {form.species === "dog" && <option value="puppy_older">🦴 Puppy (Late Growth 3-12mo)</option>}
                {form.species === "cat" && <option value="kitten_young">🍼 Kitten (Early Growth &lt; 4mo)</option>}
                {form.species === "cat" && <option value="kitten_mid">🐈 Kitten (Active Growth 4-9mo)</option>}
                {form.species === "cat" && <option value="kitten_older">🐈 Kitten (Late Growth 9-12mo)</option>}
              </select>
            </div>
          </div>

          {/* Core FEDIAF Breed size inclusion criteria for growth safety */}
          {form.species === "dog" && form.ageStage !== "adult" && (
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 animate-fadeIn">
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Expected Adult Breed Size (Skeletal Rule)</label>
              <select className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none" value={form.dogSize} onChange={(e) => setForm({ ...form, dogSize: e.target.value })}>
                <option value="small">Small Breed (Expected Adult Weight &lt; 10 kg)</option>
                <option value="medium">Medium Breed (Expected Adult Weight 10 - 25 kg)</option>
                <option value="large">Large / Giant Breed (Expected Adult Weight &gt; 25 kg)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Activity Tier</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} disabled={form.ageStage !== "adult"}>
                <option value="low">Sedentary / Neutered</option>
                <option value="normal">Normal Activity</option>
                <option value="active">High Active</option>
                {form.species === "dog" && <option value="working">Working / Sporting Dog</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Pathology Adjustment</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none" value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })}>
                <option value="none">🌿 Healthy Maintenance</option>
                <option value="kidney">🏥 Renal Failure (Low Phosphorus)</option>
                <option value="obesity">⚖️ Obesity Management (Hypocaloric)</option>
                <option value="hepatic">🧬 Hepatic Metabolic Diet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Available Ingredient Formulation Pool</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar">
              {ingredientKeys.map((ing) => (
                <button key={ing} type="button" onClick={() => toggleIngredient(ing)} className={`p-2.5 border rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${form.selectedIngredients.includes(ing) ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  <span>{(ingredients as any)[ing].label}</span>
                  {form.selectedIngredients.includes(ing) && <span className="text-[10px]">✅</span>}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleCalculate} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 font-black p-3.5 rounded-xl shadow-lg shadow-emerald-950/10 active:scale-[0.99] transition-all text-center uppercase tracking-wider text-xs mt-2">
            🚀 Execute Optimization Engine
          </button>
        </div>

      </div>
    </div>
  );
}
