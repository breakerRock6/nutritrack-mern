import { BarChart3, LayoutDashboard, LogOut, Target, User, UtensilsCrossed } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/log', label: 'Log meal', short: 'Log', icon: UtensilsCrossed },
  { to: '/history', label: 'History', short: 'History', icon: BarChart3 },
  { to: '/goals', label: 'Goals', short: 'Goals', icon: Target },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: User },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = async () => { await logout(); toast.success('Logged out'); navigate('/'); };

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white p-5 lg:flex">
        <Logo to="/dashboard" />
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-leaf-50 text-leaf-700' : 'text-ink-soft hover:bg-paper hover:text-ink'}`}>
              <Icon size={19} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl bg-paper p-3.5">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-ink-faint">{user.email}</p>
          <button onClick={onLogout} className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-fat">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo to="/dashboard" />
        <button onClick={onLogout} aria-label="Log out" className="rounded-lg p-2 text-ink-soft hover:bg-paper"><LogOut size={19} /></button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ to, short, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-leaf-700' : 'text-ink-faint'}`}>
            <Icon size={20} />{short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
