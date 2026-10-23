import { addDays, isoWeekday, startOfWeek, type DayKey } from '@/shared/lib/time';
import { activeOn, type HabitLike, type LogLike } from './days';

/**
 * Auswertung der Tagesaufgaben (D-284). Eine Rechnung für alle Ansichten.
 *
 * Zustand einer Aufgabe an einem Tag:
 * - `notDue`: galt an dem Tag nicht (vor dem Anlegen, pausiert, gelöscht).
 * - `noData`: galt, aber an dem Tag wurde gar nichts abgehakt oder zurückgenommen (App nicht
 *   benutzt). Zählt weder als erledigt noch als offen (Leitplanken: kein Tag gilt als verfehlt).
 * - `done` / `open`: erledigt bzw. an einem Tag mit Einträgen nicht erledigt.
 * Heute zählt nie als `noData`, aber in Quoten nicht mit, weil der Tag noch läuft.
 */
export type DayState = 'done' | 'open' | 'notDue' | 'noData';

export const INSIGHT_PERIODS = ['7d', '30d', '90d', 'all'] as const;
export type InsightPeriod = (typeof INSIGHT_PERIODS)[number];
const PERIOD_DAYS: Record<Exclude<InsightPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export interface HabitInfo extends HabitLike {
  name: string;
}

/** Vorbereitete Einträge: je Tag die Aufgaben mit erledigt ja/nein. */
export interface LogIndex {
  byDay: ReadonlyMap<DayKey, ReadonlyMap<string, boolean>>;
}

export function indexLogs(logs: readonly LogLike[]): LogIndex {
  const byDay = new Map<DayKey, Map<string, boolean>>();
  for (const log of logs) {
    let day = byDay.get(log.dayKey);
    if (!day) {
      day = new Map();
      byDay.set(log.dayKey, day);
    }
    day.set(log.habitId, log.done);
  }
  return { byDay };
}

export function habitState(
  habit: HabitLike,
  day: DayKey,
  index: LogIndex,
  today: DayKey,
): DayState {
  if (activeOn([habit], day).length === 0) return 'notDue';
  const entries = index.byDay.get(day);
  if (entries?.get(habit.id) === true) return 'done';
  if (day === today || entries !== undefined) return 'open';
  return 'noData';
}

export interface DayTotals {
  day: DayKey;
  due: number;
  done: number;
  /** Kein Eintrag an dem Tag (nicht heute): nicht auswertbar. */
  noData: boolean;
}

export function dayTotals(
  habits: readonly HabitLike[],
  day: DayKey,
  index: LogIndex,
  today: DayKey,
): DayTotals {
  const active = activeOn(habits, day);
  const entries = index.byDay.get(day);
  const noData = active.length > 0 && day !== today && entries === undefined;
  const done = noData ? 0 : active.filter((habit) => entries?.get(habit.id) === true).length;
  return { day, due: active.length, done, noData };
}

/** Erster Tag mit einer Aufgabe; davor gibt es keine Daten. */
export function dataStart(habits: readonly HabitLike[]): DayKey | null {
  let first: DayKey | null = null;
  for (const habit of habits) {
    if (first === null || habit.fromDayKey < first) first = habit.fromDayKey;
  }
  return first;
}

/** Tage des Zeitraums, ältester zuerst, nie vor dem Beginn der Daten. */
export function periodDays(
  period: InsightPeriod,
  habits: readonly HabitLike[],
  today: DayKey,
): DayKey[] {
  const start = dataStart(habits);
  if (start === null || start > today) return [];
  let from = period === 'all' ? start : addDays(today, 1 - PERIOD_DAYS[period]);
  if (from < start) from = start;
  return daysFrom(from, today);
}

/** Der Zeitraum gleicher Länge direkt davor (für den Vergleich), ebenfalls ab Datenbeginn. */
export function previousDays(
  period: InsightPeriod,
  habits: readonly HabitLike[],
  today: DayKey,
): DayKey[] {
  if (period === 'all') return [];
  const length = PERIOD_DAYS[period];
  const start = dataStart(habits);
  if (start === null) return [];
  const to = addDays(today, -length);
  let from = addDays(to, 1 - length);
  if (from < start) from = start;
  return from > to ? [] : daysFrom(from, to);
}

