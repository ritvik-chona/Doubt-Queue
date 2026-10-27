import { useEffect, useState } from 'react';
import api from '../api/client.js';

// Optimistic toggle: flips immediately, then settles on the server's answer
// (or rolls back on error). Follows fresh props from polling when idle.
export default function UpvoteButton({ doubtId, upvoted, count, disabled, disabledReason }) {
  const [state, setState] = useState({ upvoted, count });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pending) setState({ upvoted, count });
    // Only re-sync when the server data changes, not when pending flips.
  }, [upvoted, count]);

  async function toggle() {
    const before = state;
    setState({ upvoted: !before.upvoted, count: before.count + (before.upvoted ? -1 : 1) });
    setPending(true);
    setError('');
    try {
      const { data } = await api.post(`/doubts/${doubtId}/upvote`);
      setState({ upvoted: data.upvoted, count: data.upvoteCount });
    } catch (err) {
      setState(before);
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  const active = state.upvoted;
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || pending}
        title={disabled ? disabledReason : active ? 'Remove upvote' : 'Upvote'}
        aria-pressed={active}
        className={`flex w-12 flex-col items-center rounded-md border px-2 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          active
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span aria-hidden>▲</span>
        <span className="font-semibold">{state.count}</span>
      </button>
      {error && <span className="mt-1 max-w-20 text-center text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
