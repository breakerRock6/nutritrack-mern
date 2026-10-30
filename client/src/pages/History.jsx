import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi } from '../api/services';
import { MacroBar, chartTooltipStyle } from '../components/charts';
import DateNav from '../components/DateNav';
import MealList from '../components/MealList';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { MACRO_COLORS, addMonths, currentMonth, formatMonth, formatShort, formatWeekday, num, todayLocal } from '../utils/format';
import { Link } from 'react-router-dom';

const TABS = [{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }];

const Stat = ({ label, value, unit }) => (
  <div className="card p-4">
    <p className="text-sm text-ink-soft">{label}</p>
    <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}{unit && <span className="ml-1 text-sm font-medium text-ink-faint">{unit}</span>}</p>
  </div>
);

function Loading() { return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>; }

function NoData() {
  return (
    <div className="card"><EmptyState icon={CalendarDays} title="No meals logged in this period"
      text="Once you log meals, your calories and macros will chart here."
      action={<Link to="/log" className="btn-primary">Log a meal</Link>} /></div>
  );
}

function SummaryStats({ s }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Days logged" value={s.daysLogged} />
      <Stat label="Average calories" value={num(s.avgCalories)} unit="kcal" />
      <Stat label="Days within 10% of target" value={s.daysOnTarget} />
      <Stat label="Average protein" value={num(s.avgProtein, 1)} unit="g" />
    </div>
  );
}

function DayView() {
  const [date, setDate] = useState(todayLocal());
  const { data, loading, error, reload } = useFetch(() => analyticsApi.daily(date), [date]);
  return (
    <>
      <div className="mb-5"><DateNav date={date} onChange={setDate} /></div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Loading /> : data.mealsLogged === 0 ? <NoData /> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="card space-y-5 self-start p-6">
            <div>
              <p className="text-sm text-ink-soft">Calories versus target</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">{num(data.consumed.calories)} <span className="text-base font-medium text-ink-soft">/ {num(data.goals.calories)} kcal</span></p>
              <p className={`mt-1 text-sm font-semibold ${data.remaining.calories < 0 ? 'text-fat' : 'text-leaf-700'}`}>
                {data.remaining.calories < 0 ? `${num(-data.remaining.calories)} kcal over target` : `${num(data.remaining.calories)} kcal remaining`}</p>
            </div>
            <MacroBar label="Protein" value={data.consumed.protein} goal={data.goals.protein} color={MACRO_COLORS.protein} />
            <MacroBar label="Carbohydrates" value={data.consumed.carbs} goal={data.goals.carbs} color={MACRO_COLORS.carbs} />
            <MacroBar label="Fat" value={data.consumed.fat} goal={data.goals.fat} color={MACRO_COLORS.fat} />
            <p className="text-sm text-ink-soft">Water: <b className="text-ink">{num(data.water.amountMl)}</b> / {num(data.water.goalMl)} ml</p>
          </section>
          <MealList meals={Object.values(data.byType).flatMap((g) => g.meals)} />
        </div>
      )}
    </>
  );
}

function WeekView() {
  const [end, setEnd] = useState(todayLocal());
  const { data, loading, error, reload } = useFetch(() => analyticsApi.weekly(end), [end]);
  const rows = data?.days.map((d) => ({ ...d, name: `${formatWeekday(d.date)} ${formatShort(d.date).split(' ')[1] || ''}`.trim() }));
  return (
    <>
      <div className="mb-5"><DateNav date={end} onChange={setEnd} step={7} label={data ? `${formatShort(data.from)} to ${formatShort(data.to)}` : ''} /></div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Loading /> : data.summary.daysLogged === 0 ? <NoData /> : (
        <div className="space-y-5">
          <SummaryStats s={data.summary} />
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Calories per day</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3E8E2" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#EDF8F1' }} formatter={(v) => [`${num(v)} kcal`, 'Calories']} />
                  <Legend verticalAlign="top" align="right" height={28} />
                  <ReferenceLine y={data.goals.calories} stroke="#E0694A" strokeDasharray="5 4" />
                  <Bar dataKey="calories" name="Calories (dashed line = target)" fill="#1E8A4C" radius={[8, 8, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Macronutrients per day (grams)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3E8E2" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [`${num(v, 1)} g`, n]} />
                  <Legend verticalAlign="top" align="right" height={28} />
                  <Bar dataKey="protein" name="Protein" stackId="m" fill={MACRO_COLORS.protein} />
                  <Bar dataKey="carbs" name="Carbs" stackId="m" fill={MACRO_COLORS.carbs} />
                  <Bar dataKey="fat" name="Fat" stackId="m" fill={MACRO_COLORS.fat} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function MonthView() {
  const [month, setMonth] = useState(currentMonth());
  const { data, loading, error, reload } = useFetch(() => analyticsApi.monthly(month), [month]);
  const rows = data?.days.map((d) => ({ ...d, day: Number(d.date.slice(8)), target: data.goals.calories, calories: d.calories || null }));
  return (
    <>
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month" className="btn-ghost !px-2.5"><ChevronLeft size={18} /></button>
        <span className="min-w-[10rem] text-center font-display text-lg font-bold">{formatMonth(month)}</span>
        <button onClick={() => setMonth(addMonths(month, 1))} disabled={month >= currentMonth()} aria-label="Next month" className="btn-ghost !px-2.5"><ChevronRight size={18} /></button>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Loading /> : data.summary.daysLogged === 0 ? <NoData /> : (
        <div className="space-y-5">
          <SummaryStats s={data.summary} />
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Daily calories versus target</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3E8E2" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [`${num(v)} kcal`, n]} labelFormatter={(d) => `${formatMonth(month).split(' ')[0]} ${d}`} />
                  <Legend verticalAlign="top" align="right" height={28} />
                  <Line type="monotone" dataKey="calories" name="Calories" stroke="#1E8A4C" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="target" name="Target" stroke="#E0694A" strokeDasharray="5 4" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Average calories by week</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeks} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3E8E2" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${num(v)} kcal`, 'Average']} />
                  <ReferenceLine y={data.goals.calories} stroke="#E0694A" strokeDasharray="5 4" />
                  <Bar dataKey="avgCalories" name="Average calories" fill="#27A35D" radius={[8, 8, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default function History() {
  const [tab, setTab] = useState('day');
  return (
    <>
      <PageHeader title="History and trends" subtitle="Review past days and see how your intake compares with your targets." />
      <div className="mb-6 inline-flex rounded-xl bg-white p-1 shadow-card ring-1 ring-line" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition ${tab === t.id ? 'bg-leaf-600 text-white' : 'text-ink-soft hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'day' ? <DayView /> : tab === 'week' ? <WeekView /> : <MonthView />}
    </>
  );
}
