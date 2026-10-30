import { Router } from 'express';
import { getFood, listFoods } from '../controllers/foodController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { foodQuery, idParams } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/', validate({ query: foodQuery }), listFoods);
r.get('/:id', validate({ params: idParams }), getFood);
export default r;
