import mongoose from 'mongoose';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const nutrition = { type: Number, required: true, min: 0 };

// Each item is a SNAPSHOT: name and nutrient values are copied at log time so history
// stays accurate even if the catalogue entry is edited or removed later.
const itemSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  name: { type: String, required: true },
  category: String,
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['serving', 'g'], default: 'serving' },
  grams: { type: Number, required: true, min: 0 },
  servingLabel: String,
  calories: nutrition,
  protein: nutrition,
  carbs: nutrition,
  fat: nutrition,
});

const mealSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    mealType: { type: String, enum: MEAL_TYPES, required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    totals: {
      calories: nutrition,
      protein: nutrition,
      carbs: nutrition,
      fat: nutrition,
    },
  },
  { timestamps: true }
);

mealSchema.index({ user: 1, date: 1, mealType: 1 });

export const Meal = mongoose.model('Meal', mealSchema);
