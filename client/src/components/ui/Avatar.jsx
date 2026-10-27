// Initials avatar with a stable color per name.
const TONES = [
  'bg-indigo-500/20 text-indigo-200',
  'bg-emerald-500/20 text-emerald-200',
  'bg-sky-500/20 text-sky-200',
  'bg-amber-500/20 text-amber-200',
  'bg-rose-500/20 text-rose-200',
  'bg-violet-500/20 text-violet-200',
];

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function toneFor(text = '') {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export default function Avatar({ name, size = 'h-8 w-8 text-xs', className = '' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-white/10 ${size} ${toneFor(name)} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
