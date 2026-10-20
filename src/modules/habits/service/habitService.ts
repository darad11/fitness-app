import {
  insertDoc,
  restoreDoc,
  softDeleteDoc,
  updateDoc,
  upsertDoc,
  type DbRuntime,
} from '@/shared/db';
import { dayKey, localTimeZone, type DayKey } from '@/shared/lib/time';
import { habitDef, habitLogDef, habitLogId, listHabits } from '../data/habitRepository';
import { HABIT_NAME_MAX, type Habit, type HabitLog } from '../model/habit';

export interface Clock {
  now?: () => Date;
}

export class InvalidNameError extends Error {
  override name = 'InvalidNameError';
}

const nowOf = (clock: Clock) => (clock.now ?? (() => new Date()))();
const todayOf = (clock: Clock): DayKey => dayKey(nowOf(clock), localTimeZone());

function cleanName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0 || trimmed.length > HABIT_NAME_MAX) {
    throw new InvalidNameError('Name fehlt oder ist zu lang');
  }
  return trimmed;
}

/** Legt eine Aufgabe an; sie gilt ab heute und steht am Ende der Liste (AH-03, Q-17). */
export async function addHabit(rt: DbRuntime, name: string, clock: Clock = {}): Promise<Habit> {
  const cleaned = cleanName(name);
  const existing = await listHabits(rt.db);
  const position = Math.max(-1, ...existing.map((habit) => habit.position)) + 1;
  return insertDoc(rt, habitDef, { name: cleaned, position, fromDayKey: todayOf(clock) });
}

export async function renameHabit(rt: DbRuntime, id: string, name: string): Promise<Habit> {
  const cleaned = cleanName(name);
  return updateDoc(rt, habitDef, id, (current) => ({ ...current, name: cleaned }));
}

/** Tauscht die Position mit der Nachbarin in der Liste der aktiven Aufgaben. */
export async function moveHabit(rt: DbRuntime, id: string, direction: -1 | 1): Promise<void> {
  const active = (await listHabits(rt.db)).filter((habit) => habit.toDayKey === undefined);
  const index = active.findIndex((habit) => habit.id === id);
  const self = active[index];
  const other = active[index + direction];
  if (!self || !other) return;
  await rt.db.transaction('rw', rt.db.habits, rt.db.meta, async () => {
    await updateDoc(rt, habitDef, self.id, (current) => ({ ...current, position: other.position }));
    await updateDoc(rt, habitDef, other.id, (current) => ({ ...current, position: self.position }));
  });
}

/**
 * Pausiert eine Aufgabe ab heute (D-283): Sie gilt ab heute nicht mehr, vergangene Tage bleiben
 * erhalten, unter „Pausiert“ lässt sie sich wieder aufnehmen. „Rückgängig“ ist 10 s lang möglich.
 */
export function endHabit(rt: DbRuntime, id: string, clock: Clock = {}): Promise<Habit> {
  const today = todayOf(clock);
  const at = nowOf(clock).toISOString();
  return updateDoc(rt, habitDef, id, (current) => ({
    ...current,
    toDayKey: current.toDayKey ?? today,
    archivedAt: current.archivedAt ?? at,
  }));
}

/**
 * Nimmt eine pausierte oder gelöschte Aufgabe ab heute wieder auf. Lag die Pause vor heute, wird
 * sie als frühere Pause gemerkt, damit diese Tage nicht nachträglich als offen zählen.
 */
export function reopenHabit(rt: DbRuntime, id: string, clock: Clock = {}): Promise<Habit> {
  const today = todayOf(clock);
  return updateDoc(rt, habitDef, id, (current) => {
    const { toDayKey, archivedAt: _at, removedAt: _removed, ...rest } = current;
    if (toDayKey === undefined || toDayKey >= today) return rest;
    return {
      ...rest,
      pauses: [...(current.pauses ?? []), { fromDayKey: toDayKey, toDayKey: today }],
    };
  });
}

/**
 * Löscht eine Aufgabe aus der Liste (D-283): Sie erscheint nicht mehr, auch nicht unter
 * „Pausiert“; vergangene Tage behalten sie, damit ihr Stand stimmt. „Rückgängig“ 10 s lang.
 */
