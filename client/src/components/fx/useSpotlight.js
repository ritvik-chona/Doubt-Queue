import { useEffect } from 'react';

// One pointer listener for the whole app: publishes the cursor position as
// --cursor-x/--cursor-y on <html> (used by LiveBackground) and, for every
// .spotlight element near the cursor, its local --mx/--my (used by the card glow).
export function useSpotlight() {
  useEffect(() => {
    let frame = 0;
    let x = 0;
    let y = 0;

    function update() {
      frame = 0;
      const root = document.documentElement.style;
      root.setProperty('--cursor-x', `${x}px`);
      root.setProperty('--cursor-y', `${y}px`);
      for (const el of document.querySelectorAll('.spotlight')) {
        const r = el.getBoundingClientRect();
        if (x < r.left - 300 || x > r.right + 300 || y < r.top - 300 || y > r.bottom + 300) continue;
        el.style.setProperty('--mx', `${x - r.left}px`);
        el.style.setProperty('--my', `${y - r.top}px`);
      }
    }

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}
