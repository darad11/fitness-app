import { lazy, Suspense, useState } from 'react';
import { useParams } from 'react-router';
import { useExercises, type Exercise } from '@/modules/exercises';
import { useFormatters } from '@/modules/settings';
import { formatSetValues, useHistoryRows } from '@/modules/training';
import { META_KEYS, useMetaFlag } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, PageHeader, SegmentedControl, Skeleton, Switch } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import {
  EXERCISE_PERIODS,
  exerciseSeries,
  type ExerciseMetric,
  type ExercisePeriod,
} from '../calc/stats';

const ExerciseChart = lazy(async () => ({
  default: (await import('./ExerciseChart')).ExerciseChart,
}));

const PERIOD_OPTIONS = EXERCISE_PERIODS.map((value) => ({
  value,
  label: t.progress.exercise.periods[value],
}));

/** Übungsverlauf (C-02, AK-HIS-05): bester Satz oder geschätztes 1RM je Einheit auf einer Zeitachse. */
export function ExerciseProgressPage() {
  const { exerciseId } = useParams();
  const exercises = useExercises();
  if (exercises === undefined) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-64" />
      </div>
    );
  }
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) return <ExerciseNotFound back="/fortschritt" />;
  return <ExerciseProgress key={exercise.id} exercise={exercise} />;
}

/** „Übung nicht gefunden“ mit Weg zurück; auch für das Übungsdetail. */
export function ExerciseNotFound({ back }: { back: string }) {
  return (
    <>
      <PageHeader title={t.exercises.notFoundTitle} back={{ to: back, label: t.common.back }} />
      <p className="mb-6 text-muted">{t.exercises.notFoundText}</p>
      <ButtonLink to="/uebungen">{t.exercises.toLibrary}</ButtonLink>
    </>
  );
}

function ExerciseProgress({ exercise }: { exercise: Exercise }) {
  const rows = useHistoryRows();
  const fmt = useFormatters();
  const now = useToday();
  const [metric, setMetric] = useState<ExerciseMetric>('best');
  const [period, setPeriod] = useState<ExercisePeriod>('1y');
  const [table, setTable] = useMetaFlag(META_KEYS.exerciseTable);
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });
  const canOrm = exercise.trackingMode === 'weight_reps';
  const points = rows
    ? exerciseSeries(rows, exercise.id, canOrm ? metric : 'best', period, now)
    : [];
  const unit =
    exercise.trackingMode === 'reps'
      ? t.session.units.reps
      : exercise.trackingMode === 'time'
        ? 's'
        : exercise.trackingMode === 'time_distance'
          ? 'm'
          : 'kg';
  const formatValue = (value: number) => `${number(value)} ${unit}`;
  const metricLabel =
    metric === 'orm' && canOrm ? t.progress.exercise.orm : t.progress.exercise.best;

  return (
    <>
      <PageHeader
        eyebrow={t.progress.exercisesTitle}
        title={exercise.name}
        back={{ to: '/fortschritt', label: t.progress.title }}
      />
      {rows === undefined ? (
        <div aria-busy="true">
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid gap-4">
          <Card title={metricLabel}>
            <div className="mb-3 grid gap-3">
              {canOrm ? (
                <SegmentedControl
                  legend={t.progress.exercise.metricLegend}
                  options={[
                    { value: 'best', label: t.progress.exercise.best },
                    { value: 'orm', label: t.progress.exercise.orm },
                  ]}
                  value={metric}
                  onChange={setMetric}
                  hint={metric === 'orm' ? t.progress.exercise.ormHint : undefined}
                />
              ) : null}
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <SegmentedControl
                  legend={t.progress.periodLegend}
                  options={PERIOD_OPTIONS}
                  value={period}
                  onChange={setPeriod}
                />
                <Switch label={t.progress.exercise.asTable} checked={table} onChange={setTable} />
              </div>
            </div>
            {points.length === 0 ? (
              <p className="text-muted">{t.progress.exercise.none}</p>
            ) : table || points.length < 3 ? (
              <>
                {points.length < 3 ? (
                  <p className="mb-2 text-sm text-muted">{t.progress.exercise.tooFew}</p>
                ) : null}
                <table className="w-full text-sm">
                  <caption className="sr-only">{metricLabel}</caption>
                  <thead className="text-left text-muted">
                    <tr>
                      <th scope="col" className="py-1 font-medium">
                        {t.progress.exercise.colDate}
                      </th>
                      <th scope="col" className="py-1 text-right font-medium">
                        {t.progress.exercise.colValue}
                      </th>
                      <th scope="col" className="py-1 text-right font-medium">
                        {t.progress.exercise.colSet}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {[...points].reverse().map((point) => (
                      <tr key={point.row.id} className="border-t border-line">
                        <td className="py-1.5">{fmt.dayMonthYear(new Date(point.time))}</td>
                        <td className="py-1.5 text-right">{formatValue(point.value)}</td>
                        <td className="py-1.5 text-right">
                          {point.row.best
                            ? formatSetValues(
                                point.row.best,
                                point.row.trackingMode,
                                undefined,
                                number,
                              )
                            : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <Suspense fallback={<Skeleton className="h-60" />}>
                <ExerciseChart
                  points={points}
                  name={exercise.name}
                  metricLabel={metricLabel}
                  formatValue={formatValue}
                  formatAxis={number}
                  formatSet={(row) =>
                    row.best ? formatSetValues(row.best, row.trackingMode, undefined, number) : ''
                  }
                />
              </Suspense>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
