import { useEffect, useState } from 'react';

/**
 * Aktuelles Datum, das sich bei Rückkehr in den Vordergrund und jede Minute aktualisiert,
 * damit „Heute" nach Mitternacht nicht den Vortag zeigt. Für laufende Dauern kürzeres Intervall.
 */
export function useToday(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
  return now;
}
