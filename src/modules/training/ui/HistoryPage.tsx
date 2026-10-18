import { ChevronRight, History } from 'lucide-react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { ButtonLink, EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { formatClock } from '../calc/format';
import { groupByWeek, summarizeSession } from '../calc/history';
import { useCompletedSessions } from '../data/useSession';

/** Datum aus `dayKey` für die Anzeige (lokale Mittagszeit, damit die Zeitzone nicht kippt). */
function dateOf(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00`);
}

/** Verlauf (S-11, AK-HIS-01): abgeschlossene Einheiten, neueste zuerst, nach Woche gruppiert. */
export function HistoryPage() {
  const sessions = useCompletedSessions();
  const fmt = useFormatters();
  return (
    <>
      <PageHeader title={t.history.title} back={{ to: '/training', label: t.training.title }} />
      {sessions === undefined ? (
        <div aria-busy="true" className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title={t.history.emptyTitle}
          text={t.history.emptyText}
          action={<ButtonLink to="/training/programme">{t.history.chooseTemplate}</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6">
          {groupByWeek(sessions).map((group) => (
            <section key={group.weekStart} aria-labelledby={`woche-${group.weekStart}`}>
              <h2 id={`woche-${group.weekStart}`} className="eyebrow mb-2 text-muted">
                {t.history.weekOf(fmt.dayMonthYear(dateOf(group.weekStart)))}
              </h2>
              <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
                {group.items.map((session) => {
                  const summary = summarizeSession(session);
                  return (
                    <li key={session.id}>
                      <Link
                        to={`/training/verlauf/${session.id}`}
                        className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{session.title}</span>
                          <span className="block text-sm text-muted tabular-nums">
                            {fmt.weekdayDayMonth(dateOf(session.dayKey))} ·{' '}
                            {t.history.summary(
                              formatClock(summary.durationSec),
                              t.history.sets(summary.doneSets),
                              fmt.loadKg(summary.volumeKg),
                            )}
                          </span>
                        </span>
                        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
