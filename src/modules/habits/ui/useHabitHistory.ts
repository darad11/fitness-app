import { useMemo } from 'react';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { useToday } from '@/shared/ui/useToday';
import { indexLogs, type LogIndex } from '../calc/insights';
import { useHabitLogs, useHabits } from '../data/useHabits';
import type { Habit } from '../model/habit';

export interface HabitHistory {
  today: string;
  /** Alle Aufgaben, auch pausierte und gelöschte (für die Vergangenheit). */
  habits: Habit[];
  index: LogIndex;
}

/** Alle Aufgaben und Einträge für die Auswertung; `undefined` beim Laden. */
export function useHabitHistory(): HabitHistory | undefined {
  const now = useToday();
  const today = dayKey(now, localTimeZone());
  const habits = useHabits();
  const logs = useHabitLogs();
  return useMemo(
    () => (habits && logs ? { today, habits, index: indexLogs(logs) } : undefined),
    [habits, logs, today],
  );
}
