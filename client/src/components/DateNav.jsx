import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatLong, todayLocal } from '../utils/format';

export default function DateNav({ date, onChange, step = 1, label }) {
  const today = todayLocal();
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(addDays(date, -step))} aria-label="Previous" className="btn-ghost !px-2.5"><ChevronLeft size={18} /></button>
      <label className="relative">
        <span className="sr-only">Choose date</span>
        <input type="date" value={date} max={today} onChange={(e) => e.target.value && onChange(e.target.value)}
          className="input !w-auto min-w-[10.5rem] cursor-pointer font-semibold" />
      </label>
      <button onClick={() => onChange(addDays(date, step))} disabled={date >= today}
        aria-label="Next" className="btn-ghost !px-2.5"><ChevronRight size={18} /></button>
      {date !== today && <button onClick={() => onChange(today)} className="btn-ghost">Today</button>}
      <span className="ml-1 hidden text-sm text-ink-soft sm:inline">{label || formatLong(date)}</span>
    </div>
  );
}
