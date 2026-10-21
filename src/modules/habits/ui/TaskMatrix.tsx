import { useFormatters } from '@/modules/settings';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { cn } from '@/shared/lib/cn';
import { startOfWeek, type DayKey } from '@/shared/lib/time';
import { habitState, type DayState, type LogIndex } from '../calc/insights';
import type { Habit } from '../model/habit';

const ts = tTaskStats;
const td = ts.detail;
const dateOf = (day: DayKey) => new Date(`${day}T12:00:00`);

/**
 * Gesamtübersicht (D-284): je Aufgabe eine Zeile, je Tag ein Feld; ab 32 Tagen je Woche ein Feld,
 * gefüllt nach Anteil erledigt. Zustände nicht nur über Farbe: erledigt gefüllt, offen mit Rand,
 * nicht fällig blass, ohne Eintrag gestrichelt. Als Tabelle für Screenreader lesbar.
 */
export function TaskMatrix({
  habits,
  days,
  index,
  today,
}: {
  habits: readonly Habit[];
  days: readonly DayKey[];
  index: LogIndex;
  today: DayKey;
}) {
  const fmt = useFormatters();
  if (days.length === 0 || habits.length === 0) return null;
  const weekly = days.length > 31;
  const columns: { key: DayKey; days: DayKey[] }[] = [];
  for (const day of days) {
    const key = weekly ? startOfWeek(day) : day;
    const last = columns.at(-1);
    if (last?.key === key) last.days.push(day);
    else columns.push({ key, days: [day] });
  }
  const labelEvery = columns.length <= 7 ? 1 : Math.ceil(columns.length / 5);
  const headLabel = (key: DayKey, i: number) => {
    if (i % labelEvery !== 0 && i !== columns.length - 1) return '';
    if (columns.length <= 7) return td.weekdayNames[(dateOf(key).getDay() + 6) % 7] ?? '';
    return fmt.dayMonth(dateOf(key)).replace('.', '').split(' ')[0] ?? '';
  };

  return (
    <div className="mt-1">
      <table
        className={cn(
          'w-full table-fixed border-separate',
          // Wenige Spalten: nicht über die ganze Breite ziehen (z. B. erster Tag, 7 Tage am Desktop).
          columns.length <= 7 && 'max-w-md',
          columns.length > 14 ? 'border-spacing-x-px border-spacing-y-1' : 'border-spacing-[3px]',
        )}
      >
        <caption className="sr-only">{weekly ? ts.matrixCaptionWeek : ts.matrixCaptionDay}</caption>
        <colgroup>
          <col className="w-28 sm:w-40" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              {ts.perTask}
            </th>
            {columns.map((column, i) => (
              <th
                key={column.key}
                scope="col"
                className="text-center text-[10px] font-medium text-muted tabular-nums"
              >
                <span aria-hidden="true">{headLabel(column.key, i)}</span>
                <span className="sr-only">
                  {weekly
                    ? ts.chartWeek(fmt.dayMonth(dateOf(column.key)))
                    : fmt.dayMonth(dateOf(column.key))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr key={habit.id}>
              <th scope="row" className="truncate pr-1 text-left text-sm font-medium">
                {habit.name}
              </th>
              {columns.map((column) => {
                if (!weekly) {
                  const day = column.key;
                  const state = habitState(habit, day, index, today);
                  const label = `${fmt.dayMonth(dateOf(day))}: ${
                    day === today && state === 'open' ? td.states.today : td.states[state]
                  }`;
                  return (
                    <td key={day} title={label} className="p-0">
                      <span className="sr-only">{label}</span>
                      <Cell state={state} today={day === today} tall={columns.length > 7} />
                    </td>
                  );
                }
                let done = 0;
                let due = 0;
                let noData = 0;
                for (const day of column.days) {
                  if (day === today) continue;
                  const state = habitState(habit, day, index, today);
                  if (state === 'done') done += 1;
                  if (state === 'done' || state === 'open') due += 1;
                  if (state === 'noData') noData += 1;
                }
                const label = `${ts.chartWeek(fmt.dayMonth(dateOf(column.key)))}: ${
                  due === 0
                    ? noData > 0
                      ? td.states.noData
                      : td.states.notDue
                    : ts.taskLine(done, due)
                }`;
                return (
                  <td key={column.key} title={label} className="p-0">
                    <span className="sr-only">{label}</span>
                    <WeekCell done={done} due={due} noData={due === 0 && noData > 0} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
        {(weekly
          ? [
              ['done', ts.matrixWeekFull],
              ['open', ts.matrixWeekNone],
              ['notDue', td.states.notDue],
              ['noData', td.states.noData],
            ]
          : (['done', 'open', 'notDue', 'noData'] as const).map((state) => [
              state,
              td.states[state],
            ])
        ).map(([state, label]) => (
          <li key={state} className="flex items-center gap-1.5">
            <span className="inline-block size-3">
              <Cell state={state as DayState} />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cell({
  state,
  today = false,
  tall = false,
}: {
  state: DayState;
  today?: boolean;
  /** Viele schmale Spalten: feste Höhe statt quadratisch, damit die Felder lesbar bleiben. */
  tall?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block w-full rounded-[3px]',
        tall ? 'h-5' : 'mx-auto aspect-square max-w-10',
        state === 'done' && 'bg-success',
        state === 'open' && 'border border-line-input',
        state === 'notDue' && 'bg-surface-2 opacity-60',
        state === 'noData' && 'border border-dashed border-line-input opacity-70',
        today && 'outline-2 outline-offset-1 outline-focus',
        today && tall && 'outline-1 outline-offset-0',
      )}
    />
  );
}

function WeekCell({ done, due, noData }: { done: number; due: number; noData: boolean }) {
  if (noData) return <Cell state="noData" />;
  if (due === 0) return <Cell state="notDue" />;
  const share = done / due;
  return (
    <span
      aria-hidden="true"
      className="relative mx-auto block aspect-square w-full max-w-10 overflow-hidden rounded-[3px] border border-line-input"
    >
      <span
        className="absolute inset-x-0 bottom-0 bg-success"
        style={{ height: `${String(Math.round(share * 100))}%` }}
      />
    </span>
  );
}
