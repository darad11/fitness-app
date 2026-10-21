import { Link, useParams } from 'react-router';
import { latestBefore, useBodyWeights } from '@/modules/body';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { Badge, ButtonLink, Card, PageHeader, Skeleton, StatTile } from '@/shared/ui';
import { estimateCalories } from '../calc/calories';
import { formatSetValues } from '../calc/fields';
import { formatClock } from '../calc/format';
import { compareWithPrevious } from '../calc/history';
import { dayNumber } from '../calc/programProgress';
import { isNewRecord } from '../calc/records';
import { bestSet, liveExercises, sessionProgress, sessionVolume } from '../calc/session';
import { useCompletedSessions, useHistoryRows, useSession } from '../data/useSession';
import { useProgramById } from './useActiveProgram';

/** Zusammenfassung nach dem Beenden (S-09, AK-TRN-19, AK-TRN-20 ohne Vergleich) mit „Trainingstag x von n". */
export function SummaryPage() {
  const { id = '' } = useParams();
  const session = useSession(id);
  const fmt = useFormatters();
  const template = useProgramById(session?.program?.programId)?.program;
  const sessions = useCompletedSessions();
  const rows = useHistoryRows();
  const weights = useBodyWeights();
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
  const number_ =
    session.program && template
      ? dayNumber(template, session.program.weekIndex, session.program.dayIndex)
      : undefined;
  const total = template ? template.weeks.reduce((sum, week) => sum + week.days.length, 0) : 0;
  const subtitle =
    number_ !== undefined
      ? `${session.title} · ${t.programs.dayOf(number_, total)}`
      : session.title;
  const comparison = sessions ? compareWithPrevious(session, sessions) : null;
  const weight = weights ? latestBefore(weights, session.endedAt ?? session.startedAt) : undefined;
  const calories = weights ? estimateCalories(session, weight?.weightKg) : null;
  const signed = (value: number, format: (abs: number) => string) =>
    `${value > 0 ? '+' : value < 0 ? '−' : '±'}${format(Math.abs(value))}`;
  return (
    <>
      <PageHeader eyebrow={t.summary.headline} title={t.summary.title} subtitle={subtitle} />
      <Card tone="stage" eyebrow={t.summary.duration}>
        <p className="text-timer font-semibold tabular-nums">
          {formatClock(session.durationSec ?? 0)}
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <StatTile tone="soft" label={t.summary.exercises} value={fmt.number(exercises.length)} />
          <StatTile tone="soft" label={t.summary.sets} value={fmt.number(progress.done)} />
          <StatTile
            tone="soft"
            label={t.summary.volume}
            value={fmt.number(Math.round(sessionVolume(session)))}
            unit="kg"
          />
        </dl>
        <p className="mt-3 text-xs text-on-ink-muted">{t.summary.volumeHint}</p>
        <p className="mt-3 text-sm text-on-ink-muted">
          <span className="font-semibold text-on-ink">{t.summary.kcal}: </span>
          {calories ? (
            <>
              {t.summary.kcalValue(fmt.number(calories.kcal))} · {t.summary.kcalEstimate}
              {calories.uncountedMinutes > 0
                ? ` · ${t.summary.kcalCardio(calories.uncountedMinutes)}`
                : ''}
            </>
          ) : weights === undefined ? (
            '…'
          ) : (
            <>
              {t.summary.kcalNone}{' '}
              <Link to="/fortschritt/gewicht" className="font-semibold text-on-ink underline">
                {t.summary.kcalAdd}
              </Link>
            </>
          )}
        </p>
      </Card>
      {comparison ? (
        <Card title={t.summary.compareTitle} className="mt-4">
          <p className="mb-3 text-sm text-muted">
            {t.summary.compareText(fmt.dayMonthYear(new Date(comparison.previous.endedAt ?? '')))}
          </p>
          <dl className="grid grid-cols-2 gap-3">
            <StatTile
              tone="plain"
              label={t.summary.compareVolume}
              value={signed(comparison.volumeDiffKg, (abs) => fmt.number(abs))}
              unit="kg"
            />
            <StatTile
              tone="plain"
              label={t.summary.compareSets}
              value={signed(comparison.doneSetsDiff, (abs) => fmt.number(abs))}
            />
          </dl>
        </Card>
      ) : null}
      <Card title={t.summary.best} className="mt-4">
        <ul className="divide-y divide-line">
          {exercises.map((exercise) => {
            const best = bestSet(exercise);
            return (
              <li key={exercise.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {exercise.nameSnapshot}
                  {best &&
                  rows &&
                  isNewRecord(
                    rows,
                    exercise.exerciseId,
                    exercise.trackingMode,
                    best.actual,
                    session.id,
                  ) ? (
                    <Badge tone="success">{t.progress.newRecord}</Badge>
                  ) : null}
                </span>
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
