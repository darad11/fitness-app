import { ChevronRight, LineChart, Scale, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  changeInPeriod,
  inPeriod,
  latestBefore,
  recentValues,
  Sparkline,
  useBodyWeights,
} from '@/modules/body';
import { useExercises } from '@/modules/exercises';
import { useFormatters } from '@/modules/settings';
import {
  estimateCalories,
  formatSetValues,
  summarizeSession,
  useCompletedSessions,
  useHistoryRows,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Skeleton,
  StatTile,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import {
  bestRecords,
  frequentExercises,
  STAT_PERIODS,
  totalsFor,
  type StatPeriod,
} from '../calc/stats';

const PERIOD_OPTIONS = STAT_PERIODS.map((value) => ({ value, label: t.progress.periods[value] }));

/** Fortschritt (S-27): Kennzahlen mit Zeitraum, Körpergewicht, Bestleistungen, Übungsverläufe. */
export function ProgressPage() {
  const library = useExercises();
  const fmt = useFormatters();
  const now = useToday();
  const sessions = useCompletedSessions();
  const rows = useHistoryRows();
  const weights = useBodyWeights();
  const [period, setPeriod] = useState<StatPeriod>('month');
  const names = useMemo(() => new Map((library ?? []).map((e) => [e.id, e.name])), [library]);
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });

  if (
    sessions === undefined ||
    rows === undefined ||
    weights === undefined ||
    library === undefined
  ) {
    return (
      <>
        <PageHeader title={t.progress.title} />
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </>
    );
  }

  const totals = totalsFor(
    sessions,
    period,
    now,
    (session) => summarizeSession(session).volumeKg,
    (session) =>
      session.kind === 'activity'
        ? undefined
        : (estimateCalories(
            session,
            latestBefore(weights, session.endedAt ?? session.startedAt)?.weightKg,
          )?.kcal ?? null),
    fmt.timeZone,
  );
  const latestWeight = weights[0];
  const weightChange = changeInPeriod(inPeriod(weights, '30d', now));
  const sparkValues = recentValues(weights);
  const records = bestRecords(rows).slice(0, 8);
  const frequent = frequentExercises(rows).slice(0, 10);
  const weightText = latestWeight ? fmt.bodyWeightKg(latestWeight.weightKg) : null;
  const changeText =
    weightChange === null
      ? null
      : `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : ''}${fmt.bodyWeightKg(Math.abs(weightChange))}`;

  return (
    <>
      <PageHeader title={t.progress.title} />
      {sessions.length === 0 && weights.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title={t.progress.emptyTitle}
          text={t.progress.emptyText}
          action={
            <ButtonLink to="/fortschritt/gewicht" variant="secondary">
              {t.body.add}
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-stack">
          <section aria-labelledby="kennzahlen">
            <h2 id="kennzahlen" className="sr-only">
              {t.progress.periodLegend}
            </h2>
            <SegmentedControl
              row
              legend={t.progress.periodLegend}
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
            />
            {/* Zeitraum ohne Training: „Pause“ statt Nullwerten (D-319). */}
            {totals.sessions === 0 ? (
              <dl className="mt-3">
                <StatTile label={t.progress.sessions} value={t.progress.pause} />
              </dl>
            ) : (
              <dl className="mt-3 grid grid-cols-2 gap-stack md:grid-cols-4">
                <StatTile label={t.progress.sessions} value={fmt.number(totals.sessions)} />
                <StatTile
                  label={t.progress.minutes}
                  value={fmt.number(totals.minutes)}
                  unit="min"
                />
                <StatTile label={t.progress.volume} value={fmt.number(totals.volumeKg)} unit="kg" />
                <StatTile
                  label={t.progress.kcal}
                  value={totals.kcal === null ? '–' : fmt.number(totals.kcal)}
                  unit={totals.kcal === null ? undefined : 'kcal'}
                  hint={
                    totals.kcal === null
                      ? totals.sessions > 0
                        ? t.progress.kcalNone
                        : undefined
                      : totals.withoutKcal > 0
                        ? t.progress.kcalPartial(totals.withoutKcal)
                        : t.progress.kcalHint
                  }
                />
              </dl>
            )}
          </section>

          <Card
            title={t.progress.weightTitle}
            action={
              // Ohne Gewicht genügt der Knopf „Gewicht erfassen“ in der Karte.
              latestWeight ? (
                <Link
                  to="/fortschritt/gewicht"
                  aria-label={t.progress.weightOpen}
                  className="inline-flex min-h-11 items-center gap-1 font-semibold text-accent-ink"
                >
                  {t.body.title}
                  <ChevronRight aria-hidden="true" className="size-5" />
                </Link>
              ) : undefined
            }
          >
            {latestWeight && weightText ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{weightText}</p>
                  <p className="text-sm text-muted">
                    {t.body.lastMeasured(fmt.dateTimeShort(new Date(latestWeight.measuredAt)))}
                    {changeText ? ` · ${changeText} ${t.body.periods['30d']}` : ''}
                  </p>
                  <p className="sr-only">{t.body.sparkText(weightText, changeText)}</p>
                </div>
                {sparkValues.length >= 3 ? <Sparkline values={sparkValues} /> : null}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted">{t.progress.weightNone}</p>
                <ButtonLink to="/fortschritt/gewicht" size="sm" variant="secondary">
                  <Scale aria-hidden="true" className="size-4" />
                  {t.body.add}
                </ButtonLink>
              </div>
            )}
          </Card>

          <Card title={t.progress.recordsTitle}>
            {records.length === 0 ? (
              <p className="text-muted">{t.progress.recordsEmpty}</p>
            ) : (
              <ul className="divide-y divide-line">
                {records.map((record) => (
                  <li
                    key={record.exerciseId}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Trophy aria-hidden="true" className="size-5 shrink-0 text-warning" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {names.get(record.exerciseId) ?? record.row.title}
                      </span>
                      <span className="block text-sm text-muted tabular-nums">
                        {fmt.dayMonthYear(new Date(record.row.completedAt))}
                        {record.oneRepMax !== null
                          ? ` · ${t.progress.oneRepMax(fmt.loadKg(Math.round(record.oneRepMax)))}`
                          : ''}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatSetValues(record.values, record.trackingMode, undefined, number)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t.progress.exercisesTitle}>
            {frequent.length === 0 ? (
              <p className="text-muted">{t.progress.exercisesEmpty}</p>
            ) : (
              <ul className="divide-y divide-line">
                {frequent.map((entry) => (
                  <li key={entry.exerciseId}>
                    <Link
                      to={`/fortschritt/uebung/${entry.exerciseId}`}
                      className="flex min-h-12 items-center gap-3 py-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {names.get(entry.exerciseId) ?? t.progress.exercisesTitle}
                        </span>
                        <span className="block text-sm text-muted">
                          {t.progress.sessionCount(entry.count)} ·{' '}
                          {fmt.dayMonthYear(new Date(entry.lastAt))}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
