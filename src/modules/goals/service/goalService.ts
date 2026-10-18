import { insertDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { activeGoal } from '../calc/goals';
import { goalDef, listGoals } from '../data/goalRepository';
import { GOAL_LIMITS, type Goal, type GoalKind } from '../model/goal';

export interface Clock {
  now?: () => Date;
}

export class InvalidGoalError extends Error {
  override name = 'InvalidGoalError';
}

const nowOf = (clock: Clock) => (clock.now ?? (() => new Date()))();

function normalize(kind: GoalKind, value: number): number {
  const limits = GOAL_LIMITS[kind];
  const rounded = kind === 'body_weight' ? Math.round(value * 10) / 10 : Math.round(value);
  if (!Number.isFinite(rounded) || rounded < limits.min || rounded > limits.max) {
    throw new InvalidGoalError('Wert außerhalb des Bereichs');
  }
  return rounded;
}

/**
 * Setzt ein Ziel: Das bisherige aktive Ziel derselben Art wird beendet, ein neues gilt ab heute
 * (AK-SET-01). Derselbe Wert erneut ändert nichts.
 */
export async function setGoal(
  rt: DbRuntime,
  kind: GoalKind,
  value: number,
  clock: Clock = {},
): Promise<Goal> {
  const normalized = normalize(kind, value);
  const now = nowOf(clock);
  const today = dayKey(now, localTimeZone());
  return rt.db.transaction('rw', rt.db.goals, rt.db.meta, async () => {
    const current = activeGoal(await listGoals(rt.db), kind);
    if (current?.value === normalized) return current;
    if (current) {
      await updateDoc(rt, goalDef, current.id, (goal) => ({ ...goal, endedAt: now.toISOString() }));
    }
    return insertDoc(rt, goalDef, { kind, value: normalized, effectiveFrom: today });
  });
}

/** Beendet das aktive Ziel einer Art; die Historie bleibt (AK-SET-01). */
export async function removeGoal(rt: DbRuntime, kind: GoalKind, clock: Clock = {}): Promise<void> {
  const now = nowOf(clock);
  await rt.db.transaction('rw', rt.db.goals, rt.db.meta, async () => {
    const current = activeGoal(await listGoals(rt.db), kind);
    if (!current) return;
    await updateDoc(rt, goalDef, current.id, (goal) => ({ ...goal, endedAt: now.toISOString() }));
  });
}
