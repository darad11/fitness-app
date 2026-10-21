import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { requestPersistentStorage } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { buttonClasses } from '@/shared/ui';
import { formatClock } from '../calc/format';
import { sessionDurationSec, sessionProgress } from '../calc/session';
import { useActiveSession } from '../data/useSession';

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);
  return now;
}

/** Seiten, auf denen die laufende Einheit selbst zu sehen ist oder eine eigene Karte hat. */
function hiddenOn(pathname: string, sessionId: string): boolean {
  return (
    pathname.startsWith(`/training/einheit/${sessionId}`) ||
    pathname === '/heute' ||
    pathname === '/training'
  );
}

/**
 * Leiste „Training läuft" auf allen Seiten (S-46, AK-TRN-17, TS-25): Titel, Dauer, Fortschritt und
 * Rücksprung in den Player. Mit dem ersten gespeicherten Training wird dauerhafter Speicher
 * angefordert (AK-PWA-05).
 */
export function SessionBanner() {
  const active = useActiveSession();
  const { pathname } = useLocation();
  const now = useNow(1000);
  useEffect(() => {
    if (active) void requestPersistentStorage();
  }, [active]);
  if (!active || hiddenOn(pathname, active.id)) return null;
  const progress = sessionProgress(active);
  return (
    <div role="status" className="border-b border-line bg-elevated text-fg">
      <div className="page-gutters mx-auto flex max-w-content items-center gap-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-on-ink-muted">{t.training.running}</p>
          <p className="truncate text-sm font-semibold tabular-nums">
            {active.title} · {formatClock(sessionDurationSec(active, now))} ·{' '}
            {t.session.progress(progress.done, progress.total)}
          </p>
        </div>
        <Link
          to={`/training/einheit/${active.id}`}
          className={buttonClasses('primary', 'sm', 'shrink-0')}
        >
          <Play aria-hidden="true" className="size-4" />
          {t.training.resume}
        </Link>
      </div>
    </div>
  );
}
