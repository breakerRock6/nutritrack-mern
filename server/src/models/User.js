import mongoose from 'mongoose';
import { ACTIVITY_LEVELS } from '../utils/nutrition.js';

const goalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, required: true, min: 800, max: 6000 },
    protein: { type: Number, required: true, min: 0, max: 500 },
    carbs: { type: Number, required: true, min: 0, max: 900 },
    fat: { type: Number, required: true, min: 0, max: 300 },
    waterMl: { type: Number, required: true, min: 500, max: 10000 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    age: { type: Number, required: true, min: 13, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    heightCm: { type: Number, required: true, min: 80, max: 250 },
    currentWeightKg: { type: Number, required: true, min: 25, max: 400 },
    targetWeightKg: { type: Number, required: true, min: 25, max: 400 },
    activityLevel: { type: String, enum: ACTIVITY_LEVELS, default: 'light' },
    goals: { type: goalsSchema, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model('User', userSchema);
