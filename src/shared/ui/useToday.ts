import { useEffect, useState } from 'react';

/**
 * Aktuelles Datum, das sich bei Rückkehr in den Vordergrund und jede Minute aktualisiert,
 * damit „Heute" nach Mitternacht nicht den Vortag zeigt.
 */
export function useToday(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return now;
}
