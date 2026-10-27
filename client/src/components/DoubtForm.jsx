import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import { useDebounce } from '../hooks/useDebounce.js';
import Field, { inputClass } from './Field.jsx';
import { ArrowRight, Check, ChevronUp, Sparkles } from './Icons.jsx';
import StatusBadge from './StatusBadge.jsx';
import { CountUp } from './fx/Motion.jsx';

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

// Debounced similar-doubt lookup for the title being typed.
function useSimilarDoubts(courseId, title) {
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

  return { query, ...state };
}

export default function DoubtForm({ courseId, onCreated }) {
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const similar = useSimilarDoubts(courseId, form.title);

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

  const matchCount = similar.query.length >= MIN_SIMILAR_LENGTH ? similar.results.length : 0;
  const tagCount = parseTags(form.tags).length;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={handleSubmit} className="card spotlight space-y-5 p-5 sm:p-6" noValidate>
        {message && <p className="alert-error">{message}</p>}
        <div>
          <Field label="Title" error={errors.title} hint="Summarize your doubt in one line (5–150 characters)">
            <input
              className={`${inputClass(errors.title)} h-12 text-base`}
              value={form.title}
              onChange={update('title')}
              maxLength={150}
              placeholder="Why is quicksort O(n²) in the worst case?"
              autoFocus
            />
          </Field>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            {/* Small pointer to the panel, which sits below the form on narrow screens. */}
            {matchCount > 0 ? (
              <a
                href="#similar-doubts"
                className="inline-flex items-center gap-1.5 rounded font-medium text-claimed lg:pointer-events-none"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {matchCount} similar {matchCount === 1 ? 'doubt' : 'doubts'} found
                <span className="lg:hidden">· see below</span>
              </a>
            ) : (
              <span />
            )}
            <span className="text-subtle tabular-nums">{form.title.length}/150</span>
          </div>
        </div>
        <Field label="Details" error={errors.body} hint="What have you tried? Where are you stuck?">
          <textarea
            className={`${inputClass(errors.body)} min-h-44 leading-relaxed`}
            value={form.body}
            onChange={update('body')}
            maxLength={5000}
            placeholder="Describe the problem, what you expected, and what happened instead."
          />
        </Field>
        <Field
          label="Tags"
          error={errors.tags}
          hint={`Comma separated, up to 5 (e.g. sorting, recursion)${tagCount ? ` · ${tagCount}/5` : ''}`}
        >
          <input
            className={inputClass(errors.tags)}
            value={form.tags}
            onChange={update('tags')}
            placeholder="sorting, recursion"
          />
        </Field>
        {tagCount > 0 && (
          <div className="-mt-2 flex flex-wrap gap-1.5" aria-hidden="true">
            {parseTags(form.tags).map((tag, i) => (
              <span key={`${tag}-${i}`} className="tag">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          <p className="hidden text-xs text-subtle sm:block">Your TA will see this in the course queue.</p>
          <button type="submit" className="btn btn-primary group h-11 px-5" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post doubt'}
            {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
          </button>
        </div>
      </form>

      <SimilarDoubts {...similar} />
    </div>
  );
}

const scoreTone = (score) =>
  score >= 0.6 ? 'from-resolved/80 to-resolved' : score >= 0.4 ? 'from-claimed/80 to-claimed' : 'from-accent to-accent-fg';

function SimilarDoubts({ query, loading, results, error }) {
  const ready = query.length >= MIN_SIMILAR_LENGTH;
  const hasMatches = ready && results.length > 0;

  return (
    <aside
      id="similar-doubts"
      className={`relative scroll-mt-20 overflow-hidden rounded-card border p-5 shadow-card transition-colors lg:sticky lg:top-20 ${
        hasMatches ? 'border-glow border-claimed/20 bg-surface/90 shadow-pop shadow-claimed/10' : 'border-line bg-surface/85'
      }`}
      aria-live="polite"
    >
      {hasMatches && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(20rem_7rem_at_50%_0%,rgb(251_191_36/0.16),transparent_70%)]"
          aria-hidden="true"
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-fg">
            <span
              className={`grid h-7 w-7 place-items-center rounded-lg ${
                hasMatches ? 'bg-claimed/15 text-claimed' : 'bg-accent/15 text-accent-fg'
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            Similar doubts
          </h2>
          {hasMatches && (
            <span className="rounded-full bg-claimed/15 px-2 py-0.5 text-xs font-semibold text-claimed">
              <CountUp value={results.length} /> found
            </span>
          )}
          {ready && loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-accent-fg" />
          )}
        </div>

        <div className="mt-4">
          {!ready ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Start typing a title and we'll check whether someone already asked it.
              </p>
              <div className="flex items-center gap-2" aria-hidden="true">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-accent-fg/60 transition-all"
                    style={{ width: `${Math.min(100, (query.length / MIN_SIMILAR_LENGTH) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-subtle tabular-nums">
                  {Math.min(query.length, MIN_SIMILAR_LENGTH)}/{MIN_SIMILAR_LENGTH}
                </span>
              </div>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="space-y-2" aria-label="Looking for similar doubts">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-control border border-line p-3">
                  <div className="skeleton h-3.5 w-4/5" />
                  <div className="skeleton h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted">Couldn't check for similar doubts. You can still post.</p>
          ) : results.length === 0 ? (
            <p className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-resolved/15 text-resolved">
                <Check className="h-3 w-3" />
              </span>
              No similar doubts found. Looks like a new one!
            </p>
          ) : (
            <>
              <p className="text-sm text-amber-100">
                <span className="font-semibold">Is your doubt already answered?</span> Check these first. You can
                still post yours.
              </p>
              <ul className={`stagger mt-4 space-y-2.5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
                {results.map((d) => {
                  const percent = Math.round(d.score * 100);
                  return (
                    <li key={d._id}>
                      {/* New tab, so the draft isn't lost. */}
                      <Link
                        to={`/doubts/${d._id}`}
                        target="_blank"
                        rel="noopener"
                        className="group block rounded-control border border-line bg-canvas p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-claimed/40 hover:bg-raised hover:shadow-lg hover:shadow-claimed/5"
                      >
                        <span className="block text-sm font-medium text-fg [overflow-wrap:anywhere] group-hover:text-accent-fg">
                          {d.title}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <StatusBadge status={d.status} />
                          <span className="inline-flex items-center gap-0.5">
                            <ChevronUp className="h-3.5 w-3.5" />
                            {d.upvoteCount}
                          </span>
                        </span>
                        <span className="mt-2.5 flex items-center gap-2">
                          <span
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Match"
                          >
                            <span
                              className={`animate-grow block h-full origin-left rounded-full bg-gradient-to-r ${scoreTone(d.score)}`}
                              style={{ width: `${percent}%` }}
                            />
                          </span>
                          <span className="w-16 text-right text-[11px] font-medium text-muted tabular-nums">
                            {percent}% match
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
