// Usage:  npm run seed          -> upserts the food catalogue (idempotent)
//         npm run seed:demo     -> also creates demo@example.com with 14 days of sample meals
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Food } from '../models/Food.js';
import { Meal } from '../models/Meal.js';
import { User } from '../models/User.js';
import { WaterIntake } from '../models/WaterIntake.js';
import { buildMealItems } from '../services/mealService.js';
import { addDays, todayString } from '../utils/dates.js';
import { suggestGoals, sumNutrition } from '../utils/nutrition.js';
import { foods } from './foods.js';

const DEMO = { email: 'demo@example.com', password: 'Demo@1234' };

async function seedFoods() {
  await Food.bulkWrite(foods.map((f) => ({ updateOne: { filter: { name: f.name }, update: { $set: f }, upsert: true } })));
  console.log(`Seeded ${foods.length} foods`);
}

// Small deterministic PRNG so demo data looks the same on every run.
const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

async function seedDemo() {
  if (env.isProd) throw new Error('Refusing to create a demo user in production.');
  await Promise.all([User.deleteOne({ email: DEMO.email })]);
  const profile = {
    name: 'Demo User', email: DEMO.email, age: 29, gender: 'female', heightCm: 165,
    currentWeightKg: 68, targetWeightKg: 62, activityLevel: 'moderate',
  };
  const user = await User.create({
    ...profile, passwordHash: await bcrypt.hash(DEMO.password, 10), goals: suggestGoals(profile),
  });
  await Promise.all([Meal.deleteMany({ user: user._id }), WaterIntake.deleteMany({ user: user._id })]);

  const byName = Object.fromEntries((await Food.find().lean()).map((f) => [f.name, String(f._id)]));
  const plan = {
    breakfast: [['Idli', 3], ['Sambar', 1], ['Curd / Plain Yogurt', 0.5], ['Rolled Oats (dry)', 1], ['Banana', 1], ['Egg (boiled)', 2]],
    lunch: [['White Rice (cooked)', 1.5], ['Toor Dal (cooked, tadka)', 1], ['Chapati / Roti (whole wheat)', 2], ['Palak Paneer', 1], ['Chicken Breast (cooked)', 1]],
    dinner: [['Chapati / Roti (whole wheat)', 2], ['Rajma (cooked)', 1], ['Salmon (cooked)', 1], ['Broccoli (steamed)', 1], ['Plain Dosa', 2]],
    snack: [['Almonds', 1], ['Apple', 1], ['Buttermilk (Chaas)', 1], ['Peanut Butter', 1]],
  };
  const rand = rng(42);
  const today = todayString();
  let count = 0;
  for (let i = 0; i < 14; i++) {
    if (i > 0 && rand() < 0.1) continue; // occasional skipped day
    const date = addDays(today, -i);
    for (const [mealType, options] of Object.entries(plan)) {
      const picks = options.filter(() => rand() < 0.55).slice(0, 3);
      if (!picks.length) continue;
      const items = await buildMealItems(picks.map(([n, q]) => ({ foodId: byName[n], quantity: q, unit: 'serving' })));
      await Meal.create({ user: user._id, date, mealType, items, totals: sumNutrition(items) });
      count++;
    }
    await WaterIntake.create({ user: user._id, date, amountMl: 1250 + Math.round(rand() * 6) * 250 });
  }
  console.log(`Demo user ready: ${DEMO.email} / ${DEMO.password}  (${count} meals created)`);
}

try {
  await connectDB();
  await seedFoods();
  if (process.argv.includes('--demo')) await seedDemo();
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
