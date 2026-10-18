import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { activeGoal } from '../calc/goals';
import { listGoals } from '../data/goalRepository';
import { InvalidGoalError, removeGoal, setGoal } from './goalService';

let rt: DbRuntime;
const at = (iso: string) => ({ now: () => new Date(iso) });
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

describe('Ziele setzen, ändern, entfernen (AK-SET-01)', () => {
  it('legt ein Ziel ab heute an und beendet das bisherige bei einer Änderung', async () => {
    const first = await setGoal(rt, 'body_weight', 78.26, at('2026-10-10T10:00:00.000Z'));
    expect(first).toMatchObject({ type: 'goal', kind: 'body_weight', value: 78.3 });
    expect(first.effectiveFrom).toMatch(/^2026-10-(09|10)$/);
    const same = await setGoal(rt, 'body_weight', 78.3, at('2026-10-12T10:00:00.000Z'));
    expect(same.id).toBe(first.id);
    const second = await setGoal(rt, 'body_weight', 76, at('2026-10-15T10:00:00.000Z'));
    const goals = await listGoals(rt.db);
    expect(goals).toHaveLength(2);
    expect(goals.find((g) => g.id === first.id)?.endedAt).toBe('2026-10-15T10:00:00.000Z');
    expect(activeGoal(goals, 'body_weight')?.id).toBe(second.id);
  });

  it('prüft die Grenzen je Art', async () => {
    await expect(setGoal(rt, 'body_weight', 29.9)).rejects.toBeInstanceOf(InvalidGoalError);
    await expect(setGoal(rt, 'weekly_sessions', 8)).rejects.toBeInstanceOf(InvalidGoalError);
    await expect(setGoal(rt, 'weekly_sessions', 0)).rejects.toBeInstanceOf(InvalidGoalError);
    expect((await setGoal(rt, 'weekly_sessions', 3.4)).value).toBe(3);
    expect(await listGoals(rt.db)).toHaveLength(1);
  });

  it('entfernt das aktive Ziel und behält die Historie', async () => {
    await setGoal(rt, 'weekly_sessions', 3, at('2026-10-10T10:00:00.000Z'));
    await removeGoal(rt, 'weekly_sessions', at('2026-10-12T10:00:00.000Z'));
    const goals = await listGoals(rt.db);
    expect(goals).toHaveLength(1);
    expect(goals[0]?.endedAt).toBe('2026-10-12T10:00:00.000Z');
    expect(activeGoal(goals, 'weekly_sessions')).toBeUndefined();
    await removeGoal(rt, 'weekly_sessions');
    expect(await listGoals(rt.db)).toHaveLength(1);
  });
});
