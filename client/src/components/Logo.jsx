import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-600 text-white"><Leaf size={18} /></span>
      NutriTrack
    </Link>
  );
}
