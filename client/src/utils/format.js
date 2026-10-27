const UNITS = [
  ['y', 365 * 24 * 3600],
  ['mo', 30 * 24 * 3600],
  ['w', 7 * 24 * 3600],
  ['d', 24 * 3600],
  ['h', 3600],
  ['m', 60],
];

// Compact relative time: "just now", "5m ago", "2h ago", "3d ago".
export function timeAgo(date) {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  }
  return 'just now';
}

// Full date for tooltips on relative timestamps.
export const fullDate = (date) =>
  new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
