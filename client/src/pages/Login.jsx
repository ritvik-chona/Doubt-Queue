import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { ArrowRight, GraduationCap, Lock, Mail, Shield } from '../components/Icons.jsx';
import { IconInput, PasswordInput } from '../components/ui/TextInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/courses';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirectTo} replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setMessage(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your courses and the doubt queue."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-accent-fg hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stagger space-y-5" noValidate>
        {message && <p className="alert-error">{message}</p>}
        <Field label="Email" error={errors.email}>
          <IconInput
            icon={Mail}
            error={errors.email}
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={form.email}
            onChange={update('email')}
            required
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput
            icon={Lock}
            error={errors.password}
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={update('password')}
            required
          />
        </Field>
        <button type="submit" className="btn btn-primary group h-11 w-full text-[15px]" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
          {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      <DemoAccounts onPick={(email) => setForm({ email, password: DEMO_PASSWORD })} />
    </AuthLayout>
  );
}

// Fills the form with a seeded demo account (see README). Does not log in by itself.
const DEMO_PASSWORD = 'DoubtQueue@2026';
const DEMO_ACCOUNTS = [
  { label: 'Student', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', icon: GraduationCap },
  { label: 'TA', name: 'Priya Sharma', email: 'priya.sharma@example.com', icon: Shield },
];

function DemoAccounts({ onPick }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" />
        or try a demo account
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map(({ label, name, email, icon: AccountIcon }) => (
          <button
            key={email}
            type="button"
            onClick={() => onPick(email)}
            className="group flex items-center gap-2.5 rounded-control border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent-fg/40 hover:bg-raised"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-fg">
              <AccountIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{label}</span>
              <span className="block truncate text-xs text-subtle">{name}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
