import { Meal, MEAL_TYPES } from '../models/Meal.js';
import { WaterIntake } from '../models/WaterIntake.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDays, enumerateDates, monthRange, todayString } from '../utils/dates.js';
import { percentOf, round1, sumNutrition } from '../utils/nutrition.js';

// One row per calendar day in [from, to], zero-filled so charts never have gaps.
async function dailySeries(userId, from, to) {
  const [meals, water] = await Promise.all([
    Meal.aggregate([
      { $match: { user: userId, date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$date',
          calories: { $sum: '$totals.calories' },
          protein: { $sum: '$totals.protein' },
          carbs: { $sum: '$totals.carbs' },
          fat: { $sum: '$totals.fat' },
          entries: { $sum: { $size: '$items' } },
        },
      },
    ]),
    WaterIntake.find({ user: userId, date: { $gte: from, $lte: to } }).lean(),
  ]);
  const m = new Map(meals.map((r) => [r._id, r]));
  const w = new Map(water.map((r) => [r.date, r.amountMl]));
  return enumerateDates(from, to).map((date) => {
    const r = m.get(date);
    return {
      date,
      calories: round1(r?.calories || 0),
      protein: round1(r?.protein || 0),
      carbs: round1(r?.carbs || 0),
      fat: round1(r?.fat || 0),
      entries: r?.entries || 0,
      waterMl: w.get(date) || 0,
    };
  });
}

function summarize(series, goals) {
  const logged = series.filter((d) => d.calories > 0);
  const n = logged.length || 1;
  const avg = (k) => round1(logged.reduce((s, d) => s + d[k], 0) / n);
  return {
    daysLogged: logged.length,
    avgCalories: logged.length ? avg('calories') : 0,
    avgProtein: logged.length ? avg('protein') : 0,
    avgCarbs: logged.length ? avg('carbs') : 0,
    avgFat: logged.length ? avg('fat') : 0,
    // "On target" = within ±10% of the calorie goal
    daysOnTarget: logged.filter((d) => Math.abs(d.calories - goals.calories) <= goals.calories * 0.1).length,
  };
}

export const daily = asyncHandler(async (req, res) => {
  const date = req.valid.query.date || todayString();
  const { goals } = req.user;
  const [meals, water] = await Promise.all([
    Meal.find({ user: req.user._id, date }).sort({ createdAt: 1 }).lean(),
    WaterIntake.findOne({ user: req.user._id, date }).lean(),
  ]);

  const consumed = sumNutrition(meals.map((m) => m.totals));
  const byType = Object.fromEntries(
    MEAL_TYPES.map((t) => {
      const list = meals.filter((m) => m.mealType === t);
      return [t, { meals: list, totals: sumNutrition(list.map((m) => m.totals)) }];
    })
  );
  const waterMl = water?.amountMl ?? 0;

  res.json({
    success: true,
    data: {
      date,
      goals,
      consumed,
      // Remaining Calories = Daily Calorie Target − Calories Consumed (negative means over target)
      remaining: {
        calories: round1(goals.calories - consumed.calories),
        protein: round1(goals.protein - consumed.protein),
        carbs: round1(goals.carbs - consumed.carbs),
        fat: round1(goals.fat - consumed.fat),
      },
      progress: {
        calories: percentOf(consumed.calories, goals.calories),
        protein: percentOf(consumed.protein, goals.protein),
        carbs: percentOf(consumed.carbs, goals.carbs),
        fat: percentOf(consumed.fat, goals.fat),
      },
      mealsLogged: meals.length,
      entriesLogged: meals.reduce((s, m) => s + m.items.length, 0),
      byType,
      recentMeals: [...meals].reverse().slice(0, 5),
      water: { amountMl: waterMl, goalMl: goals.waterMl, percent: percentOf(waterMl, goals.waterMl) },
    },
  });
});

export const weekly = asyncHandler(async (req, res) => {
  const end = req.valid.query.end || todayString();
  const from = addDays(end, -6);
  const days = await dailySeries(req.user._id, from, end);
  const { goals } = req.user;
  res.json({
    success: true,
    data: { from, to: end, goals, days, summary: summarize(days, goals) },
  });
});

export const monthly = asyncHandler(async (req, res) => {
  const month = req.valid.query.month || todayString().slice(0, 7);
  const { from, to } = monthRange(month);
  const days = await dailySeries(req.user._id, from, to);
  const { goals } = req.user;

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const logged = chunk.filter((d) => d.calories > 0);
    weeks.push({
      label: `${chunk[0].date.slice(5)} – ${chunk.at(-1).date.slice(5)}`,
      avgCalories: logged.length ? round1(logged.reduce((s, d) => s + d.calories, 0) / logged.length) : 0,
      daysLogged: logged.length,
    });
  }
  res.json({ success: true, data: { month, from, to, goals, days, weeks, summary: summarize(days, goals) } });
});
