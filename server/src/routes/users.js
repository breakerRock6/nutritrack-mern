import { Router } from 'express';
import { getGoals, getProfile, getSuggestedGoals, updateGoals, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { goalsBody, profileBody } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/profile', getProfile);
r.put('/profile', validate({ body: profileBody }), updateProfile);
r.get('/goals', getGoals);
r.get('/goals/suggested', getSuggestedGoals);
r.put('/goals', validate({ body: goalsBody }), updateGoals);
export default r;
