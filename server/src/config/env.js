import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_tracker',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  foodProvider: process.env.FOOD_PROVIDER || 'local',
};

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set a long random value.');
}
if (env.isProd && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}
