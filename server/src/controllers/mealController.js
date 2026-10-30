import { Meal } from '../models/Meal.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sumNutrition } from '../utils/nutrition.js';
import { buildMealItems } from '../services/mealService.js';

// Ownership is enforced by ALWAYS including `user` in the query. Another user's id yields 404, not 403,
// so the API doesn't confirm that someone else's record exists.
const findOwned = async (req) => {
  const meal = await Meal.findOne({ _id: req.valid.params.id, user: req.user._id });
  if (!meal) throw new ApiError(404, 'Meal not found');
  return meal;
};

export const listMeals = asyncHandler(async (req, res) => {
  const { date } = req.valid.query;
  const meals = await Meal.find({ user: req.user._id, date }).sort({ createdAt: 1 });
  res.json({ success: true, data: { date, meals, totals: sumNutrition(meals.map((m) => m.totals)) } });
});

export const createMeal = asyncHandler(async (req, res) => {
  const { date, mealType, items } = req.valid.body;
  const built = await buildMealItems(items);
  const meal = await Meal.create({ user: req.user._id, date, mealType, items: built, totals: sumNutrition(built) });
  res.status(201).json({ success: true, data: { meal } });
});

export const updateMeal = asyncHandler(async (req, res) => {
  const meal = await findOwned(req);
  const { date, mealType, items } = req.valid.body;
  if (date) meal.date = date;
  if (mealType) meal.mealType = mealType;
  if (items) {
    meal.items = await buildMealItems(items);
    meal.totals = sumNutrition(meal.items);
  }
  await meal.save();
  res.json({ success: true, data: { meal } });
});

export const deleteMeal = asyncHandler(async (req, res) => {
  const meal = await findOwned(req);
  await meal.deleteOne();
  res.json({ success: true, message: 'Meal deleted' });
});
