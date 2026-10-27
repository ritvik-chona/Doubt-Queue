import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import DoubtCard from '../components/DoubtCard.jsx';
import { ArrowLeft, Plus, Search } from '../components/Icons.jsx';
import { DoubtListSkeleton, Empty, ErrorState } from '../components/States.jsx';
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
  if (!course)
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-7 w-64 max-w-full" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="skeleton h-14 w-full rounded-card" />
        <DoubtListSkeleton />
      </div>
    );

  const filtersActive = Boolean(search || status);
  const doubts = result?.doubts ?? [];

  let list;
  if (error) list = <ErrorState error={error} onRetry={() => loadDoubts()} />;
  else if (loading && !result) list = <DoubtListSkeleton />;
  else if (doubts.length === 0)
    list = filtersActive ? (
      <Empty
        title="No doubts match your filters"
        icon={<Search className="h-6 w-6" />}
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
            <Plus />
            Ask the first doubt
          </Link>
        }
      >
        Questions posted in this course will show up here.
      </Empty>
    );
  else
    list = (
      <ul className={`stagger space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {doubts.map((doubt) => (
          <DoubtCard key={doubt._id} doubt={doubt} currentUserId={user._id} />
        ))}
      </ul>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-accent-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All courses
          </Link>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
            {course.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="chip">{course.code}</span>
            <span>TA: {course.owner.name}</span>
            {result && (
              <span className="text-subtle">
                · {result.total} {result.total === 1 ? 'doubt' : 'doubts'}
              </span>
            )}
          </p>
        </div>
        <Link to={`/courses/${id}/new`} className="btn btn-primary">
          <Plus />
          Ask a doubt
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-2 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search doubts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search doubts"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="input min-w-0 flex-1 sm:w-40 sm:flex-none"
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
          <div
            className="inline-flex shrink-0 rounded-control border border-line bg-canvas p-0.5"
            role="group"
            aria-label="Sort"
          >
            {[
              ['votes', 'Top voted'],
              ['new', 'Newest'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateParams({ sort: value, page: undefined })}
                aria-pressed={sort === value}
                className={`rounded-[calc(var(--radius-control)-2px)] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  sort === value ? 'bg-raised text-fg shadow-sm ring-1 ring-line-strong' : 'text-muted hover:text-fg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {list}

      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => updateParams({ page: page - 1 })}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sr-only sm:hidden">Previous page</span>
          </button>
          <span className="text-center text-muted">
            Page <span className="font-medium text-fg">{result.page}</span> of {result.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= result.totalPages || loading}
            onClick={() => updateParams({ page: page + 1 })}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next page</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </button>
        </nav>
      )}
    </div>
  );
}
