import { addDays, isoWeekday, type DayKey } from '@/shared/lib/time';

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
 * Aufgaben, die an einem Tag gelten: ab dem Tag des Anlegens bis vor den Tag des Pausierens
 * oder Löschens, ohne frühere Pausen und nur an ihren Wochentagen (D-285).
 */
export function activeOn<T extends HabitLike>(habits: readonly T[], dayKey: DayKey): T[] {
  return habits.filter(
    (habit) =>
      habit.fromDayKey <= dayKey &&
      (habit.toDayKey === undefined || dayKey < habit.toDayKey) &&
      !(habit.pauses ?? []).some(
        (pause) => pause.fromDayKey <= dayKey && dayKey < pause.toDayKey,
      ) &&
      (weekdaysOn(habit, dayKey)?.includes(isoWeekday(dayKey)) ?? true),
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

export interface Streak {
  /** Zahl der Tage in Folge mit allen Aufgaben erledigt. */
  days: number;
  /** Zählt der heutige Tag schon mit? Sonst endet die Serie gestern und heute ist noch offen. */
  includesToday: boolean;
}

/**
 * Serie (TH-04, AH-05): aufeinanderfolgende Tage, an denen alle geltenden Aufgaben erledigt
 * waren, bis heute oder bis gestern, solange heute noch offen ist. Tage ohne geltende Aufgabe
 * zählen nicht und unterbrechen; die Zählung endet spätestens 400 Tage zurück.
 */
export function streak(
  habits: readonly HabitLike[],
  logs: readonly LogLike[],
  today: DayKey,
): Streak {
  const includesToday = dayStatus(habits, logs, today).complete;
  let day = includesToday ? today : addDays(today, -1);
  let days = 0;
  while (days < 400 && dayStatus(habits, logs, day).complete) {
    days += 1;
    day = addDays(day, -1);
  }
  return { days, includesToday };
}

/** Die letzten n Tage, ältester zuerst, mit Status; für die Übersicht. */
export function recentDays(
  habits: readonly HabitLike[],
  logs: readonly LogLike[],
  today: DayKey,
  n: number,
): { dayKey: DayKey; status: DayStatus }[] {
  const days: { dayKey: DayKey; status: DayStatus }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dayKey = addDays(today, -i);
    days.push({ dayKey, status: dayStatus(habits, logs, dayKey) });
  }
  return days;
}

/** Ein kurzer Satz je Tag, deterministisch aus dem Tag gewählt. */
export function pickDaily<T>(items: readonly T[], dayKey: DayKey): T | undefined {
  if (items.length === 0) return undefined;
  let hash = 0;
  for (const char of dayKey) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  return items[hash % items.length];
}
