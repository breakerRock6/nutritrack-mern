import { WaterIntake } from '../models/WaterIntake.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { todayString } from '../utils/dates.js';
import { percentOf } from '../utils/nutrition.js';

const payload = (user, date, amountMl) => ({
  date,
  amountMl,
  goalMl: user.goals.waterMl,
  percent: percentOf(amountMl, user.goals.waterMl),
});

export const getWater = asyncHandler(async (req, res) => {
  const date = req.valid.query.date || todayString();
  const doc = await WaterIntake.findOne({ user: req.user._id, date });
  res.json({ success: true, data: payload(req.user, date, doc?.amountMl ?? 0) });
});

// POST adds an increment (e.g. +250 ml). Atomic upsert, so double-taps don't lose updates.
export const addWater = asyncHandler(async (req, res) => {
  const { amountMl } = req.valid.body;
  const date = req.valid.body.date || todayString();
  const doc = await WaterIntake.findOneAndUpdate(
    { user: req.user._id, date },
    { $inc: { amountMl } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json({ success: true, data: payload(req.user, date, doc.amountMl) });
});

// PUT sets the absolute amount for the day (corrections / reset).
export const setWater = asyncHandler(async (req, res) => {
  const { amountMl } = req.valid.body;
  const date = req.valid.body.date || todayString();
  const doc = await WaterIntake.findOneAndUpdate(
    { user: req.user._id, date },
    { $set: { amountMl } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.json({ success: true, data: payload(req.user, date, doc.amountMl) });
});
