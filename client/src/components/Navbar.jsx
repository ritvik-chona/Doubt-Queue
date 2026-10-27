import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await logout().catch(() => {});
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/courses" className="font-semibold text-indigo-700">
          Doubt Queue
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-700">
              {user.name}
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-600">
                {user.role === 'ta' ? 'TA' : 'Student'}
              </span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout} disabled={busy}>
              {busy ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
