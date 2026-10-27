const STYLES = {
  open: { pill: 'bg-open/10 text-open ring-open/30', dot: 'bg-open', live: true },
  claimed: { pill: 'bg-claimed/10 text-claimed ring-claimed/30', dot: 'bg-claimed', live: true },
  resolved: { pill: 'bg-resolved/10 text-resolved ring-resolved/30', dot: 'bg-resolved', live: false },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] ?? { pill: 'bg-raised text-muted ring-line', dot: 'bg-muted', live: false };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style.pill}`}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {/* Slow pulse on statuses that still need attention */}
        {style.live && (
          <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-70 ${style.dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {status}
    </span>
  );
}
