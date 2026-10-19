import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { Habit, HabitLog } from '../model/habit';
import { listHabitLogs, listHabits } from './habitRepository';

/** Aufgaben nach Position, reaktiv; `undefined` beim Laden. */
export function useHabits(): Habit[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listHabits(db), [db]);
}

/** Einträge ab einem Tag, reaktiv; `undefined` beim Laden. */
export function useHabitLogs(fromDayKey?: string): HabitLog[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listHabitLogs(db, fromDayKey), [db, fromDayKey]);
}
