import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ToastProps {
  message: string;
  /** Z. B. „Rückgängig" (leiser Knopf in Lime). */
  action?: ReactNode;
  onTimeout: () => void;
  durationMs: number;
  /** Fehler mit Rand in Rot; sonst ohne Farbe. */
  tone?: 'default' | 'error';
}

/**
 * Kurzer Hinweis unten über der Tab-Leiste; verschwindet nach `durationMs`. Marke FORM (D-314):
 * Fläche `card` mit 1-px-Rand, Schrift `text`, keine Farbe außer bei Fehlern.
 */
export function Toast({ message, action, onTimeout, durationMs, tone = 'default' }: ToastProps) {
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
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-30 mx-auto flex max-w-dialog items-center gap-3 rounded-card bg-surface px-card py-2 text-fg lg:bottom-6',
        tone === 'error' ? 'shadow-[0_0_0_1px_var(--danger)]' : 'shadow-card',
      )}
    >
      <p className="flex-1 py-2">{message}</p>
      {action}
    </div>
  );
}
