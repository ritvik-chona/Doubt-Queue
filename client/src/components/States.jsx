import { Alert, Inbox } from './Icons.jsx';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent-fg" />
      {label}
    </div>
  );
}

export function Empty({ title, children, action, icon }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center">
      <div className="animate-float mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-raised text-accent-fg shadow-lg shadow-accent/20 ring-1 ring-line">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-semibold text-fg">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong';
  return (
    <div className="rounded-card border border-danger/30 bg-danger/5 px-6 py-12 text-center" role="alert">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <Alert className="h-6 w-6" />
      </div>
      <p className="font-semibold text-red-200">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function CourseGridSkeleton({ count = 4 }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Loading courses">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
          <div className="skeleton h-9 w-full" />
        </li>
      ))}
    </ul>
  );
}

export function DoubtDetailSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading doubt">
      <div className="skeleton h-4 w-28" />
      <div className="card space-y-4 p-6">
        <div className="skeleton h-5 w-40 rounded-full" />
        <div className="skeleton h-7 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-2/3" />
      </div>
      <div className="card flex gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}

// Placeholder cards shaped like DoubtCard, shown while the list loads.
export function DoubtListSkeleton({ count = 4 }) {
  return (
    <ul className="space-y-3" role="status" aria-label="Loading doubts">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card flex gap-4">
          <div className="skeleton h-16 w-11 rounded-full" />
          <div className="flex-1 space-y-3 py-1">
            <div className="flex items-center gap-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-4 w-14 rounded-full" />
            </div>
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/5" />
            <div className="flex gap-2">
              <div className="skeleton h-4 w-14 rounded-full" />
              <div className="skeleton h-4 w-28" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
