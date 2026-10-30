import { env } from '../config/env.js';
import { localFoodProvider } from './localFoodProvider.js';

const registry = { local: localFoodProvider };

// Falls back to the seeded local catalogue if a provider is unknown or not configured.
export const foodProvider = registry[env.foodProvider] || localFoodProvider;
