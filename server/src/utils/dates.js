// All dates in this app are calendar-day strings ("YYYY-MM-DD"). They are never converted
// through local time zones, which removes an entire class of off-by-one-day bugs.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const isValidMonthString = (s) =>
  typeof s === 'string' && MONTH_RE.test(s) && Number(s.slice(5)) >= 1 && Number(s.slice(5)) <= 12;

const fmt = (dt) => dt.toISOString().slice(0, 10);
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// Fallback only; clients should always send the user's local date explicitly.
export const todayString = () => fmt(new Date());

export function addDays(dateStr, n) {
  const dt = parse(dateStr);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

export function enumerateDates(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}
