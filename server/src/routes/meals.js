import { Router } from 'express';
import { createMeal, deleteMeal, listMeals, updateMeal } from '../controllers/mealController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams, mealCreateBody, mealListQuery, mealUpdateBody } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/', validate({ query: mealListQuery }), listMeals);
r.post('/', validate({ body: mealCreateBody }), createMeal);
r.put('/:id', validate({ params: idParams, body: mealUpdateBody }), updateMeal);
r.delete('/:id', validate({ params: idParams }), deleteMeal);
export default r;
