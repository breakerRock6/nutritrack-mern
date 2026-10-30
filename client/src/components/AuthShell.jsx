import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children, footer, wide }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-leaf-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div className="relative z-10">
          <p className="font-display text-4xl font-extrabold leading-tight">Idli for breakfast, dal for lunch. Every bite counted.</p>
          <p className="mt-4 max-w-sm text-leaf-100">Search 60+ foods, including everyday Indian dishes, and see calories and macros update as you eat.</p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border-[36px] border-leaf-700" />
        <p className="relative z-10 text-sm text-leaf-200">Nutrition values are estimates, not medical advice.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mb-7 mt-1.5 text-ink-soft">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>
          <p className="mt-4 text-center text-xs text-ink-faint"><Link to="/" className="hover:underline">Back to home page</Link></p>
        </div>
      </main>
    </div>
  );
}
