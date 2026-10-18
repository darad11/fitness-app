import { useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { ButtonLink, Card, PageHeader, Skeleton, StatTile } from '@/shared/ui';
import { formatSetValues } from '../calc/fields';
import { formatClock } from '../calc/format';
import { summarizeSession } from '../calc/history';
import { liveExercises, liveSets } from '../calc/session';
import { useSession } from '../data/useSession';

/** Detail einer abgeschlossenen Einheit (S-11, AK-HIS-02): alle Übungen und Sätze mit Status. */
export function HistoryDetailPage() {
  const { id = '' } = useParams();
  const session = useSession(id);
  const fmt = useFormatters();
  if (session === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (session?.status !== 'completed') {
    return (
      <>
        <PageHeader
          title={t.history.title}
          back={{ to: '/training/verlauf', label: t.history.title }}
        />
        <p className="mb-6 text-muted">{t.history.notFound}</p>
        <ButtonLink to="/training/verlauf">{t.history.title}</ButtonLink>
      </>
    );
  }
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });
  const summary = summarizeSession(session);
  const ended = new Date(session.endedAt ?? session.startedAt);
  return (
    <>
      <PageHeader
        eyebrow={session.activity ? t.log.activityEyebrow : t.history.detailEyebrow}
        title={session.title}
        subtitle={`${fmt.weekdayDayMonth(ended)} · ${fmt.time(ended)}${session.source === 'manual' ? ` · ${t.log.manualBadge}` : ''}`}
        back={{ to: '/training/verlauf', label: t.history.title }}
      />
      {session.activity ? (
        <dl className="mb-4 grid grid-cols-2 gap-3">
          <StatTile label={t.summary.duration} value={formatClock(summary.durationSec)} />
          <StatTile
            label={t.log.distance}
            value={
              session.activity.distanceM === undefined
                ? '–'
                : fmt.number(session.activity.distanceM / 1000, { maximumFractionDigits: 2 })
            }
            unit={session.activity.distanceM === undefined ? undefined : 'km'}
          />
        </dl>
      ) : (
        <dl className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label={t.summary.duration} value={formatClock(summary.durationSec)} />
          <StatTile label={t.summary.exercises} value={fmt.number(summary.exercises)} />
          <StatTile label={t.summary.sets} value={fmt.number(summary.doneSets)} />
          <StatTile label={t.summary.volume} value={fmt.number(summary.volumeKg)} unit="kg" />
        </dl>
      )}
      {session.notes ? (
        <Card title={t.history.notes} className="mb-4">
          <p className="whitespace-pre-line">{session.notes}</p>
        </Card>
      ) : null}
      <div className="grid gap-4">
        {liveExercises(session).map((exercise) => {
          let working = 0;
          let warmup = 0;
          let drop = 0;
          return (
            <Card key={exercise.id} title={exercise.nameSnapshot}>
              {exercise.notes ? (
                <p className="-mt-2 mb-3 text-sm text-muted">{exercise.notes}</p>
              ) : null}
              <ol className="divide-y divide-line">
                {liveSets(exercise).map((set) => {
                  const ordinal =
                    set.type === 'working' ? ++working : set.type === 'warmup' ? ++warmup : ++drop;
                  const name = t.session.setLabel(t.session.setTypeLabel[set.type], ordinal);
                  return (
                    <li
                      key={set.id}
                      className={cn(
                        'flex items-center gap-3 py-2',
                        set.type === 'drop' && 'pl-6',
                        set.status !== 'done' && 'text-muted',
                      )}
                    >
                      <span className="min-w-0 flex-1">{name}</span>
                      <span className="tabular-nums">
                        {set.status === 'done'
                          ? formatSetValues(
                              set.actual,
                              exercise.trackingMode,
                              exercise.distanceUnit,
                              number,
                            )
                          : t.history.noValues}
                      </span>
                      <span
                        className={cn(
                          'w-24 shrink-0 text-right text-xs font-semibold',
                          set.status === 'done' ? 'text-success' : 'text-muted',
                        )}
                      >
                        {t.history.status[set.status]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          );
        })}
      </div>
    </>
  );
}
