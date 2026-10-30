import mongoose from 'mongoose';

export const FOOD_CATEGORIES = [
  'Fruits', 'Vegetables', 'Grains', 'Protein', 'Dairy', 'Nuts & Seeds', 'Indian Dishes', 'Other',
];

// Values are per 100 g. "servingGrams" defines one standard serving (e.g. 1 idli = 40 g).
// Sample values are estimates compiled from common public nutrition references.
const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: FOOD_CATEGORIES, index: true },
    caloriesPer100g: { type: Number, required: true, min: 0, max: 900 },
    proteinPer100g: { type: Number, required: true, min: 0, max: 100 },
    carbsPer100g: { type: Number, required: true, min: 0, max: 100 },
    fatPer100g: { type: Number, required: true, min: 0, max: 100 },
    servingGrams: { type: Number, required: true, min: 1, max: 1000 },
    servingUnit: { type: String, required: true, trim: true }, // piece, cup, slice, tbsp, katori...
    servingLabel: { type: String, required: true, trim: true }, // "1 medium idli (40 g)"
    source: { type: String, default: 'seed' },
  },
  { timestamps: true }
);


export const Food = mongoose.model('Food', foodSchema);