function daysFrom(from: DayKey, to: DayKey): DayKey[] {
  const days: DayKey[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

export interface Rate {
  done: number;
  due: number;
  /** 0 bis 1; `null`, wenn nichts fällig war oder keine Daten. */
  rate: number | null;
  /** Tage mit fälligen Aufgaben, aber ohne Eintrag (nicht mitgezählt). */
  noDataDays: number;
}

function rateOf(done: number, due: number, noDataDays: number): Rate {
  return { done, due, rate: due === 0 ? null : done / due, noDataDays };
}

/** Erfüllungsquote aller Aufgaben: erledigte fällige / alle fälligen, ohne heute. */
export function overallRate(
  habits: readonly HabitLike[],
  days: readonly DayKey[],
  index: LogIndex,
  today: DayKey,
): Rate {
  let done = 0;
  let due = 0;
  let noDataDays = 0;
  for (const day of days) {
    if (day >= today) continue;
    const totals = dayTotals(habits, day, index, today);
    if (totals.noData) noDataDays += 1;
    else {
      done += totals.done;
      due += totals.due;
    }
  }
  return rateOf(done, due, noDataDays);
}

/** Erfüllungsquote einer Aufgabe, ohne heute. */
export function habitRate(
  habit: HabitLike,
  days: readonly DayKey[],
  index: LogIndex,
  today: DayKey,
): Rate {
  let done = 0;
  let due = 0;
  let noDataDays = 0;
  for (const day of days) {
    if (day >= today) continue;
    const state = habitState(habit, day, index, today);
    if (state === 'done') {
      done += 1;
      due += 1;
    } else if (state === 'open') due += 1;
    else if (state === 'noData') noDataDays += 1;
  }
  return rateOf(done, due, noDataDays);
}

/**
 * Wochenbild statt Serie (Leitplanken Regel 2; F4, D-318): diese Woche ab Montag, „x von y“.
 * `due` zählt nur auswertbare Tage: Tage ohne Eintrag zählen nicht als verfehlt (D-284), heute
 * zählt erst, wenn alles erledigt ist, weil der Tag noch läuft.
 */
export interface Week {
  done: number;
  due: number;
}

/** Tage dieser Woche, an denen alle fälligen Aufgaben erledigt waren. */
export function overallWeek(habits: readonly HabitLike[], index: LogIndex, today: DayKey): Week {
  let done = 0;
  let due = 0;
  for (const day of daysFrom(startOfWeek(today), today)) {
    const totals = dayTotals(habits, day, index, today);
    const full = totals.due > 0 && totals.done === totals.due;
    if (totals.due === 0 || totals.noData || (day === today && !full)) continue;
    due += 1;
    if (full) done += 1;
  }
  return { done, due };
}

/** Fällige Tage einer Aufgabe in dieser Woche und davon erledigte. */
export function habitWeek(habit: HabitLike, index: LogIndex, today: DayKey): Week {
  let done = 0;
  let due = 0;
  for (const day of daysFrom(startOfWeek(today), today)) {
    const state = habitState(habit, day, index, today);
    if (state === 'notDue' || state === 'noData' || (day === today && state !== 'done')) continue;
    due += 1;
    if (state === 'done') done += 1;
  }
  return { done, due };
}

/** Mindestens so viele auswertbare fällige Tage braucht ein Vergleich je Zeitraum. */
export function minComparableDue(days: number): number {
  return Math.max(5, Math.ceil(days / 2));
}

/**
 * Veränderung der Quote gegenüber dem Zeitraum davor in Prozentpunkten; `null`, wenn einer der
 * beiden Zeiträume zu wenig auswertbare Tage hat (z. B. neue Aufgabe).
 */
export function rateChange(current: Rate, previous: Rate, periodLength: number): number | null {
  const min = minComparableDue(periodLength);
  if (current.rate === null || previous.rate === null) return null;
  if (current.due < min || previous.due < min) return null;
  return Math.round((current.rate - previous.rate) * 100);
}

export interface Bucket {
  /** Erster Tag des Abschnitts (Tag oder Montag der Woche). */
  start: DayKey;
  done: number;
  due: number;
  /** Alle fälligen erledigt (nur bei Tagen sinnvoll). */
  complete: boolean;
  noData: boolean;
  today: boolean;
}

/** Verlauf: bis 31 Tage je Tag, darüber je Woche (Montag bis Sonntag). */
export function progressBuckets(
  habits: readonly HabitLike[],
  days: readonly DayKey[],
  index: LogIndex,
  today: DayKey,
): { unit: 'day' | 'week'; buckets: Bucket[] } {
  const unit = days.length > 31 ? 'week' : 'day';
  const buckets: Bucket[] = [];
  for (const day of days) {
    const totals = dayTotals(habits, day, index, today);
    const start = unit === 'day' ? day : startOfWeek(day);
    let bucket = buckets.at(-1);
    if (bucket?.start !== start) {
      bucket = { start, done: 0, due: 0, complete: false, noData: true, today: false };
      buckets.push(bucket);
    }
    if (day === today) bucket.today = true;
    if (!totals.noData && totals.due > 0) {
      bucket.done += totals.done;
      bucket.due += totals.due;
      bucket.noData = false;
    }
    bucket.complete = bucket.due > 0 && bucket.done === bucket.due;
  }
  return { unit, buckets };
}

export interface WeekdayRate {
  weekday: number;
  done: number;
  due: number;
}

/** Quote je Wochentag (Montag = 1), ohne heute. */
export function weekdayRates(
  habit: HabitLike,
  days: readonly DayKey[],
  index: LogIndex,
  today: DayKey,
): WeekdayRate[] {
  const rows = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, done: 0, due: 0 }));
  for (const day of days) {
    if (day >= today) continue;
    const state = habitState(habit, day, index, today);
    if (state !== 'done' && state !== 'open') continue;
    const row = rows[isoWeekday(day) - 1];
    if (!row) continue;
    row.due += 1;
    if (state === 'done') row.done += 1;
  }
  return rows;
}

