import { Check, Loader2, Minus, Plus, Search, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client';
import { foodApi, mealApi } from '../api/services';
import DateNav from '../components/DateNav';
import MealList from '../components/MealList';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { FOOD_CATEGORIES, MEAL_TYPES, num, todayLocal } from '../utils/format';
import { previewItem, previewTotals, snapshotToFood } from '../utils/nutrition';

const defaultMealType = () => { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 18.5 ? 'snack' : 'dinner'; };
const emptyDraft = () => ({ id: null, mealType: defaultMealType(), items: [] });

export default function LogMeal() {
  const [date, setDate] = useState(todayLocal());
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const draftRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const foods = useFetch(() => foodApi.list({ search: debounced || undefined, category: category || undefined, page, limit: 12 }), [debounced, category, page]);
  const logged = useFetch(() => mealApi.list(date), [date]);

  const addFood = (food) => {
    setDraft((d) => {
      const existing = d.items.find((i) => i.food._id === food._id && i.unit === 'serving');
      if (existing) return { ...d, items: d.items.map((i) => (i === existing ? { ...i, quantity: Number(i.quantity) + 1 } : i)) };
      return { ...d, items: [...d.items, { key: `${food._id}-${Date.now()}`, food, quantity: 1, unit: 'serving' }] };
    });
    toast.success(`${food.name} added to meal`, { id: 'added', duration: 1200 });
  };
  const patchItem = (key, patch) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));
  const removeItem = (key) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.key !== key) }));

  const save = async () => {
    if (!draft.items.length) return;
    if (draft.items.some((i) => !(Number(i.quantity) > 0))) return toast.error('Enter a quantity greater than zero for every food.');
    setSaving(true);
    const body = { date, mealType: draft.mealType, items: draft.items.map((i) => ({ foodId: i.food._id, quantity: Number(i.quantity), unit: i.unit })) };
    try {
      if (draft.id) await mealApi.update(draft.id, body); else await mealApi.create(body);
      toast.success(draft.id ? 'Meal updated' : 'Meal saved');
      setDraft(emptyDraft());
      logged.reload();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const edit = async (meal) => {
    const toastId = toast.loading('Loading meal…');
    try {
      const catalogue = await Promise.all(meal.items.map((i) => (i.food ? foodApi.get(i.food).catch(() => null) : null)));
      setDraft({
        id: meal._id, mealType: meal.mealType,
        items: meal.items.map((i, idx) => ({ key: `${meal._id}-${idx}`, food: snapshotToFood(i, catalogue[idx]), quantity: i.quantity, unit: i.unit })),
      });
      toast.dismiss(toastId);
      draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { toast.error(errorMessage(e), { id: toastId }); }
  };

  const remove = async (meal) => {
    if (!window.confirm('Delete this meal entry? This cannot be undone.')) return;
    setBusyId(meal._id);
    try {
      await mealApi.remove(meal._id);
      toast.success('Meal deleted');
      if (draft.id === meal._id) setDraft(emptyDraft());
      logged.reload();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusyId(null); }
  };

  const totals = previewTotals(draft.items);
  const pagination = foods.data?.pagination;

  return (
    <>
      <PageHeader title="Log a meal" subtitle="Search for foods, build your meal, then save it to the day you choose.">
        <DateNav date={date} onChange={setDate} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Food search */}
        <section>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input !pl-10" placeholder="Search foods, e.g. idli, paneer, oats" aria-label="Search foods" />
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {['', ...FOOD_CATEGORIES].map((c) => (
              <button key={c || 'all'} onClick={() => { setCategory(c); setPage(1); }} aria-pressed={category === c}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${category === c ? 'border-leaf-600 bg-leaf-600 text-white' : 'border-line bg-white text-ink-soft hover:bg-leaf-50'}`}>{c || 'All'}</button>
            ))}
          </div>

          <div className="mt-4">
            {foods.error ? <ErrorState message={foods.error} onRetry={foods.reload} /> : foods.loading && !foods.data ? (
              <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : foods.data.data.length === 0 ? (
              <div className="card"><EmptyState icon={Search} title="No foods match your search" text="Check the spelling or clear the category filter." /></div>
            ) : (
              <div className={`grid gap-3 sm:grid-cols-2 ${foods.loading ? 'opacity-60' : ''}`}>
                {foods.data.data.map((f) => (
                  <article key={f._id} className="card flex flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold leading-snug">{f.name}</h3>
                        <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">{f.category}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-faint">Per {f.servingLabel}</p>
                      <p className="mt-2 text-sm tabular-nums"><b className="font-display text-lg">{num(f.caloriesPer100g * f.servingGrams / 100)}</b> kcal
                        <span className="ml-2 text-xs text-ink-soft">P {num(f.proteinPer100g * f.servingGrams / 100, 1)} C {num(f.carbsPer100g * f.servingGrams / 100, 1)} F {num(f.fatPer100g * f.servingGrams / 100, 1)}</span></p>
                    </div>
                    <button onClick={() => addFood(f)} className="btn-ghost mt-3 w-full"><Plus size={16} /> Add to meal</button>
                  </article>
                ))}
              </div>
            )}
            {pagination && pagination.pages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost">Previous</button>
                <span className="text-ink-soft">Page {pagination.page} of {pagination.pages}</span>
                <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost">Next</button>
              </div>
            )}
          </div>
        </section>

        {/* Draft meal */}
        <aside ref={draftRef} className="scroll-mt-20 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{draft.id ? 'Editing meal' : 'Current meal'}</h2>
              {(draft.id || draft.items.length > 0) && <button onClick={() => setDraft(emptyDraft())} className="text-sm font-semibold text-ink-soft hover:text-fat"><X size={14} className="mr-1 inline" />{draft.id ? 'Cancel edit' : 'Clear'}</button>}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-paper p-1" role="radiogroup" aria-label="Meal type">
              {MEAL_TYPES.map((t) => (
                <button key={t.value} role="radio" aria-checked={draft.mealType === t.value} onClick={() => setDraft((d) => ({ ...d, mealType: t.value }))}
                  className={`rounded-lg py-1.5 text-xs font-bold transition sm:text-sm ${draft.mealType === t.value ? 'bg-white shadow-card text-leaf-700' : 'text-ink-soft'}`}>{t.label}</button>
              ))}
            </div>

            {draft.items.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title="No foods added yet" text="Choose foods from the list. You can add several to one meal." />
            ) : (
              <ul className="mt-4 space-y-3">
                {draft.items.map((i) => (
                  <li key={i.key} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-snug">{i.food.name}</p>
                      <button onClick={() => removeItem(i.key)} aria-label={`Remove ${i.food.name}`} className="text-ink-faint hover:text-fat"><Trash2 size={16} /></button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => patchItem(i.key, { quantity: Math.max(0.5, Number(i.quantity || 0) - (i.unit === 'g' ? 10 : 0.5)) })} aria-label="Decrease" className="btn-ghost !p-1.5"><Minus size={14} /></button>
                      <input type="number" min="0" step={i.unit === 'g' ? 1 : 0.5} value={i.quantity} aria-label={`Quantity of ${i.food.name}`}
                        onChange={(e) => patchItem(i.key, { quantity: e.target.value === '' ? '' : Number(e.target.value) })} className="input !w-20 !px-2 text-center" />
                      <button onClick={() => patchItem(i.key, { quantity: Number(i.quantity || 0) + (i.unit === 'g' ? 10 : 0.5) })} aria-label="Increase" className="btn-ghost !p-1.5"><Plus size={14} /></button>
                      <select value={i.unit} aria-label="Unit" onChange={(e) => patchItem(i.key, { unit: e.target.value, quantity: e.target.value === 'g' ? Math.round(i.food.servingGrams * (Number(i.quantity) || 1)) : 1 })} className="input !w-auto min-w-0 flex-1 !px-2">
                        <option value="serving">{i.food.servingLabel}</option><option value="g">grams</option>
                      </select>
                    </div>
                    <p className="mt-2 text-xs tabular-nums text-ink-soft"><b className="text-ink">{num(previewItem(i).calories)} kcal</b>, P {num(previewItem(i).protein, 1)}g, C {num(previewItem(i).carbs, 1)}g, F {num(previewItem(i).fat, 1)}g</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 rounded-xl bg-leaf-50 p-3.5">
              <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Meal total</span><span className="font-display text-2xl font-extrabold tabular-nums">{num(totals.calories)} kcal</span></div>
              <p className="mt-1 text-xs text-ink-soft tabular-nums">Protein {num(totals.protein, 1)} g, carbs {num(totals.carbs, 1)} g, fat {num(totals.fat, 1)} g</p>
            </div>
            <button onClick={save} disabled={!draft.items.length || saving} className="btn-primary mt-4 w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {draft.id ? 'Update meal' : 'Save meal'}
            </button>
          </div>
        </aside>
      </div>

      {/* Logged meals for the selected date */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Logged on this day</h2>
          {logged.data && <span className="text-sm text-ink-soft tabular-nums">{num(logged.data.totals.calories)} kcal total</span>}
        </div>
        {logged.error ? <ErrorState message={logged.error} onRetry={logged.reload} /> : logged.loading && !logged.data ? <Skeleton className="h-32" /> :
          logged.data.meals.length === 0 ? <div className="card"><EmptyState title="No meals logged for this day" text="Build a meal above and save it. It will show up here, ready to edit." /></div> :
          <MealList meals={logged.data.meals} onEdit={edit} onDelete={remove} busyId={busyId} />}
      </section>
    </>
  );
}
