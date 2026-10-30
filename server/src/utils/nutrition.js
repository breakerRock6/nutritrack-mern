// Pure nutrition math. No database or framework imports, so it is trivially unit-testable.
// All figures are ESTIMATES intended for general wellness tracking, not medical advice.

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);

export const round1 = (n) => Math.round((Number(n) + Number.EPSILON) * 10) / 10;
const roundTo = (n, step) => Math.round(n / step) * step;

/** Grams represented by a logged quantity. unit = 'g' (grams) or 'serving' (food.servingGrams each). */
export function gramsFor(food, quantity, unit = 'serving') {
  return unit === 'g' ? quantity : quantity * food.servingGrams;
}

/** Scale a food's per-100g values to a gram amount. */
export function scaleNutrition(food, grams) {
  const k = grams / 100;
  return {
    calories: round1(food.caloriesPer100g * k),
    protein: round1(food.proteinPer100g * k),
    carbs: round1(food.carbsPer100g * k),
    fat: round1(food.fatPer100g * k),
  };
}

export function sumNutrition(rows = []) {
  const t = rows.reduce(
    (a, r) => ({
      calories: a.calories + (r.calories || 0),
      protein: a.protein + (r.protein || 0),
      carbs: a.carbs + (r.carbs || 0),
      fat: a.fat + (r.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { calories: round1(t.calories), protein: round1(t.protein), carbs: round1(t.carbs), fat: round1(t.fat) };
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). 'other' uses the midpoint of the two constants. */
export function calculateBmr({ weightKg, heightCm, age, gender = 'other' }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const offset = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  return base + offset;
}

export const calculateTdee = (profile) =>
  calculateBmr(profile) * (ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? ACTIVITY_MULTIPLIERS.light);

/**
 * Suggested daily targets. Direction is inferred from target vs current weight
 * (gentle ~400 kcal deficit / ~300 kcal surplus). Users can override every value.
 */
export function suggestGoals({ currentWeightKg, targetWeightKg, heightCm, age, gender, activityLevel }) {
  const tdee = calculateTdee({ weightKg: currentWeightKg, heightCm, age, gender, activityLevel });
  const diff = (targetWeightKg ?? currentWeightKg) - currentWeightKg;
  const adjustment = diff < -0.5 ? -400 : diff > 0.5 ? 300 : 0;
  const calories = Math.max(1200, roundTo(tdee + adjustment, 10));

  const protein = Math.min(Math.round(1.6 * currentWeightKg), Math.round((calories * 0.3) / 4));
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const waterMl = Math.min(4000, Math.max(1500, roundTo(currentWeightKg * 35, 50)));

  return { calories, protein, carbs, fat, waterMl };
}

export const percentOf = (value, goal) => (goal > 0 ? Math.round((value / goal) * 1000) / 10 : 0);
