import { useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, PageHeader, Skeleton, StatTile } from '@/shared/ui';
import { formatSetValues } from '../calc/fields';
import { formatClock } from '../calc/format';
import { bestSet, liveExercises, sessionProgress, sessionVolume } from '../calc/session';
import { useSession } from '../data/useSession';

/** Zusammenfassung nach dem Beenden (S-09, AK-TRN-19, AK-TRN-20 ohne Vergleich). */
export function SummaryPage() {
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
        <PageHeader title={t.summary.title} />
        <p className="mb-6 text-muted">{t.session.notFound}</p>
        <ButtonLink to="/training">{t.training.title}</ButtonLink>
      </>
    );
  }
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });
  const exercises = liveExercises(session);
  const progress = sessionProgress(session);
  return (
    <>
      <PageHeader eyebrow={t.summary.headline} title={t.summary.title} subtitle={session.title} />
      <Card tone="ink" eyebrow={t.summary.duration}>
        <p className="text-timer font-bold tabular-nums">{formatClock(session.durationSec ?? 0)}</p>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <StatTile tone="ink" label={t.summary.exercises} value={fmt.number(exercises.length)} />
          <StatTile tone="ink" label={t.summary.sets} value={fmt.number(progress.done)} />
          <StatTile
            tone="ink"
            label={t.summary.volume}
            value={fmt.number(Math.round(sessionVolume(session)))}
            unit="kg"
          />
        </dl>
        <p className="mt-3 text-xs text-on-ink-muted">{t.summary.volumeHint}</p>
      </Card>
      <Card title={t.summary.best} className="mt-4">
        <ul className="divide-y divide-line">
          {exercises.map((exercise) => {
            const best = bestSet(exercise);
            return (
              <li key={exercise.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span className="font-medium">{exercise.nameSnapshot}</span>
                <span className="text-muted tabular-nums">
                  {best
                    ? formatSetValues(
                        best.actual,
                        exercise.trackingMode,
                        exercise.distanceUnit,
                        number,
                      )
                    : t.summary.noBest}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <ButtonLink to="/training" className="mt-6 w-full md:w-auto">
        {t.summary.done}
      </ButtonLink>
    </>
  );
}
