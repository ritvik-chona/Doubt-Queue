import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import Field, { inputClass } from '../components/Field.jsx';
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
      title="Log in"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && <p className="alert-error">{message}</p>}
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            value={form.email}
            onChange={update('email')}
            required
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass(errors.password)}
            value={form.password}
            onChange={update('password')}
            required
          />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
