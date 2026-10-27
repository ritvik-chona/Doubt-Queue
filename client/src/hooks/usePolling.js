import { useEffect, useRef } from 'react';

// Calls callback every intervalMs while the tab is visible. Pauses when hidden
// and refreshes immediately when the user comes back.
export function usePolling(callback, intervalMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    let timer;
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => saved.current(), intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        saved.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}
