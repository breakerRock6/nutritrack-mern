import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody } from '../validators/schemas.js';

const r = Router();
r.post('/register', validate({ body: registerBody }), register);
r.post('/login', validate({ body: loginBody }), login);
r.post('/logout', logout);
r.get('/me', protect, me);
export default r;
