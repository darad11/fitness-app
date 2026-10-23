import { Check, Minus } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { cn } from '@/shared/lib/cn';
import { isoWeekday } from '@/shared/lib/time';
import { Card, Meter, PageHeader, SegmentedControl, Skeleton, StatTile } from '@/shared/ui';
import {
  habitRate,
  habitState,
  habitWeek,
  INSIGHT_PERIODS,
  periodDays,
  previousDays,
  progressBuckets,
  rateChange,
  WEEKDAY_MIN_DUE,
  weekdayRates,
  type DayState,
  type InsightPeriod,
} from '../calc/insights';
import { ProgressChart } from './ProgressChart';
import { statusOf } from './TaskStats';
import { useHabitHistory } from './useHabitHistory';

const ts = tTaskStats;
const td = ts.detail;
const PERIOD_OPTIONS = INSIGHT_PERIODS.map((value) => ({ value, label: ts.periods[value] }));
const PERIOD_LENGTH: Record<InsightPeriod, number> = { '7d': 7, '30d': 30, '90d': 90, all: 0 };
const CALENDAR_MAX = 90;

/**
 * Auswertung einer Aufgabe (D-284): Quote, erledigte Tage, diese Woche (Wochenbild statt Serie,
 * D-318), Vergleich, Verlauf, Kalender, Wochentage.
 */
