import { useEffect, useState } from 'react';
import { Check, ChevronUp, Sparkles } from '../Icons.jsx';
import StatusBadge from '../StatusBadge.jsx';

// Decorative, self-running mock of the product for the auth brand panel:
// votes tick up and one doubt walks through open → claimed → resolved.
// It tilts toward the cursor. No real data and no API calls.
const CYCLE = ['open', 'claimed', 'resolved'];
const CYCLE_META = { open: 'asked 2h ago', claimed: 'claimed by Rahul', resolved: 'resolved by Rahul' };

function Row({ votes, title, status, meta, upvoted, bumped }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/90 p-3 transition-colors duration-500">
      <div
        className={`flex w-9 shrink-0 flex-col items-center rounded-full border py-1.5 text-xs font-semibold transition-colors ${
          upvoted ? 'border-accent-fg/50 bg-accent/20 text-accent-fg shadow-md shadow-accent/30' : 'border-line bg-canvas text-muted'
        }`}
      >
        <ChevronUp className="h-3.5 w-3.5" />
        <span key={votes} className={bumped ? 'animate-pop' : ''}>
          {votes}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        <p key={meta} className="animate-fade-up mt-0.5 text-xs text-subtle">
          {meta}
        </p>
      </div>
      <span key={status} className="animate-fade-up">
        <StatusBadge status={status} />
      </span>
    </div>
  );
}

export default function ProductPreview() {
  const [tick, setTick] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(timer);
  }, []);

  const cycled = CYCLE[tick % CYCLE.length];
  const rows = [
    { votes: 24 + tick, title: 'Why is quicksort O(n²) in the worst case?', status: 'resolved', meta: 'resolved by Priya', upvoted: true, bumped: tick > 0 },
    { votes: 17 + Math.floor(tick / 2), title: 'Dijkstra breaks with negative edges', status: 'claimed', meta: 'claimed by Priya', bumped: tick > 0 && tick % 2 === 0 },
    { votes: 9, title: 'Hash map vs balanced BST?', status: cycled, meta: CYCLE_META[cycled] },
  ];

  function handleMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 10, y: px * 12 });
  }

  return (
    <div
      className="relative mx-auto w-full max-w-md pb-24 [perspective:1200px]"
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      aria-hidden="true"
    >
      <div
        className="transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* Main queue window */}
        <div className="animate-float rounded-2xl border border-line-strong/70 bg-canvas/80 p-3 shadow-pop shadow-accent/10 backdrop-blur">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[11px] text-subtle">CS201 · Top voted</span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-resolved">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-resolved opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-resolved" />
              </span>
              Live
            </span>
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <Row key={row.title} {...row} />
            ))}
          </div>
        </div>

        {/* Floating duplicate-detection callout */}
        <div className="animate-float-slow absolute bottom-0 -left-6 w-60 rounded-xl border border-claimed/30 bg-surface/95 p-3 shadow-pop backdrop-blur [animation-delay:-3s] [transform:translateZ(40px)]">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-claimed">
            <Sparkles className="h-3.5 w-3.5" />
            Similar doubt found
          </p>
          <p className="mt-1 truncate text-xs text-fg">Worst case of quick sort</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
              <div className="animate-grow h-full w-[82%] origin-left rounded-full bg-gradient-to-r from-claimed to-resolved" />
            </div>
            <span className="text-[11px] font-medium text-muted">82%</span>
          </div>
        </div>

        {/* Floating claim toast */}
        <div className="animate-float-slow absolute -top-5 -right-4 flex items-center gap-2 rounded-full border border-resolved/30 bg-surface/95 px-3 py-1.5 text-xs text-fg shadow-pop backdrop-blur [transform:translateZ(60px)]">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-resolved/20 text-resolved">
            <Check className="h-3 w-3" />
          </span>
          Claimed by you
        </div>
      </div>
    </div>
  );
}
