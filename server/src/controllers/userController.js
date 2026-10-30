import { asyncHandler } from '../utils/asyncHandler.js';
import { suggestGoals } from '../utils/nutrition.js';

const PROFILE_FIELDS = ['name', 'age', 'gender', 'heightCm', 'currentWeightKg', 'targetWeightKg', 'activityLevel'];
const GOAL_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'waterMl'];

export const getProfile = (req, res) => res.json({ success: true, data: { user: req.user } });

export const updateProfile = asyncHandler(async (req, res) => {
  const { recalculateGoals, ...fields } = req.valid.body;
  for (const k of PROFILE_FIELDS) if (fields[k] !== undefined) req.user[k] = fields[k];
  if (recalculateGoals) req.user.goals = suggestGoals(req.user);
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

const goalsPayload = (user) => ({
  goals: user.goals,
  currentWeightKg: user.currentWeightKg,
  targetWeightKg: user.targetWeightKg,
  activityLevel: user.activityLevel,
});

export const getGoals = (req, res) => res.json({ success: true, data: goalsPayload(req.user) });

export const updateGoals = asyncHandler(async (req, res) => {
  const body = req.valid.body;
  for (const k of GOAL_FIELDS) if (body[k] !== undefined) req.user.goals[k] = body[k];
  for (const k of ['currentWeightKg', 'targetWeightKg', 'activityLevel']) if (body[k] !== undefined) req.user[k] = body[k];
  await req.user.save();
  res.json({ success: true, data: goalsPayload(req.user) });
});

// Calculated estimate for the Goals page "Use suggested targets" button. Not medical advice.
export const getSuggestedGoals = (req, res) =>
  res.json({
    success: true,
    data: {
      goals: suggestGoals(req.user),
      disclaimer: 'Estimates from the Mifflin-St Jeor equation and activity level. Not medical advice.',
    },
  });
