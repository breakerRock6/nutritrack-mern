import { Food } from '../models/Food.js';
import { ApiError } from '../utils/ApiError.js';
import { gramsFor, scaleNutrition } from '../utils/nutrition.js';

/**
 * Turns [{foodId, quantity, unit}] into nutrition-snapshot items.
 * Clients never send nutrition values; the server is the single source of truth.
 */
export async function buildMealItems(inputItems) {
  const ids = [...new Set(inputItems.map((i) => i.foodId))];
  const foods = await Food.find({ _id: { $in: ids } }).lean();
  const byId = new Map(foods.map((f) => [String(f._id), f]));

  return inputItems.map(({ foodId, quantity, unit }) => {
    const food = byId.get(foodId);
    if (!food) throw new ApiError(400, `Food item not found: ${foodId}`);
    const grams = gramsFor(food, quantity, unit);
    return {
      food: food._id,
      name: food.name,
      category: food.category,
      quantity,
      unit,
      grams: Math.round(grams * 10) / 10,
      servingLabel: food.servingLabel,
      ...scaleNutrition(food, grams),
    };
  });
}
