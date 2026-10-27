import { useEffect, useRef, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animates a number toward `target` (ease-out). Starts from 0 on first render.
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reducedMotion()) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function CountUp({ value }) {
  return <span className="tabular-nums">{useCountUp(value)}</span>;
}

// Cycles through words with a blur/slide-in. Screen readers get the first word only.
export function RotatingWords({ words, interval = 2400, className = '' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <>
      <span className="sr-only">{words[0]}</span>
      <span className="relative inline-grid overflow-hidden align-bottom" aria-hidden="true">
        <span className="invisible col-start-1 row-start-1">{longest}</span>
        <span key={index} className={`animate-word-in col-start-1 row-start-1 ${className}`}>
          {words[index]}
        </span>
      </span>
    </>
  );
}
