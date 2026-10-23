// Öffentliche Schnittstelle des Moduls „goals" (Zielgewicht, Wochenziel).
import type { DocDef, RootFields } from '@/shared/db';
export { goalsRoutes } from './routes';
export { WeeklyGoalCard } from './ui/WeeklyGoalCard';
export { useActiveGoals, useGoals, type ActiveGoals } from './data/useGoals';
export { listGoals } from './data/goalRepository';
export { changeTone, weeklyProgress, weightToGoal } from './calc/goals';
export { setGoal, removeGoal } from './service/goalService';
export type { Goal, GoalKind } from './model/goal';

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Ziele. Erst bei Bedarf geladen,
 * damit die Startansicht nicht wächst.
 */
export async function goalDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/goalRepository');
  return [m0.goalDef];
}
