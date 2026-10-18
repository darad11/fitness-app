import { useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, PageHeader, Skeleton } from '@/shared/ui';
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
  const stats = [
    { label: t.summary.duration, value: formatClock(session.durationSec ?? 0) },
    { label: t.summary.exercises, value: fmt.number(exercises.length) },
    { label: t.summary.sets, value: fmt.number(sessionProgress(session).done) },
    { label: t.summary.volume, value: fmt.loadKg(Math.round(sessionVolume(session))) },
  ];
  return (
    <>
      <PageHeader title={t.summary.title} subtitle={session.title} />
      <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-line bg-surface p-4">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className="-mt-4 mb-6 text-sm text-muted">{t.summary.volumeHint}</p>
      <Card title={t.summary.best}>
        <ul className="divide-y divide-line">
          {exercises.map((exercise) => {
            const best = bestSet(exercise);
            return (
              <li key={exercise.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{exercise.nameSnapshot}</span>
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
      <ButtonLink to="/training" className="mt-6">
        {t.summary.done}
      </ButtonLink>
    </>
  );
}
