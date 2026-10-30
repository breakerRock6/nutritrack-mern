import { z } from 'zod';
import { ACTIVITY_LEVELS } from '../utils/nutrition.js';
import { FOOD_CATEGORIES } from '../models/Food.js';
import { MEAL_TYPES } from '../models/Meal.js';
import { isValidDateString, isValidMonthString } from '../utils/dates.js';

const dateStr = z.string().refine(isValidDateString, 'Date must be a valid YYYY-MM-DD');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const num = (min, max) => z.number({ invalid_type_error: 'Must be a number' }).min(min).max(max);
const activity = z.enum(ACTIVITY_LEVELS);

export const idParams = z.object({ id: objectId });
export const dateQuery = z.object({ date: dateStr.optional() });

export const registerBody = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password needs a letter')
    .regex(/\d/, 'Password needs a number'),
  age: num(13, 120).int(),
  gender: z.enum(['male', 'female', 'other']).default('other'),
  heightCm: num(80, 250),
  currentWeightKg: num(25, 400),
  targetWeightKg: num(25, 400).optional(),
  activityLevel: activity.default('light'),
});

export const loginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const profileBody = z
  .object({
    name: z.string().trim().min(2).max(60),
    age: num(13, 120).int(),
    gender: z.enum(['male', 'female', 'other']),
    heightCm: num(80, 250),
    currentWeightKg: num(25, 400),
    targetWeightKg: num(25, 400),
    activityLevel: activity,
    recalculateGoals: z.boolean(),
  })
  .partial()
  .strict();

export const goalsBody = z
  .object({
    calories: num(800, 6000),
    protein: num(0, 500),
    carbs: num(0, 900),
    fat: num(0, 300),
    waterMl: num(500, 10000),
    currentWeightKg: num(25, 400),
    targetWeightKg: num(25, 400),
    activityLevel: activity,
  })
  .partial()
  .strict();

export const foodQuery = z.object({
  search: z.string().trim().max(60).optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

const mealItem = z
  .object({
    foodId: objectId,
    quantity: z.number().positive().max(10000),
    unit: z.enum(['serving', 'g']).default('serving'),
  })
  .refine((i) => i.unit !== 'serving' || i.quantity <= 50, {
    message: 'Quantity too large (max 50 servings)',
    path: ['quantity'],
  });

const mealFields = z.object({
  date: dateStr,
  mealType: z.enum(MEAL_TYPES),
  items: z.array(mealItem).min(1).max(30),
});
export const mealCreateBody = mealFields.strict();
export const mealUpdateBody = mealFields
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update');
export const mealListQuery = z.object({ date: dateStr });

export const waterAddBody = z.object({ date: dateStr.optional(), amountMl: num(1, 5000) });
export const waterSetBody = z.object({ date: dateStr.optional(), amountMl: num(0, 20000) });

export const weeklyQuery = z.object({ end: dateStr.optional() });
export const monthlyQuery = z.object({
  month: z.string().refine(isValidMonthString, 'Month must be YYYY-MM').optional(),
});
