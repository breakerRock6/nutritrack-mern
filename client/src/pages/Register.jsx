import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import AuthShell from '../components/AuthShell';
import { Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ACTIVITY_OPTIONS } from '../utils/format';

const numField = (label, min, max) => ({
  valueAsNumber: true,
  required: `Enter your ${label}`,
  validate: (v) => (!Number.isNaN(v) && v >= min && v <= max) || `${label[0].toUpperCase() + label.slice(1)} must be between ${min} and ${max}`,
});

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { gender: 'female', activityLevel: 'light' },
  });

  const onSubmit = async (v) => {
    setFormError('');
    const body = { ...v, targetWeightKg: Number.isNaN(v.targetWeightKg) ? undefined : v.targetWeightKg };
    try {
      await signup(body);
      toast.success('Account created. We estimated your daily targets.');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setFormError(errorMessage(e, 'Could not create your account.'));
    }
  };

  return (
    <AuthShell wide title="Create your account" subtitle="We use these details to estimate your daily calorie and macro targets. You can change them anytime."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-leaf-700 hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {formError && <div role="alert" className="rounded-xl bg-fat/10 px-4 py-3 text-sm font-medium text-fat sm:col-span-2">{formError}</div>}
        <div className="sm:col-span-2">
          <Field label="Full name" error={errors.name?.message}>
            <input className="input" autoComplete="name" {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className="input" autoComplete="email"
              {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
            <input type="password" className="input" autoComplete="new-password"
              {...register('password', {
                required: 'Choose a password',
                minLength: { value: 8, message: 'Use at least 8 characters' },
                validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include at least one letter and one number',
              })} />
          </Field>
        </div>
        <Field label="Age" error={errors.age?.message}>
          <input type="number" className="input" {...register('age', numField('age', 13, 120))} />
        </Field>
        <Field label="Gender" hint="Used only in the calorie estimate.">
          <select className="input" {...register('gender')}>
            <option value="female">Female</option><option value="male">Male</option><option value="other">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Height (cm)" error={errors.heightCm?.message}>
          <input type="number" step="0.1" className="input" {...register('heightCm', numField('height', 80, 250))} />
        </Field>
        <Field label="Current weight (kg)" error={errors.currentWeightKg?.message}>
          <input type="number" step="0.1" className="input" {...register('currentWeightKg', numField('weight', 25, 400))} />
        </Field>
        <Field label="Target weight (kg)" hint="Optional. Leave blank to maintain.">
          <input type="number" step="0.1" className="input" {...register('targetWeightKg', { valueAsNumber: true })} />
        </Field>
        <Field label="Activity level">
          <select className="input" {...register('activityLevel')}>
            {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <button type="submit" disabled={isSubmitting} className="btn-primary sm:col-span-2">
          {isSubmitting && <Loader2 size={16} className="animate-spin" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}
