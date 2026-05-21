'use client';

import React from "react";

export default function PetNutritionWebsite() {
  const [form, setForm] = React.useState({ 
    name: "", 
    species: "dog", 
    ageStage: "adult", // adult, puppy_young, puppy_older, kitten_young, kitten_mid, kitten_older
    dogSize: "medium", // small, medium, large (crucial for puppy safe calcium/p ratios)
    weight: 20, 
    activity: "normal", 
    disease: "none", 
    selectedIngredients: ["chicken", "rice", "oil"] 
  });

  const [result, setResult] = React.useState<any>(null); 
  const [recipe, setRecipe] = React.useState<any>(null);
  const [totals, setTotals] = React.useState<any>({ protein: 0, fat: 0, p: 0 });

  // ========================= // FEDIAF official energy requirement equations
  const calculateFEDIAF_MER = () => {
    const weight = Number(form.weight) || 1;
    
    // Adult Cats
    if (form.species === "cat" && form.ageStage === "adult") {
      const factors: Record<string, number> = { low: 75, normal: 100, active: 140 };
      const baseFactor = factors[form.activity] || 100;
      return baseFactor * Math.pow(weight, 0.67);
    }
    
    // Growing Kittens (FEDIAF Guidelines)
    if (form.species === "cat" && form.ageStage !== "adult") {
      if (form.ageStage === "kitten_young") return 250 * Math.pow(weight, 0.67); // < 4 months
      if (form.ageStage === "kitten_mid") return 175 * Math.pow(weight, 0.67);   // 4-9 months
      if (form.ageStage === "kitten_older") return 100 * Math.pow(weight, 0.67); // 9-12 months
    }

    // Adult Dogs
    if (form.species === "dog" && form.ageStage === "adult") {
      const factors: Record<string, number> = { low: 95, normal: 110, active: 130, working: 210 };
      const baseFactor = factors[form.activity] || 110;
      return baseFactor * Math.pow(weight, 0.75);
    }

    // Growing Puppies (FEDIAF Guidelines)
    if (form.species === "dog" && form.ageStage !== "adult") {
      if (form.ageStage === "puppy_young") return 175 * Math.pow(weight, 0.75); // < 3 months
      if (form.ageStage === "puppy_older") return 130 * Math.pow(weight, 0.75); // 3-12 months
    }

    return 110 * Math.pow(weight, 0.75);
  };

  // Pathology profiles
  const diseaseRules: Record<string, any> = { 
    none: { protein: 1, fat: 1, p: 1 }, 
    kidney: { protein: 0.82, fat: 1.15, p: 0.55 }, // Strict control over Phosphorus for CKD
    obesity: { protein: 1.15, fat: 0.65, p: 1 }, 
    hepatic: { protein: 0.88, fat: 0.85, p: 0.9 }, 
  };

  // Nutritional composition database (FEDIAF aligned dry matter/wet estimates)
  const ingredients = { 
    chicken: { label: "🍗 Chicken (دجاج مخلي)", protein: 31, fat: 3.6, kcal: 165, p: 0.18 }, 
    beef: { label: "🥩 Beef (لحم بقري)", protein: 26, fat: 15, kcal: 250, p: 0.2 }, 
    salmon: { label: "🐟 Salmon (سلمون)", protein: 20, fat: 13, kcal: 208, p: 0.25 },
    chicken_giblets: { label: "🫁 Chicken Giblets (أحشاء وقوانص)", protein: 18, fat: 4.5, kcal: 120, p: 0.22 },
    liver: { label: "🥩 Liver (كبدة بقري/دجاج)", protein: 20, fat: 4, kcal: 135, p: 0.25 }, 
    rice: { label: "🍚 Rice (أرز مطهو)", protein: 2.7, fat: 0.3, kcal: 130, p: 0.03 }, 
    potato: { label: "🥔 Potato (بطاطس مسلوقة)", protein: 2.0, fat: 0.1, kcal: 77, p: 0.06 },
    sweet_potato: { label: "🍠 Sweet Potato (بطاطا حلوة)", protein: 1.6, fat: 0.1, kcal: 86, p: 0.05 },
    zucchini: { label: "🥒 Zucchini (كوسة مسلوقة)", protein: 1.2, fat: 0.2, kcal: 17, p: 0.03 },
    carrot: { label: "🥕 Carrot (جزر مبشور)", protein: 0.9, fat: 0.2, kcal: 41, p: 0.03 },
    spinach: { label: "🥬 Spinach (سبانخ)", protein: 2.9, fat: 0.4, kcal: 23, p: 0.04 },
    oil: { label: "🐟 Fish Oil (زيت سمك نقّي)", protein: 0, fat: 100, kcal: 900, p: 0 }, 
  };

  const ingredientKeys = Object.keys(ingredients);

  // Growth requires strictly higher structural protein and minimal mineral balance
  const getNutrientTargets = () => {
    if (form.species === "cat") {
      return form.ageStage === "adult" 
        ? { protein: 50, fat: 18, p: 0.9 } 
        : { protein: 70, fat: 22, p: 1.1 }; // Kitten target
    } else {
      if (form.ageStage === "adult") return { protein: 35, fat: 12, p: 0.7 };
      // Puppy growth targets
      return form.dogSize === "large" 
        ? { protein: 55, fat: 16, p: 0.9 } // Large breed safe growth
        : { protein: 50, fat: 15, p: 0.8 };
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

    // Balanced refinement passes
    for (let i = 0; i < 6; i++) { 
      let protein = 0; let fat = 0; let p = 0; 
      Object.keys(optimized).forEach((ing) => { 
        const qty = optimized[ing]; 
        protein += ((ingredients as any)[ing].protein * qty) / 100; 
        fat += ((ingredients as any)[ing].fat * qty) / 100; 
        p += ((ingredients as any)[ing].p * qty) / 100; 
      }); 
      if (protein < target.protein * rule.protein) { optimized.chicken = (optimized.chicken || 0) * 1.05; } 
      if (p > target.p * rule.p) { if (optimized.liver) optimized.liver *= 0.85; if (optimized.chicken_giblets) optimized.chicken_giblets *= 0.9; } 
      if (fat < target.fat * rule.fat) { if (optimized.oil) optimized.oil *= 1.15; } 
    } 

    let tProtein = 0; let tFat = 0; let tP = 0;
    Object.entries(optimized).forEach(([ing, qty]) => {
      tProtein += ((ingredients as any)[ing].protein * qty) / 100;
      tFat += ((ingredients as any)[ing].fat * qty) / 100;
      tP += ((ingredients as any)[ing].p * qty) / 100;
    });

    setResult({ mer, water: mer * 1.0 }); 
    setRecipe(optimized); 
    setTotals({ protein: tProtein, fat: tFat, p: tP });
  };

  const toggleIngredient = (ing: string) => { 
    setForm((prev) => { 
      const exists = prev.selectedIngredients.includes(ing); 
      return { ...prev, selectedIngredients: exists ? prev.selectedIngredients.filter((i) => i !== ing) : [...prev.selectedIngredients, ing] }; 
    }); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex items-center justify-center font-sans print:bg-white print:text-black">
      <div className="w-full max-w-6xl bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 grid grid-cols-1 md:grid-cols-2 print:border-none print:shadow-none">
        
        {/* LEFT COLUMN: Formulations & Output */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-800/50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 print:p-0">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🐾</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent print:text-black">
                FEDIAF Clinical Nutrition Engine
              </h1>
            </div>
            <p className="text-slate-400 text-sm mb-6 print:hidden">
              برمجية معتمدة على معادلات التغذية الإكلينيكية الرسمية للأعمار والحالات المرضية المختلفة.
            </p>

            {!result && (
              <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center text-slate-500 mt-8">
                <span className="text-4xl block mb-2">📊</span>
                قم بتهيئة الملف البيولوجي على اليمين ثم اضغط <span className="text-emerald-400 font-semibold">تشغيل محرك الحسابات</span>.
              </div>
            )}

            {result && (
              <div className="space-y-4 mt-2">
                {/* Energy & Hydration Metrics */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 print:border-black">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 print:text-black">
                    ⚡ حسابات الطاقة والترطيب اليومية {form.name ? `لأليفكم "${form.name}"` : ''}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 p-3 rounded-lg border border-emerald-500/30 print:bg-gray-100">
                      <span className="text-xs text-emerald-400 block font-medium">الاحتياج اليومي (MER)</span>
                      <span className="text-xl font-bold text-emerald-400 print:text-black">{result.mer.toFixed(0)} <span className="text-xs font-normal text-slate-400">سعرة حرارية</span></span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-teal-500/30 print:bg-gray-100">
                      <span className="text-xs text-teal-400 block font-medium">💧 كمية الماء الصافي</span>
                      <span className="text-xl font-bold text-teal-400 print:text-black">{result.water.toFixed(0)} <span className="text-xs font-normal text-slate-400">ملي/يوم</span></span>
                    </div>
                  </div>
                </div>

                {/* Main Recipe Grams */}
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 print:border-black">
                  <h3 className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-3">
                    🥗 مكونات الوجبة اليومية المقترحة بالجرام
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(recipe).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/80">
                        <span className="font-medium text-slate-300 print:text-black">{(ingredients as any)[k]?.label || k}</span>
                        <span className="font-mono font-bold text-emerald-400 print:text-black">{(v as number).toFixed(1)} <span className="text-xs font-normal text-slate-400">جرام</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CLINICAL SEPARATE HIGH-LIGHTED NUTRIENT CARDS */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                    🧪 التقرير المخبري الكيميائي للمغذيات (Analytical Breakdown)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-950/40 border border-blue-500/30 p-3 rounded-xl text-center">
                      <span className="block text-xs font-semibold text-blue-400 mb-1">البروتين الإجمالي</span>
                      <span className="text-lg font-black text-blue-200">{totals.protein.toFixed(1)}g</span>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-center">
                      <span className="block text-xs font-semibold text-amber-400 mb-1">الدهون الإجمالية</span>
                      <span className="text-lg font-black text-amber-200">{totals.fat.toFixed(1)}g</span>
                    </div>
                    <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-xl text-center">
                      <span className="block text-xs font-semibold text-purple-400 mb-1">الفسفور الكلي</span>
                      <span className="text-lg font-black text-purple-200">{totals.p.toFixed(2)}g</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50 print:hidden">
            <span className="text-xs text-slate-500">
              المعايير المطبقة: <span className="text-slate-400 font-medium">FEDIAF Nutrition Rule Book</span>
            </span>
            {result && (
              <button onClick={() => window.print()} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                🖨️ طباعة الروشتة الغذائية
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Advanced Clinical Controls */}
        <div className="p-6 md:p-8 space-y-4 bg-slate-900/30 print:hidden text-right" dir="rtl">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2 justify-end">
            ⚙️ تهيئة معايير المريض البيولوجية
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">اسم الأليف</label>
              <input className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" placeholder="مثال: ماكس" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">النوع</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value, ageStage: "adult" })}>
                <option value="dog">🐶 كلب (Canine)</option>
                <option value="cat">🐱 قطة (Feline)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">الوزن الحالي (كيلوجرام)</label>
              <input type="number" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">المرحلة العمرية (FEDIAF)</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.ageStage} onChange={(e) => setForm({ ...form, ageStage: e.target.value })}>
                <option value="adult">🐕🐈 بالغ (Adult Maintenance)</option>
                {form.species === "dog" && <option value="puppy_young">🍼 جرو صغير (أقل من 3 شهور)</option>}
                {form.species === "dog" && <option value="puppy_older">🦴 جرو في طور النمو (3-12 شهر)</option>}
                {form.species === "cat" && <option value="kitten_young">🍼 كيتن صغير جداً (أقل من 4 شهور)</option>}
                {form.species === "cat" && <option value="kitten_mid">🐈 قط صغير في نمو نشط (4-9 شهور)</option>}
                {form.species === "cat" && <option value="kitten_older">🐈 قط في نهاية مرحلة النمو (9-12 شهر)</option>}
              </select>
            </div>
          </div>

          {form.species === "dog" && form.ageStage !== "adult" && (
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">حجم السلالة المتوقع عند البلوغ (هام لنسبة الكالسيوم)</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.dogSize} onChange={(e) => setForm({ ...form, dogSize: e.target.value })}>
                <option value="small">سلالة صغيرة (أقل من 10 كجم)</option>
                <option value="medium">سلالة متوسطة (10 - 25 كجم)</option>
                <option value="large">سلالة ضخمة / كبيرة (أكبر من 25 كجم)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">مستوى النشاط الحركي</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} disabled={form.ageStage !== "adult"}>
                <option value="low">خامل / معقم</option>
                <option value="normal">نشاط طبيعي</option>
                <option value="active">نشيط جداً</option>
                {form.species === "dog" && <option value="working">كلب حراسة / عمل شاق</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">الحالة الإكلينيكية / المرضية</label>
              <select className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm text-center" value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })}>
                <option value="none">🌿 سليم / وقائي (Healthy)</option>
                <option value="kidney">🏥 الفشل الكلوي المزمن (Low Phosphorus)</option>
                <option value="obesity">⚖️ برنامج السمنة والتخسيس (Hypocaloric)</option>
                <option value="hepatic">🧬 اعتلال الكبد (Hepatic Care)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">اختر مكونات الوجبة المتاحة في المطبخ</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pl-1 scrollbar" style={{ direction: 'ltr' }}>
              {ingredientKeys.map((ing) => (
                <button key={ing} type="button" onClick={() => toggleIngredient(ing)} className={`p-2.5 border rounded-xl text-xs font-medium transition-all flex items-center justify-between ${form.selectedIngredients.includes(ing) ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  <span>{(ingredients as any)[ing].label}</span>
                  {form.selectedIngredients.includes(ing) && <span>✅</span>}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleCalculate} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 font-black p-3.5 rounded-xl shadow-lg active:scale-[0.99] transition-all text-center mt-2 text-sm">
            🚀 تشغيل محرك الحسابات الطبي (FEDIAF Engine)
          </button>
        </div>

      </div>
    </div>
  );
}
