import { addDays, startOfWeek, type DayKey } from '@/shared/lib/time';
import type { Goal, GoalKind } from '../model/goal';

/**
 * Aktives Ziel je Art: jüngstes `effectiveFrom` ohne `endedAt`; bei Gleichstand der jüngere HLC
 * (data-model.md Abschnitt 3.6).
 */
export function activeGoal(goals: readonly Goal[], kind: GoalKind): Goal | undefined {
  return goals
    .filter((goal) => goal.kind === kind && goal.endedAt === undefined && goal.deletedAt === null)
    .sort(
      (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.hlc.localeCompare(a.hlc),
    )[0];
}

export interface WeeklyProgress {
  done: number;
  target: number;
  weekStart: DayKey;
  weekEnd: DayKey;
  reached: boolean;
}

/** „x von y Trainings diese Woche“, Montag bis Sonntag (AK-DSH-05, D-220); alle abgeschlossenen Einheiten zählen. */
export function weeklyProgress(
  sessions: readonly { dayKey: DayKey }[],
  target: number,
  today: DayKey,
): WeeklyProgress {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const done = sessions.filter((s) => s.dayKey >= weekStart && s.dayKey <= weekEnd).length;
  return { done, target, weekStart, weekEnd, reached: done >= target };
}

export interface WeightToGoal {
  /** Positiv: noch zu verlieren; negativ: noch zuzunehmen. */
  diffKg: number;
  reached: boolean;
}

/** Abstand des letzten Gewichts zum Zielgewicht; erreicht bei höchstens 0,3 kg Abstand. */
export function weightToGoal(latestKg: number, goalKg: number): WeightToGoal {
  const diffKg = Math.round((latestKg - goalKg) * 10) / 10;
  return { diffKg, reached: Math.abs(diffKg) <= 0.3 };
}

export type ChangeTone = 'toward' | 'neutral';

/**
 * Farbe einer Gewichtsveränderung (design-system.md 8.3, AK-BW-06): in Richtung Ziel „toward“,
 * vom Ziel weg oder ohne Ziel neutral; nie Rot.
 */
export function changeTone(
  changeKg: number,
  latestKg: number,
  goalKg: number | undefined,
): ChangeTone {
  if (goalKg === undefined || changeKg === 0) return 'neutral';
  const before = latestKg - changeKg;
  return Math.abs(latestKg - goalKg) < Math.abs(before - goalKg) ? 'toward' : 'neutral';
}
