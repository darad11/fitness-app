import { isoWeekday, type DayKey } from '@/shared/lib/time';

/**
 * Welche Tagesaufgaben an einem Tag gelten und wie viele davon erledigt sind (D-253, D-283, D-285).
 * Eine Serie gibt es nicht mehr (Leitplanken Regel 2; F4, D-318).
 */

export interface HabitLike {
  id: string;
  fromDayKey: DayKey;
  toDayKey?: DayKey;
  pauses?: readonly { fromDayKey: DayKey; toDayKey: DayKey }[];
  schedule?: readonly { fromDayKey: DayKey; weekdays: readonly number[] }[];
}

/** Wochentage, die an einem Tag gelten (D-285); `null` heißt jeder Tag. */
export function weekdaysOn(habit: HabitLike, dayKey: DayKey): readonly number[] | null {
  let current: readonly number[] | null = null;
  for (const entry of habit.schedule ?? []) {
    if (entry.fromDayKey <= dayKey) current = entry.weekdays;
  }
  return current === null || current.length === 7 ? null : current;
}

export interface LogLike {
  habitId: string;
  dayKey: DayKey;
  done: boolean;
}

/**
 * Aufgaben, die an einem Tag laufen: ab dem Tag des Anlegens bis vor den Tag des Pausierens oder
 * Löschens, ohne frühere Pausen, unabhängig vom Wochentag (D-01: Hinweise zu einer Aufgabe für
 * Mo/Mi/Fr erschienen sonst nur an diesen Tagen).
 */
export function runningOn<T extends HabitLike>(habits: readonly T[], dayKey: DayKey): T[] {
  return habits.filter(
    (habit) =>
      habit.fromDayKey <= dayKey &&
      (habit.toDayKey === undefined || dayKey < habit.toDayKey) &&
      !(habit.pauses ?? []).some((pause) => pause.fromDayKey <= dayKey && dayKey < pause.toDayKey),
  );
}

/** Aufgaben, die an einem Tag gelten: laufend und an ihren Wochentagen (D-285). */
export function activeOn<T extends HabitLike>(habits: readonly T[], dayKey: DayKey): T[] {
  return runningOn(habits, dayKey).filter(
    (habit) => weekdaysOn(habit, dayKey)?.includes(isoWeekday(dayKey)) ?? true,
  );
}

export interface DayStatus {
  total: number;
  done: number;
  /** Mindestens eine Aufgabe und alle erledigt. */
  complete: boolean;
}

export function dayStatus(
  habits: readonly HabitLike[],
  logs: readonly LogLike[],
  dayKey: DayKey,
): DayStatus {
  const active = activeOn(habits, dayKey);
  const doneIds = new Set(
    logs.filter((log) => log.dayKey === dayKey && log.done).map((log) => log.habitId),
  );
  const done = active.filter((habit) => doneIds.has(habit.id)).length;
  return { total: active.length, done, complete: active.length > 0 && done === active.length };
}
