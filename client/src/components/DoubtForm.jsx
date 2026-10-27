import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import { useDebounce } from '../hooks/useDebounce.js';
import Field, { inputClass } from './Field.jsx';
import StatusBadge from './StatusBadge.jsx';

const MIN_SIMILAR_LENGTH = 8;

const parseTags = (text) =>
  text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

// Server reports tag problems as "tags" or "tags.2"; show them all under one field.
function toFieldErrors(details) {
  const errors = {};
  for (const { field, message } of details) {
    const key = field.startsWith('tags') ? 'tags' : field;
    errors[key] ??= message;
  }
  return errors;
}

export default function DoubtForm({ courseId, onCreated }) {
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
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
      const { data } = await api.post(`/courses/${courseId}/doubts`, {
        title: form.title,
        body: form.body,
        tags: parseTags(form.tags),
      });
      onCreated(data.doubt);
    } catch (err) {
      setErrors(toFieldErrors(err.details));
      if (!err.details.length) setMessage(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <form onSubmit={handleSubmit} className="card space-y-4 md:col-span-3" noValidate>
        {message && <p className="alert-error">{message}</p>}
        <Field label="Title" error={errors.title} hint="Summarize your doubt in one line (5–150 characters)">
          <input
            className={inputClass(errors.title)}
            value={form.title}
            onChange={update('title')}
            maxLength={150}
            placeholder="Why is quicksort O(n²) in the worst case?"
            autoFocus
          />
        </Field>
        <Field label="Details" error={errors.body} hint="What have you tried? Where are you stuck?">
          <textarea
            className={`${inputClass(errors.body)} min-h-40`}
            value={form.body}
            onChange={update('body')}
            maxLength={5000}
          />
        </Field>
        <Field label="Tags" error={errors.tags} hint="Comma separated, up to 5 (e.g. sorting, recursion)">
          <input className={inputClass(errors.tags)} value={form.tags} onChange={update('tags')} />
        </Field>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post doubt'}
        </button>
      </form>

      <SimilarDoubts courseId={courseId} title={form.title} />
    </div>
  );
}

function SimilarDoubts({ courseId, title }) {
  const query = useDebounce(title.trim(), 300);
  const [state, setState] = useState({ loading: false, results: [], error: '' });

  useEffect(() => {
    if (query.length < MIN_SIMILAR_LENGTH) {
      setState({ loading: false, results: [], error: '' });
      return;
    }
    // Aborting on every new query means an old, slow response can never
    // replace the suggestions for what the user has typed since.
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    api
      .get(`/courses/${courseId}/doubts/similar`, { params: { q: query }, signal: controller.signal })
      .then(({ data }) => setState({ loading: false, results: data.similar, error: '' }))
      .catch((err) => {
        if (!isCanceled(err)) setState({ loading: false, results: [], error: err.message });
      });
    return () => controller.abort();
  }, [courseId, query]);

  const { loading, results, error } = state;

  return (
    <aside className="card h-fit space-y-3 md:col-span-2" aria-live="polite">
      <h2 className="font-medium">Similar doubts</h2>
      {query.length < MIN_SIMILAR_LENGTH ? (
        <p className="text-sm text-slate-500">
          Start typing a title and we'll check whether someone already asked it.
        </p>
      ) : loading && results.length === 0 ? (
        <p className="text-sm text-slate-500">Looking for similar doubts…</p>
      ) : error ? (
        <p className="text-sm text-slate-500">Couldn't check for similar doubts. You can still post.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-slate-500">No similar doubts found. Looks like a new one!</p>
      ) : (
        <>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Is your doubt already answered? Check these first. You can still post yours.
          </p>
          <ul className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
            {results.map((d) => (
              <li key={d._id} className="rounded-md border border-slate-200 p-2">
                {/* New tab, so the draft isn't lost. */}
                <Link
                  to={`/doubts/${d._id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-sm font-medium text-slate-900 hover:text-indigo-700"
                >
                  {d.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <StatusBadge status={d.status} />
                  <span>▲ {d.upvoteCount}</span>
                  <span>{Math.round(d.score * 100)}% match</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
