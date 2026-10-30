import { Loader2, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client';
import { analyticsApi, userApi } from '../api/services';
import { MacroBar } from '../components/charts';
import { ErrorState, Field, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { ACTIVITY_OPTIONS, MACRO_COLORS, num, todayLocal } from '../utils/format';

const rule = (label, min, max) => ({
  valueAsNumber: true, required: `Enter ${label}`,
  validate: (v) => (!Number.isNaN(v) && v >= min && v <= max) || `Must be between ${min} and ${max}`,
});

export default function Goals() {
  const { user, setUser } = useAuth();
  const today = todayLocal();
  const day = useFetch(() => analyticsApi.daily(today), [today]);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm();

  const fromUser = (u) => ({ ...u.goals, currentWeightKg: u.currentWeightKg, targetWeightKg: u.targetWeightKg, activityLevel: u.activityLevel });
  useEffect(() => { if (user) reset(fromUser(user)); }, [user, reset]);

  const [calories, protein, carbs, fat] = watch(['calories', 'protein', 'carbs', 'fat']);
  const macroKcal = Math.round((protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9);

  const useSuggested = async () => {
    try {
      const { goals } = await userApi.suggestedGoals();
      reset({ ...watch(), ...goals }, { keepDefaultValues: true }); // stays 'dirty' so Save is enabled
      toast.success('Suggested targets filled in. Review them, then save.');
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const onSubmit = async (v) => {
    try {
      const saved = await userApi.updateGoals(v);
      setUser((u) => ({ ...u, goals: saved.goals, currentWeightKg: saved.currentWeightKg, targetWeightKg: saved.targetWeightKg, activityLevel: saved.activityLevel }));
      day.reload();
      toast.success('Goals saved');
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Nutrition goals" subtitle="Set the daily targets your dashboard and charts are measured against." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-leaf-50 px-4 py-3">
            <p className="max-w-sm text-sm text-ink-soft">Not sure where to start? We can estimate targets from your profile and activity level.</p>
            <button type="button" onClick={useSuggested} className="btn-ghost"><Sparkles size={16} /> Use suggested targets</button>
          </div>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-bold">Daily targets</legend>
            <Field label="Calories (kcal)" error={errors.calories?.message}><input type="number" className="input" {...register('calories', rule('calories', 800, 6000))} /></Field>
            <Field label="Water (ml)" error={errors.waterMl?.message}><input type="number" step="50" className="input" {...register('waterMl', rule('water goal', 500, 10000))} /></Field>
            <Field label="Protein (g)" error={errors.protein?.message}><input type="number" className="input" {...register('protein', rule('protein', 0, 500))} /></Field>
            <Field label="Carbohydrates (g)" error={errors.carbs?.message}><input type="number" className="input" {...register('carbs', rule('carbs', 0, 900))} /></Field>
            <Field label="Fat (g)" error={errors.fat?.message}><input type="number" className="input" {...register('fat', rule('fat', 0, 300))} /></Field>
            <div className="flex items-end"><p className="pb-2.5 text-xs text-ink-soft">Your macros add up to about <b className="text-ink">{num(macroKcal)} kcal</b>{calories ? ` (${Math.round((macroKcal / calories) * 100)}% of your calorie target).` : '.'}</p></div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-bold">Body and activity</legend>
            <Field label="Current weight (kg)" error={errors.currentWeightKg?.message}><input type="number" step="0.1" className="input" {...register('currentWeightKg', rule('current weight', 25, 400))} /></Field>
            <Field label="Target weight (kg)" error={errors.targetWeightKg?.message}><input type="number" step="0.1" className="input" {...register('targetWeightKg', rule('target weight', 25, 400))} /></Field>
            <div className="sm:col-span-2"><Field label="Activity level"><select className="input" {...register('activityLevel')}>{ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field></div>
          </fieldset>

          <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">{isSubmitting && <Loader2 size={16} className="animate-spin" />} Save goals</button>
          <p className="text-xs text-ink-faint">Suggested targets come from the Mifflin-St Jeor equation and are estimates for general wellness, not medical advice. For personal dietary guidance, talk to a doctor or registered dietitian.</p>
        </form>

        <section className="card self-start p-6">
          <h2 className="mb-1 text-lg font-bold">Today’s progress</h2>
          <p className="mb-5 text-sm text-ink-soft">Your intake so far compared with your saved targets.</p>
          {day.error ? <ErrorState message={day.error} onRetry={day.reload} /> : day.loading && !day.data ? <Skeleton className="h-60" /> : (
            <div className="space-y-5">
              <MacroBar label="Calories" value={day.data.consumed.calories} goal={day.data.goals.calories} color="#1E8A4C" unit=" kcal" />
              <MacroBar label="Protein" value={day.data.consumed.protein} goal={day.data.goals.protein} color={MACRO_COLORS.protein} />
              <MacroBar label="Carbohydrates" value={day.data.consumed.carbs} goal={day.data.goals.carbs} color={MACRO_COLORS.carbs} />
              <MacroBar label="Fat" value={day.data.consumed.fat} goal={day.data.goals.fat} color={MACRO_COLORS.fat} />
              <MacroBar label="Water" value={day.data.water.amountMl} goal={day.data.water.goalMl} color="#3AA6D8" unit=" ml" />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
