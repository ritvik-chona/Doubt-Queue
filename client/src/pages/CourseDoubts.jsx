import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import DoubtCard from '../components/DoubtCard.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePolling } from '../hooks/usePolling.js';

const PAGE_SIZE = 10;
const POLL_MS = 15000;
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'resolved', label: 'Resolved' },
];
const DEFAULTS = { search: '', status: '', sort: 'votes', page: '1' };

export default function CourseDoubts() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [courseError, setCourseError] = useState(null);

  // Filters live in the URL so back/forward and refresh keep them.
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const sort = params.get('sort') === 'new' ? 'new' : 'votes';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const updateParams = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || String(value) === DEFAULTS[key]) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  // The search box writes to the URL 300 ms after typing stops. lastSearch stops
  // a stale debounced value from overwriting a search that was just cleared.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput.trim(), 300);
  const lastSearch = useRef(search);
  useEffect(() => {
    if (debouncedSearch === lastSearch.current) return;
    lastSearch.current = debouncedSearch;
    updateParams({ search: debouncedSearch, page: undefined });
  }, [debouncedSearch, updateParams]);

  function clearFilters() {
    setSearchInput('');
    lastSearch.current = '';
    updateParams({ search: undefined, status: undefined, page: undefined });
  }

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(null);

  const loadCourse = useCallback(async () => {
    setCourseError(null);
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.course);
    } catch (err) {
      setCourseError(err);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Each fetch aborts the previous one, so a slow old response can't
  // overwrite the results for the filters the user just picked.
  const loadDoubts = useCallback(
    async ({ silent = false } = {}) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      if (!silent) setLoading(true);

      try {
        const { data } = await api.get(`/courses/${id}/doubts`, {
          params: { search: search || undefined, status: status || undefined, sort, page, limit: PAGE_SIZE },
          signal: controller.signal,
        });
        setResult(data);
        setError(null);
      } catch (err) {
        if (isCanceled(err)) return;
        if (!silent) setError(err);
      } finally {
        if (inFlight.current === controller) setLoading(false);
      }
    },
    [id, search, status, sort, page]
  );

  useEffect(() => {
    loadDoubts();
    return () => inFlight.current?.abort();
  }, [loadDoubts]);

  usePolling(() => loadDoubts({ silent: true }), POLL_MS, !error && !courseError);

  if (courseError) return <ErrorState error={courseError} onRetry={loadCourse} />;
  if (!course) return <Loading label="Loading course…" />;

  const filtersActive = Boolean(search || status);
  const doubts = result?.doubts ?? [];

  let list;
  if (error) list = <ErrorState error={error} onRetry={() => loadDoubts()} />;
  else if (loading && !result) list = <Loading label="Loading doubts…" />;
  else if (doubts.length === 0)
    list = filtersActive ? (
      <Empty
        title="No doubts match your filters"
        action={
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear filters
          </button>
        }
      >
        Try a different search term or status.
      </Empty>
    ) : (
      <Empty
        title="No doubts yet"
        action={
          <Link to={`/courses/${id}/new`} className="btn btn-primary">
            Ask the first doubt
          </Link>
        }
      >
        Questions posted in this course will show up here.
      </Empty>
    );
  else
    list = (
      <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {doubts.map((doubt) => (
          <DoubtCard key={doubt._id} doubt={doubt} currentUserId={user._id} />
        ))}
      </ul>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/courses" className="text-sm text-slate-500 hover:text-indigo-700">
            ← All courses
          </Link>
          <h1 className="text-2xl font-semibold">{course.name}</h1>
          <p className="text-sm text-slate-500">
            {course.code} · TA: {course.owner.name}
          </p>
        </div>
        <Link to={`/courses/${id}/new`} className="btn btn-primary">
          Ask a doubt
        </Link>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-3">
        <input
          type="search"
          className="input min-w-48 flex-1"
          placeholder="Search doubts…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search doubts"
        />
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: undefined })}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-md border border-slate-300 p-0.5" role="group" aria-label="Sort">
          {[
            ['votes', 'Top voted'],
            ['new', 'Newest'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateParams({ sort: value, page: undefined })}
              aria-pressed={sort === value}
              className={`rounded px-3 py-1.5 text-sm ${
                sort === value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {list}

      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => updateParams({ page: page - 1 })}
          >
            ← Previous
          </button>
          <span className="text-slate-600">
            Page {result.page} of {result.totalPages} · {result.total} doubts
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= result.totalPages || loading}
            onClick={() => updateParams({ page: page + 1 })}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
