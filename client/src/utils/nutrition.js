// PREVIEW ONLY. Shows live totals while the user edits a draft meal. The server recomputes every
// value from the food catalogue when the meal is saved, so these numbers are never trusted or stored.
const r1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10;

export const gramsOf = (food, quantity, unit) => (unit === 'g' ? Number(quantity) || 0 : (Number(quantity) || 0) * food.servingGrams);

export function previewItem(item) {
  const k = gramsOf(item.food, item.quantity, item.unit) / 100;
  const f = item.food;
  return {
    calories: r1(f.caloriesPer100g * k),
    protein: r1(f.proteinPer100g * k),
    carbs: r1(f.carbsPer100g * k),
    fat: r1(f.fatPer100g * k),
  };
}

export const previewTotals = (items) =>
  items.reduce((t, i) => {
    const p = previewItem(i);
    return { calories: r1(t.calories + p.calories), protein: r1(t.protein + p.protein), carbs: r1(t.carbs + p.carbs), fat: r1(t.fat + p.fat) };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

/** Rebuild an editable draft item from a saved meal item (uses the live catalogue when it still exists). */
export function snapshotToFood(item, catalogueFood) {
  if (catalogueFood) return catalogueFood;
  const per = (v) => (item.grams > 0 ? (v / item.grams) * 100 : 0);
  return {
    _id: item.food, name: item.name, servingLabel: item.servingLabel || '1 serving',
    servingGrams: item.unit === 'serving' && item.quantity > 0 ? item.grams / item.quantity : item.grams || 100,
    caloriesPer100g: per(item.calories), proteinPer100g: per(item.protein), carbsPer100g: per(item.carbs), fatPer100g: per(item.fat),
  };
}
