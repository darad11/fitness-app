import { describe, expect, it } from 'vitest';
import type { Goal } from '../model/goal';
import { activeGoal, changeTone, weeklyProgress, weightToGoal } from './goals';

const goal = (
  id: string,
  kind: Goal['kind'],
  value: number,
  effectiveFrom: string,
  extra: Partial<Goal> = {},
): Goal => ({
  id,
  type: 'goal',
  schemaVersion: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
  hlc: `2026-10-01T10:00:00.000Z-000${id}-a1b2c3d4`,
  deletedAt: null,
  deviceId: 'a1b2c3d4',
  kind,
  value,
  effectiveFrom,
  ...extra,
});

describe('Aktives Ziel (data-model.md 3.6)', () => {
  it('nimmt das jüngste nicht beendete Ziel je Art, bei Gleichstand den jüngeren HLC', () => {
    const goals = [
      goal('1', 'body_weight', 80, '2026-09-01', { endedAt: '2026-10-01T10:00:00.000Z' }),
      goal('2', 'body_weight', 78, '2026-10-01'),
      goal('3', 'body_weight', 77, '2026-10-01'),
      goal('4', 'weekly_sessions', 3, '2026-10-05'),
      goal('5', 'weekly_sessions', 4, '2026-10-02', {
        deletedAt: '2026-10-06T10:00:00.000Z-0000-a1b2c3d4',
      }),
    ];
    expect(activeGoal(goals, 'body_weight')?.id).toBe('3');
    expect(activeGoal(goals, 'weekly_sessions')?.id).toBe('4');
    expect(activeGoal([], 'body_weight')).toBeUndefined();
  });
});

describe('Wochenziel (AK-DSH-05, D-220)', () => {
  it('zählt Einheiten von Montag bis Sonntag der laufenden Woche', () => {
    const sessions = [
      { dayKey: '2026-10-11' }, // Sonntag der Vorwoche
      { dayKey: '2026-10-12' }, // Montag
      { dayKey: '2026-10-15' },
      { dayKey: '2026-10-18' }, // Sonntag
      { dayKey: '2026-10-19' }, // nächste Woche
    ];
    expect(weeklyProgress(sessions, 3, '2026-10-18')).toEqual({
      done: 3,
      target: 3,
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      reached: true,
    });
    expect(weeklyProgress(sessions, 4, '2026-10-14').reached).toBe(false);
  });
});

describe('Zielgewicht', () => {
  it('berechnet den Abstand und erkennt das Erreichen', () => {
    expect(weightToGoal(80.4, 78)).toEqual({ diffKg: 2.4, reached: false });
    expect(weightToGoal(77.8, 78)).toEqual({ diffKg: -0.2, reached: true });
    expect(weightToGoal(70, 75)).toEqual({ diffKg: -5, reached: false });
  });
  it('färbt nur in Richtung Ziel', () => {
    expect(changeTone(-1.2, 80, 75)).toBe('toward');
    expect(changeTone(1.2, 80, 75)).toBe('neutral');
    expect(changeTone(1.2, 80, 85)).toBe('toward');
    expect(changeTone(-1.2, 80, undefined)).toBe('neutral');
    expect(changeTone(0, 80, 75)).toBe('neutral');
  });
});
