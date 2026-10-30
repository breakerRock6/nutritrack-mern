import { num } from '../utils/format';

/** Calorie ring: the dashboard's focal element. Over-target turns coral. */
export function ProgressRing({ value, goal, size = 220, stroke = 18, label = 'kcal left', children }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img"
      aria-label={`${num(value)} of ${num(goal)} calories consumed`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3E8E2" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={over ? '#E0694A' : '#1E8A4C'} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="ring-draw" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children || (
          <>
            <span className="font-display text-5xl font-extrabold tabular-nums">{num(Math.abs(goal - value))}</span>
            <span className="mt-0.5 text-sm font-medium text-ink-soft">{over ? 'kcal over' : label}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function MacroBar({ label, value, goal, color, unit = 'g' }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-ink-soft"><b className="text-ink">{num(value, 1)}</b> / {num(goal)}{unit}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={label}
        aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export const chartTooltipStyle = {
  borderRadius: 12, border: '1px solid #E3E8E2', boxShadow: '0 8px 30px -10px rgba(20,33,26,.22)', fontSize: 13,
};
