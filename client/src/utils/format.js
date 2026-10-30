// Dates are plain "YYYY-MM-DD" strings end to end. "Today" is the USER's local day, not UTC.
const pad = (n) => String(n).padStart(2, '0');

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const toDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
};
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(s, n) {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}
export const formatLong = (s) =>
  toDate(s).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
export const formatShort = (s) => toDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const formatWeekday = (s) => toDate(s).toLocaleDateString(undefined, { weekday: 'short' });
export const currentMonth = () => todayLocal().slice(0, 7);
export function addMonths(m, n) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
export const formatMonth = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export const num = (n, digits = 0) =>
  Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: digits });

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', hint: 'Start of the day' },
  { value: 'lunch', label: 'Lunch', hint: 'Midday meal' },
  { value: 'dinner', label: 'Dinner', hint: 'Evening meal' },
  { value: 'snack', label: 'Snacks', hint: 'Between meals' },
];
export const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary: desk job, little exercise' },
  { value: 'light', label: 'Light: exercise 1–3 days a week' },
  { value: 'moderate', label: 'Moderate: exercise 3–5 days a week' },
  { value: 'active', label: 'Active: hard exercise 6–7 days a week' },
  { value: 'very_active', label: 'Very active: physical job or training twice a day' },
];
export const FOOD_CATEGORIES = ['Fruits', 'Vegetables', 'Grains', 'Protein', 'Dairy', 'Nuts & Seeds', 'Indian Dishes', 'Other'];
export const MACRO_COLORS = { protein: '#3B7DD8', carbs: '#E0A21B', fat: '#E0694A' };
