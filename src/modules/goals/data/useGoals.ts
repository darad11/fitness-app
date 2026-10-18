import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useDb } from '@/shared/db';
import { activeGoal } from '../calc/goals';
import type { Goal } from '../model/goal';
import { listGoals } from './goalRepository';

/** Alle Ziele, neueste zuerst, reaktiv; `undefined` beim Laden. */
export function useGoals(): Goal[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listGoals(db), [db]);
}

export interface ActiveGoals {
  bodyWeightKg?: number;
  weeklySessions?: number;
}

/** Aktive Ziele; `undefined` beim Laden. */
export function useActiveGoals(): ActiveGoals | undefined {
  const goals = useGoals();
  return useMemo(() => {
    if (!goals) return undefined;
    const weight = activeGoal(goals, 'body_weight');
    const weekly = activeGoal(goals, 'weekly_sessions');
    return {
      ...(weight ? { bodyWeightKg: weight.value } : {}),
      ...(weekly ? { weeklySessions: weekly.value } : {}),
    };
  }, [goals]);
}