/** Wochentage sind erst aussagekräftig, wenn jeder Tag mindestens dreimal fällig war. */
export const WEEKDAY_MIN_DUE = 3;

export type Insight =
  | { kind: 'oftenSkipped'; habitId: string; rate: number; due: number }
  | { kind: 'weekend'; habitId: string; weekdayRate: number; weekendRate: number }
  | { kind: 'improving'; habitId: string; change: number }
  | { kind: 'stabilize'; added: number; change: number };

/** Mindestens so viele auswertbare fällige Tage, bevor eine Aufgabe einen Hinweis bekommt. */
export const INSIGHT_MIN_DUE = 14;

/**
 * Einfache, nachvollziehbare Hinweise aus den letzten 30 Tagen (D-284). Nur wenn genug Daten da
 * sind; höchstens drei, wichtigste zuerst. Gelöschte und pausierte Aufgaben bleiben außen vor.
 */
export function insights(habits: readonly HabitInfo[], index: LogIndex, today: DayKey): Insight[] {
  const days = periodDays('30d', habits, today);
  const before = previousDays('30d', habits, today);
  const current = activeOn(habits, today);
  const found: Insight[] = [];
  for (const habit of current) {
    const rate = habitRate(habit, days, index, today);
    if (rate.rate === null || rate.due < INSIGHT_MIN_DUE) continue;
    if (rate.rate < 0.5) {
      found.push({ kind: 'oftenSkipped', habitId: habit.id, rate: rate.rate, due: rate.due });
      continue;
    }
    const change = rateChange(rate, habitRate(habit, before, index, today), 30);
    if (change !== null && change >= 20) {
      found.push({ kind: 'improving', habitId: habit.id, change });
      continue;
    }
    const byDay = weekdayRates(habit, days, index, today);
    const sum = (rows: WeekdayRate[]) =>
      rows.reduce((acc, row) => ({ done: acc.done + row.done, due: acc.due + row.due }), {
        done: 0,
        due: 0,
      });
    const week = sum(byDay.slice(0, 5));
    const weekend = sum(byDay.slice(5));
    if (week.due >= 8 && weekend.due >= 4) {
      const weekRate = week.done / week.due;
      const weekendRate = weekend.done / weekend.due;
      if (weekRate - weekendRate >= 0.3) {
        found.push({ kind: 'weekend', habitId: habit.id, weekdayRate: weekRate, weekendRate });
      }
    }
  }
  // Mehrere neue Aufgaben in den letzten 30 Tagen und die Gesamtquote fällt deutlich.
  const first = days[0];
  const added =
    first === undefined ? 0 : habits.filter((habit) => habit.fromDayKey >= first).length;
  if (added >= 2) {
    const change = rateChange(
      overallRate(habits, days, index, today),
      overallRate(habits, before, index, today),
      30,
    );
    if (change !== null && change <= -15) found.push({ kind: 'stabilize', added, change });
  }
  const order: Record<Insight['kind'], number> = {
    stabilize: 0,
    oftenSkipped: 1,
    weekend: 2,
    improving: 3,
  };
  return found.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 3);
}
