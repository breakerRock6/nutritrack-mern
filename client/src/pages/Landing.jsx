import { BarChart3, Droplets, Search, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MacroBar, ProgressRing } from '../components/charts';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { MACRO_COLORS } from '../utils/format';

const FEATURES = [
  { icon: Search, title: 'Search a real food catalogue', text: 'Sixty everyday foods with calories, protein, carbs and fat. Idli, dosa, sambar, dal, chapati and paneer sit next to oats, eggs and almonds.' },
  { icon: Target, title: 'Targets that fit you', text: 'Your age, height, weight and activity level produce a starting calorie and macro estimate. Change any number you like.' },
  { icon: Droplets, title: 'Water in one tap', text: 'Add a glass at a time and watch the day’s total fill toward your goal.' },
  { icon: BarChart3, title: 'Trends, not just totals', text: 'Switch between day, week and month views to see how your intake compares with your targets.' },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? { to: '/dashboard', label: 'Open your dashboard' } : { to: '/register', label: 'Start tracking free' };

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {!user && <Link to="/login" className="btn text-ink-soft hover:text-ink">Log in</Link>}
          <Link to={cta.to} className="btn-primary">{user ? 'Dashboard' : 'Sign up'}</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">Log a meal in seconds. See where your day stands.</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">NutriTrack turns what you eat into calories and macros, then compares them with your own daily targets, so the next meal is an easy decision.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={cta.to} className="btn-primary px-6 py-3 text-base">{cta.label}</Link>
            {!user && <Link to="/login" className="btn-ghost px-6 py-3 text-base">I have an account</Link>}
          </div>
        </div>

        <div className="card relative mx-auto w-full max-w-md p-6 shadow-lift" aria-label="Sample dashboard">
          <p className="mb-4 text-sm font-semibold text-ink-soft">Sample day: Tuesday</p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ProgressRing value={1180} goal={1900} size={170} stroke={15} />
            <div className="w-full space-y-3.5">
              <MacroBar label="Protein" value={62} goal={95} color={MACRO_COLORS.protein} />
              <MacroBar label="Carbs" value={148} goal={230} color={MACRO_COLORS.carbs} />
              <MacroBar label="Fat" value={34} goal={58} color={MACRO_COLORS.fat} />
            </div>
          </div>
          <ul className="mt-5 divide-y divide-line rounded-xl border border-line text-sm">
            {[['Idli (3) with sambar', '248 kcal'], ['Toor dal, rice and chapati', '512 kcal'], ['Almonds and an apple', '210 kcal']].map(([n, k]) => (
              <li key={n} className="flex justify-between px-3.5 py-2.5"><span>{n}</span><span className="font-semibold tabular-nums">{k}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">Everything you need, nothing to learn first</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-leaf-50 text-leaf-600"><Icon size={22} /></span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">Your first meal takes less than a minute to log</h2>
        <Link to={cta.to} className="btn-primary mt-8 px-7 py-3 text-base">{cta.label}</Link>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink-faint">
        Nutrition values and calorie targets are estimates for general wellness tracking, not medical advice.
      </footer>
    </div>
  );
}
