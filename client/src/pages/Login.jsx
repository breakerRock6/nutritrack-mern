import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import AuthShell from '../components/AuthShell';
import { Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (e) {
      setFormError(errorMessage(e, 'Could not log in.'));
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Pick up where you left off."
      footer={<>New to NutriTrack? <Link to="/register" className="font-semibold text-leaf-700 hover:underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-xl bg-fat/10 px-4 py-3 text-sm font-medium text-fat">{formError}</div>}
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className="input" placeholder="you@example.com"
            {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" className="input"
            {...register('password', { required: 'Enter your password' })} />
        </Field>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting && <Loader2 size={16} className="animate-spin" />} Log in
        </button>
        <p className="rounded-xl bg-paper px-4 py-3 text-xs text-ink-soft">Trying the demo? Use <b>demo@example.com</b> and <b>Demo@1234</b> (after running <code>npm run seed:demo</code>).</p>
      </form>
    </AuthShell>
  );
}