export function TaskDetailPage() {
  const { id } = useParams();
  const fmt = useFormatters();
  const history = useHabitHistory();
  const [period, setPeriod] = useState<InsightPeriod>('30d');
  const back = { to: '/heute/aufgaben', label: td.back };

  if (history === undefined) {
    return (
      <>
        <PageHeader title={t.tasks.title} back={back} />
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </>
    );
  }
  const habit = history.habits.find((item) => item.id === id);
  if (!habit) {
    return (
      <>
        <PageHeader title={t.tasks.title} back={back} />
        <p className="text-muted">{td.notFound}</p>
      </>
    );
  }
  const { index, today } = history;
  const pct = (value: number) => `${fmt.number(Math.round(value * 100))} %`;
  const days = periodDays(period, [habit], today);
  const rate = habitRate(habit, days, index, today);
  const week = habitWeek(habit, index, today);
  const status = statusOf(habit, today);
  const previous =
    period === 'all' ? null : habitRate(habit, previousDays(period, [habit], today), index, today);
  const change = previous ? rateChange(rate, previous, PERIOD_LENGTH[period]) : null;
  const chart = progressBuckets([habit], days, index, today);
  const calendarDays = days.slice(-CALENDAR_MAX);
  const firstDay = calendarDays[0];
  const lead = firstDay === undefined ? 0 : isoWeekday(firstDay) - 1;
  // Nur Wochentage, an denen die Aufgabe im Zeitraum fällig war (D-285: z. B. nur Mo, Mi, Fr).
  const weekdays = weekdayRates(habit, days, index, today).filter((row) => row.due > 0);
  const weekdaysOk = weekdays.length >= 2 && weekdays.every((row) => row.due >= WEEKDAY_MIN_DUE);

  return (
    <>
      <PageHeader title={habit.name} back={back} />
      <div className="grid grid-cols-1 gap-4">
        {status ? <p className="text-muted">{td.status(status)}</p> : null}
        <SegmentedControl
          legend={ts.periodLegend}
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile
            label={ts.rate}
            value={rate.rate === null ? '–' : pct(rate.rate)}
            hint={rate.rate === null ? ts.rateNone : undefined}
          />
          <StatTile
            label={td.done}
            value={td.doneValue(fmt.number(rate.done), fmt.number(rate.due))}
            hint={td.doneHint}
          />
          <StatTile
            label={td.week}
            value={week.due === 0 ? '–' : ts.weekValue(fmt.number(week.done), fmt.number(week.due))}
            hint={td.weekHint}
          />
        </dl>
        <p className="-mt-1 text-sm text-muted">
          {period === 'all'
            ? td.compareAll
            : change !== null && previous?.rate != null && rate.rate !== null
              ? td.compare(
                  ts.periodNames[period],
                  pct(previous.rate),
                  pct(rate.rate),
                  ts.change(change),
                )
              : td.compareNone}
          {rate.noDataDays > 0 ? ` ${ts.noDataDays(rate.noDataDays)}` : ''}
        </p>

        {chart.unit === 'week' ? (
          // Bis 31 Tage zeigt der Kalender dasselbe genauer; darüber hilft der Wochenverlauf.
          <Card title={ts.chartTitle}>
            <ProgressChart unit={chart.unit} buckets={chart.buckets} />
            <p className="mt-2 text-sm text-muted">{ts.chartHintWeek}</p>
          </Card>
        ) : null}

        <Card title={td.calendar}>
          <ol
            className="grid w-max grid-cols-7 gap-1.5"
            aria-label={`${td.calendar}, ${td.calendarHint}`}
          >
            {Array.from({ length: lead }, (_, i) => (
              <li key={`leer-${String(i)}`} aria-hidden="true" />
            ))}
            {calendarDays.map((day) => {
              const state = habitState(habit, day, index, today);
              const label = `${fmt.dayMonth(new Date(`${day}T12:00:00`))}: ${
                day === today && state === 'open' ? td.states.today : td.states[state]
              }`;
              return (
                <li key={day} title={label}>
                  <span className="sr-only">{label}</span>
                  <CalendarCell state={state} today={day === today} day={Number(day.slice(8))} />
                </li>
              );
            })}
          </ol>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-hidden="true">
            {(['done', 'open', 'notDue', 'noData'] as const).map((state) => (
              <li key={state} className="flex items-center gap-1.5">
                <CalendarCell state={state} small />
                {td.states[state]}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <CalendarCell state="open" today small />
              {td.states.today}
            </li>
          </ul>
          {days.length > CALENDAR_MAX ? (
            <p className="mt-2 text-sm text-muted">{td.calendarLimited}</p>
          ) : null}
        </Card>

        <Card title={td.weekdays}>
          {weekdaysOk ? (
            <>
              <ul className="grid gap-2">
                {weekdays.map((row) => (
                  <li key={row.weekday} className="flex items-center gap-3 text-sm">
                    <span className="w-6 shrink-0 text-muted">
                      {td.weekdayNames[row.weekday - 1]}
                    </span>
                    <Meter
                      className="h-1.5 flex-1"
                      label={td.weekdayNames[row.weekday - 1] ?? ''}
                      value={row.due === 0 ? 0 : row.done / row.due}
                    />
                    <span className="w-12 shrink-0 text-right tabular-nums">
                      {pct(row.due === 0 ? 0 : row.done / row.due)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted">{td.weekdaysHint}</p>
            </>
          ) : (
            <p className="text-muted">{td.weekdaysTooFew}</p>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * Ein Tag im Kalender, 28 px (F5, D-325); Zustand nicht nur über Farbe (Haken, Strich, Zahl).
 * Heute trägt einen dünnen Rahmen in Lime mit 1 px Abstand. `small`: Muster der Legende, 14 px,
 * mit denselben Flächen und Rändern.
 */
function CalendarCell({
  state,
  today = false,
  day,
  small = false,
}: {
  state: DayState;
  today?: boolean;
  day?: number;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center text-xs font-semibold tabular-nums',
        'rounded-mark',
        small ? 'size-3.5' : 'size-7',
        state === 'done' && 'bg-success text-on-accent',
        state === 'open' && 'border-line-input text-fg',
        state === 'open' && (small ? 'border-[1.5px]' : 'border-2'),
        state === 'notDue' && 'bg-surface-2 text-muted',
        state === 'noData' && 'border border-dashed border-line-input text-muted',
        today && 'ring-1 ring-accent ring-offset-1 ring-offset-surface',
      )}
    >
      {small ? null : state === 'done' ? (
        <Check className="size-3.5" strokeWidth={3} />
      ) : state === 'noData' ? (
        <Minus className="size-3" />
      ) : (
        day
      )}
    </span>
  );
}
