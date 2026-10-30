import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, enumerateDates, isValidDateString, monthRange } from '../src/utils/dates.js';
import { calculateBmr, gramsFor, percentOf, scaleNutrition, suggestGoals, sumNutrition } from '../src/utils/nutrition.js';

const idli = { caloriesPer100g: 142, proteinPer100g: 4.5, carbsPer100g: 30, fatPer100g: 0.4, servingGrams: 40 };

test('serving quantity scales nutrition correctly', () => {
  assert.equal(gramsFor(idli, 3, 'serving'), 120);
  assert.deepEqual(scaleNutrition(idli, 120), { calories: 170.4, protein: 5.4, carbs: 36, fat: 0.5 });
});

test('gram quantity is used directly', () => {
  assert.equal(gramsFor(idli, 250, 'g'), 250);
  assert.equal(scaleNutrition(idli, 100).calories, 142);
});

test('sumNutrition adds items without floating-point drift', () => {
  const t = sumNutrition([{ calories: 0.1, protein: 0.2 }, { calories: 0.2, protein: 0.1 }, {}]);
  assert.equal(t.calories, 0.3);
  assert.equal(t.protein, 0.3);
  assert.deepEqual(sumNutrition([]), { calories: 0, protein: 0, carbs: 0, fat: 0 });
});

test('Mifflin-St Jeor BMR', () => {
  // 10*70 + 6.25*175 - 5*30 = 1643.75
  assert.equal(calculateBmr({ weightKg: 70, heightCm: 175, age: 30, gender: 'male' }), 1648.75);
  assert.equal(calculateBmr({ weightKg: 70, heightCm: 175, age: 30, gender: 'female' }), 1482.75);
});

test('suggested goals: deficit for weight loss, macros are consistent with calories', () => {
  const base = { currentWeightKg: 70, heightCm: 175, age: 30, gender: 'male', activityLevel: 'moderate' };
  const maintain = suggestGoals({ ...base, targetWeightKg: 70 });
  const lose = suggestGoals({ ...base, targetWeightKg: 65 });
  const gain = suggestGoals({ ...base, targetWeightKg: 75 });
  assert.ok(lose.calories < maintain.calories && maintain.calories < gain.calories);
  const macroKcal = lose.protein * 4 + lose.carbs * 4 + lose.fat * 9;
  assert.ok(Math.abs(macroKcal - lose.calories) <= 20, `macros ${macroKcal} vs ${lose.calories}`);
  assert.ok(lose.calories >= 1200);
});

test('percentOf guards against zero goals', () => {
  assert.equal(percentOf(500, 2000), 25);
  assert.equal(percentOf(500, 0), 0);
});

test('date helpers are timezone-independent', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(addDays('2025-01-01', -1), '2024-12-31');
  assert.equal(enumerateDates('2025-01-30', '2025-02-02').length, 4);
  assert.deepEqual(monthRange('2024-02'), { from: '2024-02-01', to: '2024-02-29' });
  assert.ok(!isValidDateString('2025-02-30'));
  assert.ok(!isValidDateString('2025-2-3'));
});
