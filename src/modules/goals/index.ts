// Öffentliche Schnittstelle des Moduls „goals" (Zielgewicht, Wochenziel).
export { goalsRoutes } from './routes';
export { GoalsPanel } from './ui/GoalsPanel';
export { WeeklyGoalCard } from './ui/WeeklyGoalCard';
export { useActiveGoals, useGoals, type ActiveGoals } from './data/useGoals';
export { listGoals } from './data/goalRepository';
export { changeTone, weeklyProgress, weightToGoal } from './calc/goals';
export { setGoal, removeGoal } from './service/goalService';
export type { Goal, GoalKind } from './model/goal';
