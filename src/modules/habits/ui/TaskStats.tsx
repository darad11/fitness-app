import { ChevronRight, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { Card, Meter, SegmentedControl, SelectField, StatTile } from '@/shared/ui';
import {
  dataStart,
  habitRate,
  habitStreaks,
  INSIGHT_PERIODS,
  insights,
  overallRate,
  overallStreaks,
  periodDays,
  previousDays,
  progressBuckets,
  rateChange,
  type InsightPeriod,
  type Insight,
} from '../calc/insights';
import { activeOn, dayStatus } from '../calc/streak';
import type { Habit } from '../model/habit';
import { ProgressChart } from './ProgressChart';
import { TaskMatrix } from './TaskMatrix';
import type { HabitHistory } from './useHabitHistory';

const ts = t.tasks.stats;
const PERIOD_OPTIONS = INSIGHT_PERIODS.map((value) => ({ value, label: ts.periods[value] }));
const PERIOD_LENGTH: Record<InsightPeriod, number> = { '7d': 7, '30d': 30, '90d': 90, all: 0 };
type Sort = keyof typeof ts.sorts;

export function statusOf(habit: Habit, today: string): 'paused' | 'removed' | null {
  if (habit.removedAt) return 'removed';
  if (habit.toDayKey !== undefined && habit.toDayKey <= today) return 'paused';
  return null;
}

/**
 * Fortschritt unter der Verwaltung (D-284): Kennzahlen, Verlauf, je Aufgabe, Hinweise. Alle Zahlen
 * aus `calc/insights.ts`; der Zeitraum gilt für alles außer Serie (ganze Geschichte) und Hinweise
 * (immer 30 Tage).
 */
export function TaskStats({
  history,
  period,
  onPeriod,
}: {
  history: HabitHistory;
  period: InsightPeriod;
  onPeriod: (period: InsightPeriod) => void;
}) {
  const fmt = useFormatters();
  const [sort, setSort] = useState<Sort>('list');
  const { habits, index, today } = history;
  const start = dataStart(habits);
  if (start === null) {
    return (
      <Card title={ts.title}>
        <p className="text-muted">{ts.empty}</p>
      </Card>
    );
  }
  const pct = (value: number) => `${fmt.number(Math.round(value * 100))} %`;
  const days = periodDays(period, habits, today);
  const before = previousDays(period, habits, today);
  const todayStatus = dayStatus(habits, [], today);
  const doneToday = activeOn(habits, today).filter(
    (habit) => index.byDay.get(today)?.get(habit.id) === true,
  ).length;
  const rate = overallRate(habits, days, index, today);
  const streaks = overallStreaks(habits, index, today);
  const chart = progressBuckets(habits, days, index, today);
  const clipped = period !== 'all' && days.length < PERIOD_LENGTH[period];

  const rows = habits
    .map((habit) => {
      const r = habitRate(habit, days, index, today);
      const change =
        period === 'all'
          ? null
          : rateChange(r, habitRate(habit, before, index, today), PERIOD_LENGTH[period]);
      return { habit, rate: r, change, streak: habitStreaks(habit, index, today).current };
    })
    // Gelöschte und pausierte nur, wenn sie im Zeitraum fällig waren.
    .filter((row) => statusOf(row.habit, today) === null || row.rate.due > 0);
  const withChange = rows.filter((row) => row.change !== null).length;
  const sortOptions = (Object.keys(ts.sorts) as Sort[])
    .filter((key) => (key === 'up' || key === 'down' ? withChange >= 2 : true))
    .map((value) => ({ value, label: ts.sorts[value] }));
  const activeSort = sortOptions.some((option) => option.value === sort) ? sort : 'list';
  const sorted = [...rows].sort((a, b) => {
    const ra = a.rate.rate ?? -1;
    const rb = b.rate.rate ?? -1;
    switch (activeSort) {
      case 'best':
        return rb - ra;
      case 'lowest':
        return (a.rate.rate ?? 2) - (b.rate.rate ?? 2);
      case 'up':
        return (b.change ?? -999) - (a.change ?? -999);
      case 'down':
        return (a.change ?? 999) - (b.change ?? 999);
      default:
        return 0;
    }
  });
  const hints = insights(habits, index, today);
  const names = new Map(habits.map((habit) => [habit.id, habit.name]));

  return (
    <section aria-labelledby="aufgaben-fortschritt" className="grid grid-cols-1 gap-4">
      <h2 id="aufgaben-fortschritt" className="mt-2 text-xl font-bold">
        {ts.title}
      </h2>
      <SegmentedControl
        legend={ts.periodLegend}
        options={PERIOD_OPTIONS}
        value={period}
        onChange={onPeriod}
      />
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label={ts.today}
          value={ts.todayValue(fmt.number(doneToday), fmt.number(todayStatus.total))}
        />
        <StatTile
          label={ts.rate}
          value={rate.rate === null ? '–' : pct(rate.rate)}
          hint={rate.rate === null ? ts.rateNone : ts.rateHint}
        />
        <StatTile
          label={ts.streak}
          value={fmt.number(streaks.current)}
          unit={ts.days(streaks.current)}
          hint={ts.streakHint(fmt.number(streaks.best))}
        />
        <StatTile
          label={ts.active}
          value={fmt.number(habits.filter((habit) => habit.toDayKey === undefined).length)}
        />
      </dl>
      {clipped || rate.noDataDays > 0 ? (
        <p className="-mt-1 text-sm text-muted">
          {clipped ? ts.since(fmt.dayMonth(new Date(`${start}T12:00:00`))) : ''}
          {clipped && rate.noDataDays > 0 ? ' ' : ''}
          {rate.noDataDays > 0 ? ts.noDataDays(rate.noDataDays) : ''}
        </p>
      ) : null}

      <Card title={ts.chartTitle}>
        <ProgressChart unit={chart.unit} buckets={chart.buckets} />
        <p className="mt-2 text-sm text-muted">
          {chart.unit === 'day' ? ts.chartHintDay : ts.chartHintWeek}
        </p>
      </Card>

      <Card title={ts.perTask}>
        <TaskMatrix
          habits={sorted.map((row) => row.habit)}
          days={days}
          index={index}
          today={today}
        />
        {sortOptions.length > 1 && rows.length > 1 ? (
          <div className="mt-4">
            <SelectField
              label={ts.sortLegend}
              options={sortOptions}
              value={activeSort}
              onChange={setSort}
            />
          </div>
        ) : null}
        <ul className="mt-2 divide-y divide-line">
          {sorted.map(({ habit, rate: r, change, streak }) => {
            const status = statusOf(habit, today);
            return (
              <li key={habit.id}>
                <Link
                  to={`/heute/aufgaben/${habit.id}`}
                  aria-label={ts.openTask(habit.name)}
                  className="flex min-h-12 items-center gap-3 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">
                        {habit.name}
                        {status ? (
                          <span className="ml-2 text-sm font-normal text-muted">{ts[status]}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {r.rate === null ? '–' : pct(r.rate)}
                      </span>
                    </span>
                    <Meter className="mt-2 h-1.5" label={habit.name} value={r.rate ?? 0} />
                    <span className="mt-1 block text-sm text-muted tabular-nums">
                      {r.due === 0 ? ts.taskNone : ts.taskLine(r.done, r.due)}
                      {streak > 0 ? ` · ${ts.taskStreak(streak)}` : ''}
                      {change !== null && (activeSort === 'up' || activeSort === 'down')
                        ? ` · ${ts.change(change)}`
                        : ''}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      {hints.length > 0 ? (
        <Card title={ts.insightsTitle}>
          <ul className="grid gap-4">
            {hints.map((hint) => (
              <li
                key={`${hint.kind}-${'habitId' in hint ? hint.habitId : ''}`}
                className="flex gap-3"
              >
                <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
                <HintText hint={hint} name={(id) => names.get(id) ?? ''} pct={pct} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </section>
  );
}

function HintText({
  hint,
  name,
  pct,
}: {
  hint: Insight;
  name: (id: string) => string;
  pct: (value: number) => string;
}) {
  const i = ts.insights;
  const [observation, suggestion] =
    hint.kind === 'oftenSkipped'
      ? [i.oftenSkipped(name(hint.habitId), pct(hint.rate), hint.due), i.oftenSkippedTip]
      : hint.kind === 'weekend'
        ? [
            i.weekend(name(hint.habitId), pct(hint.weekdayRate), pct(hint.weekendRate)),
            i.weekendTip,
          ]
        : hint.kind === 'improving'
          ? [i.improving(name(hint.habitId), hint.change), i.improvingTip]
          : [i.stabilize(hint.added, hint.change), i.stabilizeTip];
  return (
    <div className="min-w-0 text-sm">
      <p>
        <span className="font-semibold">{ts.observation}: </span>
        {observation}
      </p>
      <p className="mt-1 text-muted">
        <span className="font-semibold">{ts.suggestion}: </span>
        {suggestion}
      </p>
    </div>
  );
}
