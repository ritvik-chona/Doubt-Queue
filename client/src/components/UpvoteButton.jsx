import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { ChevronUp } from './Icons.jsx';

// Optimistic toggle: flips immediately, then settles on the server's answer
// (or rolls back on error). Follows fresh props from polling when idle.
export default function UpvoteButton({ doubtId, upvoted, count, disabled, disabledReason }) {
  const [state, setState] = useState({ upvoted, count });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  // Bumped on each click to replay the pop (and the burst when upvoting).
  const [pop, setPop] = useState({ id: 0, burst: false });

  useEffect(() => {
    if (!pending) setState({ upvoted, count });
    // Only re-sync when the server data changes, not when pending flips.
  }, [upvoted, count]);

  async function toggle() {
    const before = state;
    setState({ upvoted: !before.upvoted, count: before.count + (before.upvoted ? -1 : 1) });
    setPop((p) => ({ id: p.id + 1, burst: !before.upvoted }));
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
    <div className="flex shrink-0 flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || pending}
        title={disabled ? disabledReason : active ? 'Remove upvote' : 'Upvote'}
        aria-pressed={active}
        aria-label={`${active ? 'Remove upvote' : 'Upvote'} (${state.count} ${state.count === 1 ? 'vote' : 'votes'})`}
        className={`relative flex w-11 flex-col items-center gap-0.5 rounded-full border py-2 text-sm transition-all duration-200 ${
          active
            ? 'border-accent-fg/50 bg-accent/20 text-accent-fg shadow-md shadow-accent/40'
            : 'border-line bg-canvas text-muted'
        } ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : active
              ? 'hover:bg-accent/30'
              : 'hover:-translate-y-0.5 hover:border-accent-fg/40 hover:bg-raised hover:text-fg'
        } ${pending ? 'cursor-wait' : ''}`}
      >
        <ChevronUp
          key={`icon-${pop.id}`}
          className={`h-4 w-4 transition-transform ${pop.id ? 'animate-pop' : ''} ${active ? '' : 'group-hover:-translate-y-0.5'}`}
        />
        <span key={`count-${pop.id}`} className={`text-sm font-semibold tabular-nums ${pop.id ? 'animate-pop' : ''}`}>
          {state.count}
        </span>
        {pop.burst && (
          <span key={`burst-${pop.id}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <span key={angle} className="burst-dot" style={{ '--a': `${angle}deg` }} />
            ))}
          </span>
        )}
      </button>
      {error && <span className="mt-1 max-w-20 text-center text-[11px] text-danger">{error}</span>}
    </div>
  );
}
