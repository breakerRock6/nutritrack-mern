import { foodProvider } from '../providers/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listFoods = asyncHandler(async (req, res) => {
  const { page, limit } = req.valid.query;
  const { items, total } = await foodProvider.search(req.valid.query);
  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getFood = asyncHandler(async (req, res) => {
  const food = await foodProvider.getById(req.valid.params.id);
  if (!food) throw new ApiError(404, 'Food not found');
  res.json({ success: true, data: food });
});
