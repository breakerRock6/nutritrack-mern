import { Droplets, Flame, History as HistoryIcon, Plus, Target, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi, waterApi } from '../api/services';
import { errorMessage } from '../api/client';
import { MacroBar, ProgressRing, chartTooltipStyle } from '../components/charts';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { MACRO_COLORS, MEAL_TYPES, formatLong, formatWeekday, num, todayLocal } from '../utils/format';

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" />
      <Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = todayLocal();
  const { data, loading, error, reload, setData } = useFetch(
    () => Promise.all([analyticsApi.daily(today), analyticsApi.weekly(today)]), [today]);

  const addWater = async (ml) => {
    try {
      await waterApi.add(today, ml);
      const fresh = await analyticsApi.daily(today);
      setData(([, w]) => [fresh, w]);
      toast.success(`Added ${ml} ml of water`);
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(' ')[0]}`} subtitle={formatLong(today)}>
        <Link to="/log" className="btn-primary"><Plus size={18} /> Log a meal</Link>
      </PageHeader>

      {loading && !data ? <DashboardSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : (() => {
        const [day, week] = data;
        const { goals, consumed, remaining, water } = day;
        const weekRows = week.days.map((d) => ({ ...d, name: formatWeekday(d.date) }));
        const glasses = Math.max(1, Math.round(water.goalMl / 250));
        const filled = Math.min(glasses, Math.floor(water.amountMl / 250));

        return (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Calorie ring + stats */}
            <section className="card p-6 lg:col-span-2">
              <h2 className="mb-5 text-lg font-bold">Today’s calories</h2>
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
                <ProgressRing value={consumed.calories} goal={goals.calories} />
                <dl className="grid w-full max-w-xs grid-cols-1 gap-4">
                  {[['Daily target', goals.calories], ['Consumed', consumed.calories], ['Remaining', remaining.calories]].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between border-b border-line pb-3 last:border-0">
                      <dt className="text-sm text-ink-soft">{k}</dt>
                      <dd className={`font-display text-2xl font-bold tabular-nums ${k === 'Remaining' && v < 0 ? 'text-fat' : ''}`}>{num(v, 0)} <span className="text-sm font-medium text-ink-faint">kcal</span></dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {/* Macros */}
            <section className="card p-6">
              <h2 className="mb-5 text-lg font-bold">Macronutrients</h2>
              <div className="space-y-5">
                <MacroBar label="Protein" value={consumed.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
                <MacroBar label="Carbohydrates" value={consumed.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
                <MacroBar label="Fat" value={consumed.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-leaf-50 px-4 py-3">
                <UtensilsCrossed size={20} className="text-leaf-600" />
                <p className="text-sm"><b>{day.mealsLogged}</b> {day.mealsLogged === 1 ? 'meal' : 'meals'} logged, <b>{day.entriesLogged}</b> {day.entriesLogged === 1 ? 'food' : 'foods'}</p>
              </div>
            </section>

            {/* Weekly chart */}
            <section className="card p-6 lg:col-span-2">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-bold">Last 7 days</h2>
                <span className="text-sm text-ink-soft">Average {num(week.summary.avgCalories)} kcal on logged days</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekRows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E3E8E2" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#EDF8F1' }} formatter={(v) => [`${num(v)} kcal`, 'Calories']} labelFormatter={(_, p) => p?.[0]?.payload?.date || ''} />
                    <ReferenceLine y={goals.calories} stroke="#E0694A" strokeDasharray="5 4" label={{ value: 'Target', position: 'insideTopRight', fill: '#E0694A', fontSize: 12 }} />
                    <Bar dataKey="calories" name="Calories" fill="#1E8A4C" radius={[8, 8, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Water */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Water</h2>
                <Droplets className="text-water" size={20} />
              </div>
              <p className="font-display text-3xl font-extrabold tabular-nums">{num(water.amountMl)} <span className="text-base font-medium text-ink-soft">/ {num(water.goalMl)} ml</span></p>
              <div className="my-4 flex flex-wrap gap-1.5" aria-hidden="true">
                {Array.from({ length: glasses }, (_, i) => (
                  <span key={i} className={`h-7 w-5 rounded-b-lg rounded-t-sm border-2 ${i < filled ? 'border-water bg-water' : 'border-line bg-white'}`} />
                ))}
              </div>
              <div className="flex gap-2">
                {[250, 500].map((ml) => <button key={ml} onClick={() => addWater(ml)} className="btn-ghost flex-1 !px-2"><Plus size={14} /> {ml} ml</button>)}
              </div>
            </section>

            {/* Daily nutrition summary */}
            <section className="card overflow-x-auto p-6 lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold">Daily nutrition summary</h2>
              <table className="w-full min-w-[420px] text-sm tabular-nums">
                <thead><tr className="border-b border-line text-left text-ink-soft">
                  <th className="pb-2 font-semibold">Meal</th><th className="pb-2 text-right font-semibold">Calories</th>
                  <th className="pb-2 text-right font-semibold">Protein</th><th className="pb-2 text-right font-semibold">Carbs</th><th className="pb-2 text-right font-semibold">Fat</th>
                </tr></thead>
                <tbody>
                  {MEAL_TYPES.map(({ value, label }) => { const t = day.byType[value].totals; return (
                    <tr key={value} className="border-b border-line/60">
                      <td className="py-2.5 font-semibold">{label}</td><td className="text-right">{num(t.calories)}</td>
                      <td className="text-right">{num(t.protein, 1)} g</td><td className="text-right">{num(t.carbs, 1)} g</td><td className="text-right">{num(t.fat, 1)} g</td>
                    </tr>); })}
                  <tr className="font-bold"><td className="pt-3">Total</td><td className="pt-3 text-right">{num(consumed.calories)}</td>
                    <td className="pt-3 text-right">{num(consumed.protein, 1)} g</td><td className="pt-3 text-right">{num(consumed.carbs, 1)} g</td><td className="pt-3 text-right">{num(consumed.fat, 1)} g</td></tr>
                </tbody>
              </table>
            </section>

            {/* Quick actions */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-bold">Quick actions</h2>
              <div className="grid gap-2">
                <Link to="/log" className="btn-primary justify-start"><Plus size={18} /> Log a meal</Link>
                <Link to="/history" className="btn-ghost justify-start"><HistoryIcon size={18} /> View history</Link>
                <Link to="/goals" className="btn-ghost justify-start"><Target size={18} /> Update goals</Link>
              </div>
            </section>

            {/* Recent meals */}
            <section className="card p-6 lg:col-span-3">
              <h2 className="mb-2 text-lg font-bold">Recent meals</h2>
              {day.recentMeals.length === 0 ? (
                <EmptyState icon={Flame} title="Nothing logged today yet" text="Log your first meal and your calories, macros and charts will fill in."
                  action={<Link to="/log" className="btn-primary"><Plus size={18} /> Log a meal</Link>} />
              ) : (
                <ul className="divide-y divide-line">
                  {day.recentMeals.map((m) => (
                    <li key={m._id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold capitalize">{m.mealType}</p>
                        <p className="truncate text-sm text-ink-soft">{m.items.map((i) => i.name).join(', ')}</p>
                      </div>
                      <span className="shrink-0 font-display text-lg font-bold tabular-nums">{num(m.totals.calories)} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        );
      })()}
    </>
  );
}
