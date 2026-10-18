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
 * Beendet eine Aufgabe ab heute: Sie bleibt für vergangene Tage und die Serie erhalten und
 * verschwindet aus der Liste. „Rückgängig“ ist 10 s lang möglich.
 */
export function endHabit(rt: DbRuntime, id: string, clock: Clock = {}): Promise<Habit> {
  const today = todayOf(clock);
  const at = nowOf(clock).toISOString();
  return updateDoc(rt, habitDef, id, (current) => ({
    ...current,
    toDayKey: today,
    archivedAt: at,
  }));
}

export function reopenHabit(rt: DbRuntime, id: string): Promise<Habit> {
  return updateDoc(rt, habitDef, id, (current) => {
    const { toDayKey: _to, archivedAt: _at, ...rest } = current;
    return rest;
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
