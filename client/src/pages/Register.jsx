import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { ArrowRight, Check, GraduationCap, Lock, Mail, Shield, User } from '../components/Icons.jsx';
import { IconInput, PasswordInput } from '../components/ui/TextInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

const ROLES = [
  { value: 'student', label: 'Student', hint: 'Ask doubts and upvote others', icon: GraduationCap },
  { value: 'ta', label: 'TA', hint: 'Create courses and answer doubts', icon: Shield },
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
      title="Create your account"
      subtitle="Students ask and upvote. TAs claim, answer and resolve."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-fg hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stagger space-y-5" noValidate>
        {message && <p className="alert-error">{message}</p>}

        <fieldset>
          <legend className="label">I am a</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, hint, icon: RoleIcon }) => {
              const selected = form.role === value;
              return (
                <label
                  key={value}
                  className={`relative cursor-pointer rounded-card border p-3.5 text-sm transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-fg ${
                    selected
                      ? 'border-accent-fg/60 bg-accent/15 shadow-lg shadow-accent/10'
                      : 'border-line bg-surface hover:border-line-strong hover:bg-raised'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={update('role')}
                    className="sr-only"
                  />
                  <span
                    className={`mb-2.5 grid h-9 w-9 place-items-center rounded-lg ${
                      selected ? 'bg-accent text-white' : 'bg-raised text-muted'
                    }`}
                  >
                    <RoleIcon className="h-5 w-5" />
                  </span>
                  <span className="block font-semibold text-fg">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span>
                  {selected && (
                    <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </fieldset>

        <Field label="Full name" error={errors.name}>
          <IconInput
            icon={User}
            error={errors.name}
            autoComplete="name"
            placeholder="Ananya Iyer"
            value={form.name}
            onChange={update('name')}
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <IconInput
            icon={Mail}
            error={errors.email}
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={form.email}
            onChange={update('email')}
          />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters">
          <PasswordInput
            icon={Lock}
            error={errors.password}
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={update('password')}
          />
        </Field>

        <button type="submit" className="btn btn-primary group h-11 w-full text-[15px]" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
          {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>
    </AuthLayout>
  );
}
