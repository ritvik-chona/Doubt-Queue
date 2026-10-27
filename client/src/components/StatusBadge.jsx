const STYLES = {
  open: 'bg-sky-50 text-sky-700 ring-sky-200',
  claimed: 'bg-amber-50 text-amber-800 ring-amber-200',
  resolved: 'bg-green-50 text-green-700 ring-green-200',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STYLES[status] ?? ''}`}
    >
      {status}
    </span>
  );
}
