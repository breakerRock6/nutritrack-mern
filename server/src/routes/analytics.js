import { Router } from 'express';
import { daily, monthly, weekly } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { dateQuery, monthlyQuery, weeklyQuery } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/daily', validate({ query: dateQuery }), daily);
r.get('/weekly', validate({ query: weeklyQuery }), weekly);
r.get('/monthly', validate({ query: monthlyQuery }), monthly);
export default r;
