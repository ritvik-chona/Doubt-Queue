import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import Field, { inputClass } from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

const ROLES = [
  { value: 'student', label: 'Student', hint: 'Ask doubts and upvote others' },
  { value: 'ta', label: 'TA', hint: 'Create courses and answer doubts' },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/courses" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      await register(form);
      navigate('/courses', { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setMessage(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {message && <p className="alert-error">{message}</p>}
        <Field label="Name" error={errors.name}>
          <input
            autoComplete="name"
            className={inputClass(errors.name)}
            value={form.name}
            onChange={update('name')}
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            value={form.email}
            onChange={update('email')}
          />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(errors.password)}
            value={form.password}
            onChange={update('password')}
          />
        </Field>

        <fieldset>
          <legend className="label">I am a</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className={`cursor-pointer rounded-md border p-3 text-sm ${
                  form.role === role.value
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={form.role === role.value}
                  onChange={update('role')}
                  className="sr-only"
                />
                <span className="block font-medium">{role.label}</span>
                <span className="block text-xs text-slate-500">{role.hint}</span>
              </label>
            ))}
          </div>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </fieldset>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
