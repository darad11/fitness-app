import { useEffect, useRef, type ReactNode } from 'react';

export interface ToastProps {
  message: string;
  /** Z. B. „Rückgängig". */
  action?: ReactNode;
  onTimeout: () => void;
  durationMs: number;
}

/** Kurzer Hinweis unten über der Tab-Leiste; verschwindet nach `durationMs`. */
export function Toast({ message, action, onTimeout, durationMs }: ToastProps) {
  // Der Zeitraum läuft ab dem Erscheinen, auch wenn die Seite dazwischen neu zeichnet.
  const timeout = useRef(onTimeout);
  useEffect(() => {
    timeout.current = onTimeout;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      timeout.current();
    }, durationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [durationMs]);
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-card hero-glass glass-blur px-4 py-2 text-on-ink shadow-float lg:bottom-6"
    >
      <p className="flex-1 py-2">{message}</p>
      {action}
    </div>
  );
}
