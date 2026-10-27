import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../api/client.js';
import Field, { inputClass } from '../components/Field.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setCourses(null);
    try {
      const { data } = await api.get('/courses');
      setCourses(data.courses);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCourse = (course) =>
    setCourses((prev) => [course, ...(prev ?? []).filter((c) => c._id !== course._id)]);

  let content;
  if (error) content = <ErrorState error={error} onRetry={load} />;
  else if (!courses) content = <Loading label="Loading your courses…" />;
  else if (courses.length === 0)
    content = (
      <Empty title="You're not in any courses yet">
        {user.role === 'ta'
          ? 'Create a course and share its join code with your students, or join a course as a co-TA.'
          : 'Ask your TA for the 6-character join code and enter it above.'}
      </Empty>
    );
  else
    content = (
      <ul className="grid gap-3">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </ul>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My courses</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <JoinCourseForm onJoined={addCourse} />
        {user.role === 'ta' && <CreateCourseForm onCreated={addCourse} />}
      </div>
      {content}
    </div>
  );
}

function CourseCard({ course }) {
  const [copied, setCopied] = useState('');

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(course.joinCode);
      setCopied('Copied!');
    } catch {
      setCopied('Copy failed');
    }
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <li className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to={`/courses/${course._id}`} className="font-medium text-slate-900 hover:text-indigo-700">
          {course.name}
        </Link>
        <p className="text-sm text-slate-500">
          {course.code} · {course.isOwner ? `You own this course · ${course.memberCount} members` : `TA: ${course.owner.name}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {course.isOwner && (
          <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1">
            <span className="text-xs text-slate-500">Join code</span>
            <code className="font-mono text-sm font-semibold tracking-widest">{course.joinCode}</code>
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyCode}>
              {copied || 'Copy'}
            </button>
          </div>
        )}
        <Link to={`/courses/${course._id}`} className="btn btn-secondary btn-sm">
          Open
        </Link>
      </div>
    </li>
  );
}

function JoinCourseForm({ onJoined }) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/courses/join', { joinCode });
      onJoined(data.course);
      setSuccess(`Joined ${data.course.name}`);
      setJoinCode('');
    } catch (err) {
      setError(err.fieldErrors.joinCode || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3" noValidate>
      <h2 className="font-medium">Join with code</h2>
      <Field label="Join code" error={error}>
        <input
          className={`${inputClass(error)} font-mono uppercase tracking-widest`}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          maxLength={6}
          placeholder="ABC123"
        />
      </Field>
      {success && <p className="alert-success">{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting || !joinCode.trim()}>
        {submitting ? 'Joining…' : 'Join course'}
      </button>
    </form>
  );
}

function CreateCourseForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    setSuccess('');
    try {
      const { data } = await api.post('/courses', form);
      onCreated(data.course);
      setSuccess(`Created ${data.course.name}. Share join code ${data.course.joinCode} with students.`);
      setForm({ name: '', code: '' });
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3" noValidate>
      <h2 className="font-medium">Create course</h2>
      {message && <p className="alert-error">{message}</p>}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Field label="Name" error={errors.name}>
            <input
              className={inputClass(errors.name)}
              value={form.name}
              onChange={update('name')}
              placeholder="Data Structures"
            />
          </Field>
        </div>
        <Field label="Code" error={errors.code}>
          <input
            className={`${inputClass(errors.code)} uppercase`}
            value={form.code}
            onChange={update('code')}
            placeholder="CS201"
          />
        </Field>
      </div>
      {success && <p className="alert-success">{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create course'}
      </button>
    </form>
  );
}
