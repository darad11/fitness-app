import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { isoWeekday } from '@/shared/lib/time';
import { Card, Mark, Meter, PageHeader, SegmentedControl, Skeleton, StatTile } from '@/shared/ui';
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
  type InsightPeriod,
} from '../calc/insights';
import { ProgressChart } from './ProgressChart';
import { TaskSettings } from './TaskSettings';
import { statusOf } from './TaskStats';
import { useHabitHistory } from './useHabitHistory';

const ts = tTaskStats;
const td = ts.detail;
const PERIOD_OPTIONS = INSIGHT_PERIODS.map((value) => ({ value, label: ts.periods[value] }));
const PERIOD_LENGTH: Record<InsightPeriod, number> = { '7d': 7, '30d': 30, '90d': 90, all: 0 };
const CALENDAR_MAX = 90;

/**
 * Detailansicht einer Aufgabe (F6, D-335): oben die Einstellungen (Name, Wochentage, Regel zum
 * Abhaken, pausieren, löschen), darunter die Auswertung (D-284): Quote, erledigte Tage, diese
 * Woche (Wochenbild statt Serie, D-318), Vergleich, Verlauf, Kalender, Wochentage. Zurück führt
 * dorthin, wo die Zeile angetippt wurde („Heute“ oder „Tagesaufgaben“).
 */
export function TaskDetailPage() {
  const { id } = useParams();
  const fmt = useFormatters();
  const history = useHabitHistory();
  const [period, setPeriod] = useState<InsightPeriod>('30d');
  const from = (useLocation().state as { back?: string } | null)?.back;
  const back =
    from === '/heute'
      ? { to: '/heute', label: t.nav.today }
      : { to: '/heute/aufgaben', label: td.back };

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
        {status === null ? <TaskSettings key={habit.id} habit={habit} today={today} /> : null}
        <h2 className="mt-2 text-xl font-semibold">{t.tasks.statsTitle}</h2>
        <SegmentedControl
          row
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
          {/* Kompakte Zellen in sieben Spalten, Wochentage darüber; Markierung 16 px (D-334). */}
          <ul
            aria-hidden="true"
            className="grid w-max grid-cols-[repeat(7,1.75rem)] text-center text-[10px] font-medium text-muted"
          >
            {td.weekdayNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <ol
            className="mt-1 grid w-max grid-cols-[repeat(7,1.75rem)] gap-y-1.5"
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
                <li key={day} title={label} className="flex justify-center">
                  <span className="sr-only">{label}</span>
                  <Mark state={state} size="md" today={day === today} dash>
                    {Number(day.slice(8))}
                  </Mark>
                </li>
              );
            })}
          </ol>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-hidden="true">
            {(['done', 'open', 'notDue', 'noData'] as const).map((state) => (
              <li key={state} className="flex items-center gap-1.5">
                <Mark state={state} />
                {td.states[state]}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <Mark state="open" today />
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
