import { Food } from '../models/Food.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Provider contract: search({search, category, page, limit}) -> { items, total }; getById(id) -> food | null.
// To add an external API (USDA FoodData Central, Nutritionix, Edamam...), create another provider with
// the same two methods that maps results to this Food shape, and register it in providers/index.js.
export const localFoodProvider = {
  name: 'local',
  async search({ search, category, page, limit }) {
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
    const [items, total] = await Promise.all([
      Food.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Food.countDocuments(filter),
    ]);
    return { items, total };
  },
  getById: (id) => Food.findById(id).lean(),
};
