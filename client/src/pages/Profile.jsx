import { Loader2, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { userApi } from '../api/services';
import { Field, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ACTIVITY_OPTIONS } from '../utils/format';

const rule = (label, min, max) => ({
  valueAsNumber: true, required: `Enter ${label}`,
  validate: (v) => (!Number.isNaN(v) && v >= min && v <= max) || `Must be between ${min} and ${max}`,
});

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm();
  useEffect(() => { reset({ ...user, recalculateGoals: false }); }, [user, reset]);

  const onSubmit = async ({ name, age, gender, heightCm, currentWeightKg, targetWeightKg, activityLevel, recalculateGoals }) => {
    try {
      const { user: updated } = await userApi.updateProfile({ name, age, gender, heightCm, currentWeightKg, targetWeightKg, activityLevel, recalculateGoals });
      setUser(updated);
      toast.success(recalculateGoals ? 'Profile saved and goals recalculated' : 'Profile saved');
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Profile and settings" subtitle="Your details are used to estimate daily calorie and macro targets." />
      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl space-y-5 p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Full name" error={errors.name?.message}><input className="input" {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Email" hint="Your email can’t be changed here."><input className="input bg-paper" value={user.email} readOnly /></Field></div>
          <Field label="Age" error={errors.age?.message}><input type="number" className="input" {...register('age', rule('age', 13, 120))} /></Field>
          <Field label="Gender"><select className="input" {...register('gender')}><option value="female">Female</option><option value="male">Male</option><option value="other">Prefer not to say</option></select></Field>
          <Field label="Height (cm)" error={errors.heightCm?.message}><input type="number" step="0.1" className="input" {...register('heightCm', rule('height', 80, 250))} /></Field>
          <Field label="Current weight (kg)" error={errors.currentWeightKg?.message}><input type="number" step="0.1" className="input" {...register('currentWeightKg', rule('weight', 25, 400))} /></Field>
          <Field label="Target weight (kg)" error={errors.targetWeightKg?.message}><input type="number" step="0.1" className="input" {...register('targetWeightKg', rule('target weight', 25, 400))} /></Field>
          <Field label="Activity level"><select className="input" {...register('activityLevel')}>{ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-leaf-50 p-4 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-leaf-600" {...register('recalculateGoals')} />
          <span><b>Recalculate my daily goals from these details.</b><br /><span className="text-ink-soft">This replaces your current calorie, macro and water targets with new estimates.</span></span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">{isSubmitting && <Loader2 size={16} className="animate-spin" />} Save changes</button>
          <button type="button" onClick={async () => { await logout(); navigate('/'); }} className="btn-ghost"><LogOut size={16} /> Log out</button>
        </div>
      </form>
    </>
  );
}
