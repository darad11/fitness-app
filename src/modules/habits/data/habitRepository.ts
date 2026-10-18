import { type AppDb, type DocDef } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import {
  HABIT_SCHEMA_VERSION,
  habitLogSchema,
  habitSchema,
  type Habit,
  type HabitLog,
} from '../model/habit';

export const habitDef: DocDef<Habit> = {
  type: 'habit',
  schemaVersion: HABIT_SCHEMA_VERSION,
  schema: habitSchema,
  table: (db) => db.habits,
};

export const habitLogDef: DocDef<HabitLog> = {
  type: 'habit_log',
  schemaVersion: HABIT_SCHEMA_VERSION,
  schema: habitLogSchema,
  table: (db) => db.habitLogs,
};

/** Eine ID je Aufgabe und Tag (K-20). */
export function habitLogId(habitId: string, dayKey: string): string {
  return stableId(`habit_log:${habitId}:${dayKey}`);
}

/** Alle nicht gelöschten Aufgaben nach Position, auch beendete (für Serie und Verlauf). */
export async function listHabits(db: AppDb): Promise<Habit[]> {
  const rows = await db.habits.toArray();
  const habits = rows.flatMap((row) => {
    if (row.type !== 'habit' || row.deletedAt !== null) return [];
    const parsed = habitSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  habits.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  return habits;
}

/** Einträge ab einem Tag (einschließlich); ohne Angabe alle. */
export async function listHabitLogs(db: AppDb, fromDayKey?: string): Promise<HabitLog[]> {
  const rows = fromDayKey
    ? await db.habitLogs.where('dayKey').aboveOrEqual(fromDayKey).toArray()
    : await db.habitLogs.toArray();
  return rows.flatMap((row) => {
    if (row.type !== 'habit_log' || row.deletedAt !== null) return [];
    const parsed = habitLogSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
