'use client';

import React from "react";

// تعريف الأنواع (Types) لتجنب أي مشاكل مع الـ TypeScript على Vercel
interface IngredientsType {
  [key: string]: {
    protein: number;
    fat: number;
    kcal: number;
    p: number;
    ca: number;
  };
}

export default function PetNutritionWebsite() {
  // ========================= // FEDIAF-inspired engine (Dogs + Cats + Clinical layer) // =========================
  const calculateRER = (weightKg: number) => { 
    return 70 * Math.pow(weightKg, 0.75); 
  };

  const calculateMER = (rer: number, activity: string, species: string) => { 
    const factors: Record<string, number> = { 
      dog_low: 1.4, dog_normal: 1.6, dog_active: 2.0, dog_working: 3.5, dog_puppy: 3.0, 
      cat_low: 1.2, cat_normal: 1.4, cat_active: 1.6, cat_kitten: 2.5, 
    };
    return rer * (factors[`${species}_${activity}`] || 1.5); 
  };

  // ========================= // Disease logic // =========================
  const diseaseRules: Record<string, any> = { 
    none: { protein: 1, fat: 1, p: 1 }, 
    kidney: { protein: 0.85, fat: 1.1, p: 0.6 }, 
    obesity: { protein: 1.1, fat: 0.7, p: 1 }, 
    hepatic: { protein: 0.9, fat: 0.8, p: 0.9 }, 
  };

  // ========================= // Ingredient database // =========================
  const ingredients: IngredientsType = { 
    chicken: { protein: 31, fat: 3.6, kcal: 165, p: 0.18, ca: 0.012 }, 
    rice: { protein: 2.7, fat: 0.3, kcal: 130, p: 0.03, ca: 0.01 }, 
    beef: { protein: 26, fat: 15, kcal: 250, p: 0.2, ca: 0.01 }, 
    liver: { protein: 20, fat: 4, kcal: 135, p: 0.25, ca: 0.02 }, 
    oil: { protein: 0, fat: 100, kcal: 900, p: 0, ca: 0 }, 
  };

  const ingredientKeys = Object.keys(ingredients);

  const nutrientTargets = { 
    dog: { protein: 45, fat: 13.8, p: 1.0, ca: 1.25 }, 
    cat: { protein: 70, fat: 22.5, p: 1.2, ca: 1.5 }, 
  };

  // ========================= // Advanced optimizer // =========================
  const optimizeRecipe = (mer: number, species: 'dog' | 'cat', disease: string, selected: string[]) => { 
    const rule = diseaseRules[disease]; 
    const target = nutrientTargets[species];

    const base = mer / selected.length || mer; 
    let recipe: Record<string, number> = {}; 
    
    selected.forEach((ing) => { 
      recipe[ing] = base / (ingredients[ing].kcal / 100); 
    }); 

    for (let i = 0; i < 6; i++) { 
      let protein = 0; let fat = 0; let p = 0; 
      
      Object.keys(recipe).forEach((ing) => { 
        const qty = recipe[ing]; 
        protein += (ingredients[ing].protein * qty) / 100; 
        fat += (ingredients[ing].fat * qty) / 100; 
        p += (ingredients[ing].p * qty) / 100; 
      }); 

      if (protein < target.protein * rule.protein) { 
        recipe.chicken = (recipe.chicken || 0) * 1.05; 
      } 
      if (p > target.p * rule.p) { 
        if (recipe.liver) recipe.liver *= 0.9; 
        if (recipe.beef) recipe.beef *= 0.95; 
      } 
      if (fat < target.fat * rule.fat) { 
        if (recipe.oil) recipe.oil *= 1.1; 
      } 
    } 
    return recipe; 
  };

  const [form, setForm] = React.useState({ 
    name: "", 
    species: "dog" as 'dog' | 'cat', 
    weight: "20", // خليناها string عشان التعامل مع الـ inputs يكون مرن وسلس
    activity: "normal", 
    disease: "none", 
    selectedIngredients: ["chicken", "rice", "oil"], 
  });

  const [result, setResult] = React.useState<{rer: number, mer: number} | null>(null); 
  const [recipe, setRecipe] = React.useState<Record<string, number> | null>(null);

  const handleCalculate = () => { 
    const weight = Number(form.weight); 
    if (!weight || weight <= 0) return;
    
    const rer = calculateRER(weight); 
    const mer = calculateMER(rer, form.activity, form.species);

    const optimized = optimizeRecipe( mer, form.species, form.disease, form.selectedIngredients ); 
    setResult({ rer, mer }); 
    setRecipe(optimized); 
  };

  const toggleIngredient = (ing: string) => { 
    setForm((prev) => { 
      const exists = prev.selectedIngredients.includes(ing); 
      return { 
        ...prev, 
        selectedIngredients: exists 
          ? prev.selectedIngredients.filter((i) => i !== ing) 
          : [...prev.selectedIngredients, ing], 
      }; 
    }); 
  };

  return ( 
    // هنا تم التغليف في عنصر أب رئيسي وتنسيق الـ Grid ليعمل بشكل صحيح
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: Results */} 
        <div className="space-y-4"> 
          <h1 className="text-4xl font-bold text-green-400">Clinical Pet Nutrition Engine</h1> 
          
          {result && ( 
            <div className="mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700"> 
              <p className="text-lg">RER: <span className="font-bold text-green-400">{result.rer.toFixed(0)}</span> kcal/day</p> 
              <p className="text-lg">MER: <span className="font-bold text-green-400">{result.mer.toFixed(0)}</span> kcal/day</p> 
            </div> 
          )} 
          
          {recipe && ( 
            <div className="mt-4 bg-green-500/10 p-4 rounded-xl border border-green-500/30"> 
              <h3 className="font-bold mb-2 text-xl text-green-400">Recipe Output</h3> 
              {Object.entries(recipe).map(([k, v]) => ( 
                <p key={k} className="capitalize">{k}: <span className="font-bold">{v.toFixed(2)}</span> g</p> 
              ))} 
            </div> 
          )} 
        </div> 

        {/* RIGHT SIDE: Form Controls */} 
        <div className="space-y-4 bg-gray-800 p-6 rounded-xl border border-gray-700"> 
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pet Name</label>
            <input className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-green-500" placeholder="Pet Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /> 
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Species</label>
            <select className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-green-500" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value as 'dog' | 'cat' })} > 
              <option value="dog">Dog</option> 
              <option value="cat">Cat</option> 
            </select> 
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Clinical Condition</label>
            <select className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-green-500" value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })} > 
              <option value="none">No Disease (Healthy)</option> 
              <option value="kidney">Kidney Disease</option> 
              <option value="obesity">Obesity</option> 
              <option value="hepatic">Liver Disease</option> 
            </select> 
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
            <input type="number" className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-green-500" placeholder="Weight in kg" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /> 
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Select Ingredients</label>
            <div className="grid grid-cols-2 gap-2"> 
              {ingredientKeys.map((ing) => ( 
                <button key={ing} type="button" onClick={() => toggleIngredient(ing)} className={`p-2 border rounded capitalize transition-all ${form.selectedIngredients.includes(ing) ? "bg-green-500 text-black border-green-500 font-bold" : "bg-gray-900 text-white border-gray-700 hover:border-gray-500"}`} > 
                  {ing} 
                </button> 
              ))} 
            </div> 
          </div>

          <button onClick={handleCalculate} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold p-3 rounded transition-colors mt-4" > 
            Generate Diet 
          </button> 
        </div> 

      </div>
    </div>
  ); 
}
