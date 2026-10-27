import { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Check } from '../Icons.jsx';

const ToastContext = createContext(() => {});

const STYLES = {
  success: { ring: 'border-resolved/30', icon: 'bg-resolved/15 text-resolved', Icon: Check },
  error: { ring: 'border-danger/40', icon: 'bg-danger/15 text-danger', Icon: Alert },
};

// toast('Saved') or toast('Failed', { type: 'error' }). Auto-dismisses; max 3 on screen.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message, { type = 'success', duration = 4000 } = {}) => {
      const id = crypto.randomUUID();
      setToasts((all) => [...all.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map(({ id, message, type }) => {
          const style = STYLES[type] ?? STYLES.success;
          return (
            <div
              key={id}
              className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-card border bg-surface/95 px-4 py-3 text-sm text-fg shadow-pop backdrop-blur ${style.ring}`}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${style.icon}`}>
                <style.Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">{message}</span>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded px-1 text-subtle hover:text-fg"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
