import { Pencil, Trash2 } from 'lucide-react';
import { MEAL_TYPES, num } from '../utils/format';

const Macros = ({ t }) => (
  <span className="text-xs text-ink-soft tabular-nums">P {num(t.protein, 1)}g, C {num(t.carbs, 1)}g, F {num(t.fat, 1)}g</span>
);

export const quantityLabel = (i) => (i.unit === 'g' ? `${num(i.quantity, 1)} g` : `${num(i.quantity, 2)} × ${i.servingLabel || 'serving'}`);

/** Meals grouped by breakfast/lunch/dinner/snack. Pass onEdit/onDelete to make it editable. */
export default function MealList({ meals, onEdit, onDelete, busyId }) {
  return (
    <div className="space-y-4">
      {MEAL_TYPES.map(({ value, label }) => {
        const list = meals.filter((m) => m.mealType === value);
        if (!list.length) return null;
        const kcal = list.reduce((s, m) => s + m.totals.calories, 0);
        return (
          <section key={value} className="card overflow-hidden">
            <div className="flex items-center justify-between bg-leaf-50/60 px-5 py-3">
              <h3 className="font-bold">{label}</h3>
              <span className="font-display font-bold tabular-nums">{num(kcal, 0)} kcal</span>
            </div>
            <div className="divide-y divide-line">
              {list.map((meal) => (
                <div key={meal._id} className="px-5 py-3.5">
                  <ul className="space-y-1.5">
                    {meal.items.map((i, idx) => (
                      <li key={idx} className="flex items-baseline justify-between gap-3 text-sm">
                        <span><span className="font-semibold">{i.name}</span> <span className="text-ink-soft">{quantityLabel(i)}</span></span>
                        <span className="shrink-0 tabular-nums text-ink-soft">{num(i.calories, 0)} kcal</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <Macros t={meal.totals} />
                    {(onEdit || onDelete) && (
                      <div className="flex gap-1">
                        {onEdit && <button onClick={() => onEdit(meal)} className="btn-ghost !px-3 !py-1.5"><Pencil size={14} /> Edit</button>}
                        {onDelete && <button onClick={() => onDelete(meal)} disabled={busyId === meal._id} className="btn-danger !px-3 !py-1.5"><Trash2 size={14} /> Delete</button>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
