import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Skeleton } from './components/ui';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import History from './pages/History';
import Landing from './pages/Landing';
import LogMeal from './pages/LogMeal';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';

function FullPageLoader() {
  return <div className="grid min-h-screen place-items-center"><Skeleton className="h-10 w-10 !rounded-full" /></div>;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppLayout />;
}

function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log" element={<LogMeal />} />
        <Route path="/history" element={<History />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
