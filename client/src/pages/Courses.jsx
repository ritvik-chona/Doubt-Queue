import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../api/client.js';
import Field, { inputClass } from '../components/Field.jsx';
import { ArrowRight, Check, Copy, GraduationCap, Plus, Shield, Users } from '../components/Icons.jsx';
import { CourseGridSkeleton, Empty, ErrorState } from '../components/States.jsx';
import { toneFor } from '../components/ui/Avatar.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CountUp } from '../components/fx/Motion.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const focusField = (id) => document.getElementById(id)?.focus();

// "Data Structures and Algorithms" -> "DSA"
const SMALL_WORDS = new Set(['and', 'of', 'the', 'to', 'in', 'for']);
const courseInitials = (name) =>
  name
    .split(/[\s&-]+/)
    .filter((word) => /^[a-z]/i.test(word) && !SMALL_WORDS.has(word.toLowerCase()))
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

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

  const isTa = user.role === 'ta';

  let content;
  if (error) content = <ErrorState error={error} onRetry={load} />;
  else if (!courses) content = <CourseGridSkeleton />;
  else if (courses.length === 0)
    content = (
      <Empty
        title="You're not in any courses yet"
        icon={<EmptyCoursesArt />}
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => focusField(isTa ? 'course-name' : 'join-code')}
          >
            {isTa ? <Plus /> : <ArrowRight />}
            {isTa ? 'Create your first course' : 'Enter a join code'}
          </button>
        }
      >
        {isTa
          ? 'Create a course and share its join code with your students, or join a course as a co-TA.'
          : 'Ask your TA for the 6-character join code and enter it above.'}
      </Empty>
    );
  else
    content = (
      <ul className="stagger grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} isTa={isTa} />
        ))}
      </ul>
    );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">Welcome back, {user.name.split(' ')[0]}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">My courses</h1>
      </header>

      <div className={`stagger grid gap-4 ${isTa ? 'md:grid-cols-2' : 'md:max-w-md'}`}>
        <JoinCourseForm onJoined={addCourse} />
        {isTa && <CreateCourseForm onCreated={addCourse} />}
      </div>

      <section className="space-y-4">
        {courses?.length > 0 && (
          <h2 className="text-sm font-medium tracking-wide text-subtle uppercase">
            <CountUp value={courses.length} /> {courses.length === 1 ? 'course' : 'courses'}
          </h2>
        )}
        {content}
      </section>
    </div>
  );
}

function CourseCard({ course, isTa }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(course.joinCode);
      setCopied(true);
      toast(`Join code ${course.joinCode} copied`);
    } catch {
      toast('Could not copy the join code', { type: 'error' });
    }
    setTimeout(() => setCopied(false), 2000);
  }

  const roleLabel = course.isOwner ? 'Owner' : isTa ? 'Co-TA' : 'Enrolled';

  return (
    <li className="card spotlight group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-pop">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold tracking-tight ring-1 ring-white/10 ${toneFor(course.code)}`}
          aria-hidden="true"
        >
          {courseInitials(course.name)}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            to={`/courses/${course._id}`}
            className="block rounded font-semibold leading-snug text-fg [overflow-wrap:anywhere] hover:text-accent-fg"
          >
            {course.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="chip">{course.code}</span>
            <span>TA: {course.owner.name}</span>
          </div>
        </div>
        <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
          {roleLabel}
        </span>
      </div>

      {course.isOwner && (
        <div className="flex items-center justify-between gap-3 rounded-control border border-dashed border-line-strong bg-canvas px-3 py-2">
          <div>
            <p className="text-[11px] tracking-wide text-subtle uppercase">Join code</p>
            <code className="font-mono text-base font-semibold tracking-[0.3em] text-fg">{course.joinCode}</code>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={copyCode}
            aria-label={`Copy join code ${course.joinCode}`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-resolved" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          {course.isOwner ? (
            <>
              <Users className="h-4 w-4" />
              <CountUp value={course.memberCount} /> {course.memberCount === 1 ? 'member' : 'members'}
            </>
          ) : isTa ? (
            <>
              <Shield className="h-4 w-4" />
              Helping as co-TA
            </>
          ) : (
            <>
              <GraduationCap className="h-4 w-4" />
              Student
            </>
          )}
        </span>
        <Link
          to={`/courses/${course._id}`}
          className="inline-flex items-center gap-1 rounded font-medium text-accent-fg hover:underline"
        >
          Open queue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </li>
  );
}

function JoinCourseForm({ onJoined }) {
  const toast = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/courses/join', { joinCode });
      onJoined(data.course);
      toast(`Joined ${data.course.name}`);
      setJoinCode('');
    } catch (err) {
      setError(err.fieldErrors.joinCode || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card spotlight flex flex-col gap-4 p-5" noValidate>
      <FormHeading icon={ArrowRight} title="Join a course" text="Enter the 6-character code from your TA." />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Field label="Join code" error={error}>
            <input
              id="join-code"
              className={`${inputClass(error)} h-11 font-mono text-base tracking-[0.35em] uppercase placeholder:tracking-[0.35em]`}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
              placeholder="ABC123"
              autoComplete="off"
            />
          </Field>
        </div>
        <button
          type="submit"
          className="btn btn-primary h-11 sm:mt-[1.875rem]"
          disabled={submitting || !joinCode.trim()}
        >
          {submitting ? 'Joining…' : 'Join'}
        </button>
      </div>
    </form>
  );
}

function CreateCourseForm({ onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const { data } = await api.post('/courses', form);
      onCreated(data.course);
      toast(`Created ${data.course.name}. Join code: ${data.course.joinCode}`, { duration: 6000 });
      setForm({ name: '', code: '' });
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card spotlight flex flex-col gap-4 p-5" noValidate>
      <FormHeading icon={Plus} title="Create a course" text="You'll get a join code to share." />
      {message && <p className="alert-error">{message}</p>}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Field label="Name" error={errors.name}>
            <input
              id="course-name"
              className={`${inputClass(errors.name)} h-11`}
              value={form.name}
              onChange={update('name')}
              placeholder="Data Structures"
            />
          </Field>
        </div>
        <Field label="Code" error={errors.code}>
          <input
            className={`${inputClass(errors.code)} h-11 uppercase`}
            value={form.code}
            onChange={update('code')}
            placeholder="CS201"
          />
        </Field>
      </div>
      <button type="submit" className="btn btn-primary h-11" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create course'}
      </button>
    </form>
  );
}

function FormHeading({ icon: HeadingIcon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-fg ring-1 ring-accent/30">
        <HeadingIcon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="font-semibold text-fg">{title}</h2>
        <p className="text-sm text-muted">{text}</p>
      </div>
    </div>
  );
}

// Simple stacked-cards illustration for the empty state.
function EmptyCoursesArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
      <rect x="10" y="6" width="28" height="20" rx="4" fill="currentColor" opacity=".25" />
      <rect x="6" y="14" width="36" height="24" rx="5" fill="currentColor" opacity=".45" />
      <rect x="12" y="22" width="16" height="3" rx="1.5" fill="#fff" opacity=".8" />
      <rect x="12" y="29" width="10" height="3" rx="1.5" fill="#fff" opacity=".5" />
    </svg>
  );
}
