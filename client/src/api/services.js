import { api } from './client';

const data = (p) => p.then((r) => r.data.data);

export const authApi = {
  register: (body) => data(api.post('/auth/register', body)),
  login: (body) => data(api.post('/auth/login', body)),
  logout: () => api.post('/auth/logout'),
  me: () => data(api.get('/auth/me')),
};
export const userApi = {
  updateProfile: (body) => data(api.put('/users/profile', body)),
  getGoals: () => data(api.get('/users/goals')),
  updateGoals: (body) => data(api.put('/users/goals', body)),
  suggestedGoals: () => data(api.get('/users/goals/suggested')),
};
export const foodApi = {
  list: (params) => api.get('/foods', { params }).then((r) => r.data),
  get: (id) => data(api.get(`/foods/${id}`)),
};
export const mealApi = {
  list: (date) => data(api.get('/meals', { params: { date } })),
  create: (body) => data(api.post('/meals', body)),
  update: (id, body) => data(api.put(`/meals/${id}`, body)),
  remove: (id) => api.delete(`/meals/${id}`),
};
export const analyticsApi = {
  daily: (date) => data(api.get('/analytics/daily', { params: { date } })),
  weekly: (end) => data(api.get('/analytics/weekly', { params: { end } })),
  monthly: (month) => data(api.get('/analytics/monthly', { params: { month } })),
};
export const waterApi = {
  add: (date, amountMl) => data(api.post('/water', { date, amountMl })),
  set: (date, amountMl) => data(api.put('/water', { date, amountMl })),
};
