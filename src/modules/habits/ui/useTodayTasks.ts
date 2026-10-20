import { useMemo } from 'react';
import { addDays, dayKey, localTimeZone } from '@/shared/lib/time';
import { useToday } from '@/shared/ui/useToday';
import { activeOn, dayStatus } from '../calc/streak';
import { useHabitLogs, useHabits } from '../data/useHabits';
import type { Habit, HabitLog } from '../model/habit';

/** Wie weit die Übersicht zurückschaut; ältere Einträge werden nicht geladen. */
const LOOKBACK_DAYS = 30;

export interface TodayTasks {
  today: string;
  habits: Habit[];
  active: Habit[];
  logs: HabitLog[];
  doneIds: ReadonlySet<string>;
  status: ReturnType<typeof dayStatus>;
}

/** Aufgaben, Einträge und Stand für heute; `undefined` beim Laden. Der Tag wechselt mit der Uhr. */
export function useTodayTasks(): TodayTasks | undefined {
  const now = useToday();
  const today = dayKey(now, localTimeZone());
  const habits = useHabits();
  const logs = useHabitLogs(addDays(today, -LOOKBACK_DAYS));
  return useMemo(() => {
    if (!habits || !logs) return undefined;
    const active = activeOn(habits, today);
    const doneIds = new Set(
      logs.filter((log) => log.dayKey === today && log.done).map((log) => log.habitId),
    );
    return {
      today,
      habits,
      active,
      logs,
      doneIds,
      status: dayStatus(habits, logs, today),
    };
  }, [habits, logs, today]);
}
