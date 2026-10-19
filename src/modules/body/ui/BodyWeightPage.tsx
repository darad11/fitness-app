import { Plus, Scale } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { changeTone, useActiveGoals, weightToGoal } from '@/modules/goals';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Skeleton,
  StatTile,
  Switch,
  Toast,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import {
  changeInPeriod,
  groupByMonth,
  inPeriod,
  WEIGHT_PERIODS,
  withTrend,
  type WeightPeriod,
} from '../calc/bodyWeight';
import { useBodyWeights } from '../data/useBodyWeights';
import type { BodyWeight } from '../model/bodyWeight';
import {
  addBodyWeight,
  deleteBodyWeight,
  restoreBodyWeight,
  updateBodyWeight,
} from '../service/bodyWeightService';
import { BodyWeightSheet } from './BodyWeightSheet';

const WeightChart = lazy(async () => ({ default: (await import('./WeightChart')).WeightChart }));

const PERIOD_OPTIONS = WEIGHT_PERIODS.map((value) => ({ value, label: t.body.periods[value] }));

/** Körpergewicht (S-28): Kennzahlen, Diagramm C-01, Liste nach Monaten, Erfassen und Bearbeiten. */
export function BodyWeightPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const entries = useBodyWeights();
  const goals = useActiveGoals();
  const now = useToday();
  const [period, setPeriod] = useState<WeightPeriod>('90d');
  const [table, setTable] = useState(false);
  const [sheet, setSheet] = useState<{ entry?: BodyWeight } | null>(null);
  const [deleted, setDeleted] = useState<string | null>(null);

  const scoped = useMemo(
    () => (entries ? inPeriod(entries, period, now) : []),
    [entries, period, now],
  );
  const points = useMemo(() => withTrend(scoped), [scoped]);
  const change = changeInPeriod(scoped);
  const latest = entries?.[0];
  const goalKg = goals?.bodyWeightKg;
  const tone = latest && change !== null ? changeTone(change, latest.weightKg, goalKg) : 'neutral';
  const toGoal = latest && goalKg !== undefined ? weightToGoal(latest.weightKg, goalKg) : null;
  const formatWeight = (value: number) =>
    fmt.number(value, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  const save = async (input: { weightKg: number; measuredAt: Date; note?: string }) => {
    try {
      if (sheet?.entry) await updateBodyWeight(rt, sheet.entry.id, input);
      else await addBodyWeight(rt, input);
      setSheet(null);
    } catch (error) {
      void logError(rt.db, { area: 'body', error, route: '/fortschritt/gewicht' });
      throw error;
    }
  };
  const remove = (id: string) => {
    setSheet(null);
    deleteBodyWeight(rt, id).then(
      () => {
        setDeleted(id);
      },
      (error: unknown) => {
        void logError(rt.db, { area: 'body', error, route: '/fortschritt/gewicht' });
      },
    );
  };

  return (
    <>
      <PageHeader
        title={t.body.title}
        back={{ to: '/fortschritt', label: t.nav.progress }}
        action={
          // Ohne Einträge steht „Gewicht erfassen“ nur einmal, im leeren Zustand darunter.
          entries && entries.length > 0 ? (
            <Button
              onClick={() => {
                setSheet({});
              }}
            >
              <Plus aria-hidden="true" className="size-5" />
              {t.body.add}
            </Button>
          ) : undefined
        }
      />
      {entries === undefined ? (
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={t.body.emptyTitle}
          text={t.body.emptyText}
          action={
            <Button
              onClick={() => {
                setSheet({});
              }}
            >
              {t.body.add}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          <dl className="grid grid-cols-2 gap-3">
            <StatTile
              label={t.body.current}
              value={latest ? formatWeight(latest.weightKg) : '–'}
              unit="kg"
              hint={latest ? fmt.dateTimeShort(new Date(latest.measuredAt)) : undefined}
            />
            <StatTile
              label={t.body.changeLabel(t.body.periods[period])}
              value={change === null ? '–' : `${change > 0 ? '+' : ''}${formatWeight(change)}`}
              unit={change === null ? undefined : 'kg'}
              hint={
                change === null
                  ? t.body.changeHint
                  : toGoal && goalKg !== undefined
                    ? toGoal.reached
                      ? t.goals.goalReached(`${formatWeight(goalKg)} kg`)
                      : toGoal.diffKg > 0
                        ? t.goals.toGoal(
                            `${formatWeight(toGoal.diffKg)} kg`,
                            `${formatWeight(goalKg)} kg`,
                          )
                        : t.goals.toGoalUp(
                            `${formatWeight(-toGoal.diffKg)} kg`,
                            `${formatWeight(goalKg)} kg`,
                          )
                    : undefined
              }
              className={tone === 'toward' ? '[&_dd>span:first-child]:text-success' : undefined}
            />
          </dl>
          <Card title={t.body.chartTitle}>
            <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <SegmentedControl
                legend={t.body.periodLegend}
                options={PERIOD_OPTIONS}
                value={period}
                onChange={setPeriod}
              />
              <Switch label={t.body.asTable} checked={table} onChange={setTable} />
            </div>
            {scoped.length === 0 ? (
              <p className="text-muted">{t.body.noneInPeriod}</p>
            ) : table ? (
              <table className="w-full text-sm">
                <caption className="sr-only">{t.body.tableCaption}</caption>
                <thead className="text-left text-muted">
                  <tr>
                    <th scope="col" className="py-1 font-medium">
                      {t.body.colDate}
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      {t.body.colWeight}
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      {t.body.trend}
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {points.map(({ entry, avg7 }) => (
                    <tr key={entry.id} className="border-t border-line">
                      <td className="py-1.5">{fmt.dateTimeShort(new Date(entry.measuredAt))}</td>
                      <td className="py-1.5 text-right">{formatWeight(entry.weightKg)} kg</td>
                      <td className="py-1.5 text-right">
                        {avg7 === undefined ? '–' : `${formatWeight(avg7)} kg`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Suspense fallback={<Skeleton className="h-60" />}>
                <WeightChart points={points} formatWeight={formatWeight} goalKg={goalKg} />
              </Suspense>
            )}
            {scoped.length > 0 && scoped.length < 3 ? (
              <p className="mt-2 text-sm text-muted">{t.body.tooFewForTrend}</p>
            ) : null}
          </Card>
          <section aria-labelledby="gewicht-liste">
            <h2 id="gewicht-liste" className="eyebrow mb-2 text-muted">
              {t.body.listTitle}
            </h2>
            <div className="grid gap-4">
              {groupByMonth(entries, (iso) => fmt.monthYear(new Date(iso))).map((group) => (
                <div key={group.month}>
                  <h3 className="mb-1 text-sm font-semibold">{group.month}</h3>
                  <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
                    {group.items.map(({ entry, diff }) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2"
                          aria-label={t.body.editEntry(
                            formatWeight(entry.weightKg),
                            fmt.dateTimeShort(new Date(entry.measuredAt)),
                          )}
                          onClick={() => {
                            setSheet({ entry });
                          }}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-muted tabular-nums">
                              {fmt.dateTimeShort(new Date(entry.measuredAt))}
                            </span>
                            {entry.note ? (
                              <span className="block truncate text-sm">{entry.note}</span>
                            ) : null}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatWeight(entry.weightKg)} kg
                          </span>
                          <span className="w-16 text-right text-sm text-muted tabular-nums">
                            {diff === null ? '' : `${diff > 0 ? '+' : ''}${formatWeight(diff)}`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      <BodyWeightSheet
        key={sheet ? (sheet.entry?.id ?? 'neu') : 'zu'}
        open={sheet !== null}
        entry={sheet?.entry}
        entries={entries ?? []}
        formatWeight={formatWeight}
        onClose={() => {
          setSheet(null);
        }}
        onSave={save}
        onDelete={
          sheet?.entry
            ? () => {
                remove(sheet.entry?.id ?? '');
              }
            : undefined
        }
      />
      {deleted ? (
        <Toast
          message={t.body.deleted}
          durationMs={10_000}
          onTimeout={() => {
            setDeleted(null);
          }}
          action={
            <Button
              variant="onInk"
              size="sm"
              onClick={() => {
                const id = deleted;
                setDeleted(null);
                restoreBodyWeight(rt, id).catch((error: unknown) => {
                  void logError(rt.db, { area: 'body', error, route: '/fortschritt/gewicht' });
                });
              }}
            >
              {t.session.undoDiscard}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
