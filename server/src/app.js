import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/foods.js';
import mealRoutes from './routes/meals.js';
import userRoutes from './routes/users.js';
import waterRoutes from './routes/water.js';

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs, limit, standardHeaders: true, legacyHeaders: false,
    skip: () => env.isTest,
    message: { success: false, message },
  });

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IPs behind Render/Railway/Heroku proxies
  app.use(helmet());
  app.use(cors({ origin: env.clientUrls, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

  app.use('/api', limiter(15 * 60 * 1000, 500, 'Too many requests, please slow down.'));
  app.use('/api/auth/login', limiter(15 * 60 * 1000, 10, 'Too many login attempts. Try again in 15 minutes.'));
  app.use('/api/auth/register', limiter(60 * 60 * 1000, 20, 'Too many sign-ups from this IP. Try again later.'));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/meals', mealRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/water', waterRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
