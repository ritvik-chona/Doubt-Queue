import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, LogoMark } from './Icons.jsx';
import Avatar from './ui/Avatar.jsx';

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
    <header className="sticky top-0 z-30 bg-canvas/75 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/60">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-3 px-4">
        <Link to="/courses" className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-fg">
          <LogoMark />
          <span>Doubt Queue</span>
        </Link>
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Avatar name={user.name} />
              <span className="hidden max-w-36 truncate text-sm text-fg sm:inline">{user.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                  user.role === 'ta'
                    ? 'bg-accent/15 text-accent-fg ring-accent/40'
                    : 'bg-raised text-muted ring-line'
                }`}
              >
                {user.role === 'ta' ? 'TA' : 'Student'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              disabled={busy}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{busy ? 'Logging out…' : 'Log out'}</span>
            </button>
          </div>
        )}
      </div>
      <div
        className="shimmer-line h-px bg-gradient-to-r from-transparent via-accent-fg/60 to-transparent"
        aria-hidden="true"
      />
    </header>
  );
}
