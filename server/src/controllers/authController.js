import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { suggestGoals } from '../utils/nutrition.js';
import { COOKIE_NAME, cookieOptions, setAuthCookie } from '../middleware/auth.js';

const ROUNDS = 12;
// Compared against when the email is unknown, so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', ROUNDS);

export const register = asyncHandler(async (req, res) => {
  const { password, ...profile } = req.valid.body;
  if (await User.exists({ email: profile.email })) throw new ApiError(409, 'An account with this email already exists');

  profile.targetWeightKg ??= profile.currentWeightKg;
  const user = await User.create({
    ...profile,
    passwordHash: await bcrypt.hash(password, ROUNDS),
    goals: suggestGoals(profile),
  });
  setAuthCookie(res, user._id);
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Invalid email or password');
  setAuthCookie(res, user._id);
  res.json({ success: true, data: { user } });
});

export const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ success: true, message: 'Logged out' });
};

export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