export function removeHabit(rt: DbRuntime, id: string, clock: Clock = {}): Promise<Habit> {
  const today = todayOf(clock);
  const at = nowOf(clock).toISOString();
  return updateDoc(rt, habitDef, id, (current) => ({
    ...current,
    toDayKey: current.toDayKey ?? today,
    archivedAt: current.archivedAt ?? at,
    removedAt: at,
  }));
}

/** „Rückgängig“ nach Pausieren oder Löschen: stellt Gültigkeit und Pausen wie vorher her. */
export function undoHabitChange(rt: DbRuntime, before: Habit): Promise<Habit> {
  return updateDoc(rt, habitDef, before.id, (current) => {
    const {
      toDayKey: _to,
      archivedAt: _at,
      removedAt: _removed,
      pauses: _pauses,
      ...rest
    } = current;
    return {
      ...rest,
      ...(before.toDayKey !== undefined ? { toDayKey: before.toDayKey } : {}),
      ...(before.archivedAt !== undefined ? { archivedAt: before.archivedAt } : {}),
      ...(before.removedAt !== undefined ? { removedAt: before.removedAt } : {}),
      ...(before.pauses !== undefined ? { pauses: before.pauses } : {}),
    };
  });
}

/** Löscht eine Aufgabe weich samt Vergangenheit; nur für Fehleingaben vom selben Tag gedacht. */
export async function deleteHabit(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, habitDef, id, 'active');
}

export function restoreHabit(rt: DbRuntime, id: string): Promise<Habit> {
  return restoreDoc(rt, habitDef, id);
}

/** Hakt eine Aufgabe für einen Tag ab oder nimmt es zurück; ein Dokument je Aufgabe und Tag. */
export function setHabitDone(
  rt: DbRuntime,
  habitId: string,
  day: DayKey,
  done: boolean,
  clock: Clock = {},
): Promise<HabitLog> {
  const at = nowOf(clock).toISOString();
  return upsertDoc(rt, habitLogDef, habitLogId(habitId, day), () => ({
    habitId,
    dayKey: day,
    done,
    ...(done ? { doneAt: at } : {}),
  }));
}

export class InvalidWeekdaysError extends Error {
  override name = 'InvalidWeekdaysError';
}

/**
 * Wochentage ändern (D-285): gilt ab heute, frühere Tage behalten ihre Regel. Eine Änderung am
 * selben Tag ersetzt die von heute. Alle sieben Tage heißt wieder „jeden Tag“.
 */
export async function setHabitWeekdays(
  rt: DbRuntime,
  id: string,
  weekdays: readonly number[],
  clock: Clock = {},
): Promise<Habit> {
  const days = [...new Set(weekdays)].filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b);
  if (days.length === 0) throw new InvalidWeekdaysError('Mindestens ein Wochentag');
  const today = todayOf(clock);
  return updateDoc(rt, habitDef, id, (current) => {
    const earlier = (current.schedule ?? []).filter((entry) => entry.fromDayKey < today);
    const before = earlier.at(-1)?.weekdays ?? [1, 2, 3, 4, 5, 6, 7];
    const same = before.length === days.length && before.every((day, i) => day === days[i]);
    const { schedule: _schedule, ...rest } = current;
    const next = same ? earlier : [...earlier, { fromDayKey: today, weekdays: days }];
    return next.length === 0 ? rest : { ...rest, schedule: next };
  });
}

/** Automatisch abhaken ein- oder ausschalten (D-285). */
export function setHabitAutoDone(
  rt: DbRuntime,
  id: string,
  autoDone: 'training' | null,
): Promise<Habit> {
  return updateDoc(rt, habitDef, id, (current) => {
    const { autoDone: _auto, ...rest } = current;
    return autoDone ? { ...rest, autoDone } : rest;
  });
}

/**
 * Hakt Aufgaben mit `autoDone: 'training'` ab, wenn heute ein Training abgeschlossen ist (D-285).
 * Nur wenn es für heute noch keinen Eintrag gibt: Wer selbst zurücknimmt, wird nicht überstimmt.
 */
export async function applyAutoDone(
  rt: DbRuntime,
  habits: readonly Habit[],
  today: DayKey,
  hasLog: (habitId: string) => boolean,
  trainedToday: boolean,
  clock: Clock = {},
): Promise<number> {
  if (!trainedToday) return 0;
  let count = 0;
  for (const habit of habits) {
    if (habit.autoDone !== 'training' || hasLog(habit.id)) continue;
    await setHabitDone(rt, habit.id, today, true, clock);
    count += 1;
  }
  return count;
}
