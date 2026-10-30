import { Router } from 'express';
import { addWater, getWater, setWater } from '../controllers/waterController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { dateQuery, waterAddBody, waterSetBody } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/', validate({ query: dateQuery }), getWater);
r.post('/', validate({ body: waterAddBody }), addWater);
r.put('/', validate({ body: waterSetBody }), setWater);
export default r;
