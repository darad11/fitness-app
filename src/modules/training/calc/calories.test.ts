import { describe, expect, it } from 'vitest';
import type { SessionExercise, SessionSet } from '../model/session';
import { estimateCalories, metFor } from './calories';

const HLC = '2026-10-18T09:00:00.000Z-0000-a1b2c3d4';
const set = (id: string, status: SessionSet['status'], durationSec?: number): SessionSet => ({
  id,
  hlc: HLC,
  deletedAt: null,
  position: 0,
  type: 'working',
  actual: durationSec === undefined ? {} : { durationSec },
  status,
});
const exercise = (
  id: string,
  trackingMode: SessionExercise['trackingMode'],
  sets: SessionSet[],
): SessionExercise => ({
  id,
  hlc: HLC,
  deletedAt: null,
  position: 0,
  exerciseId: '00000000-0000-4000-8000-000000000001',
  nameSnapshot: id,
  trackingMode,
  sets,
});

describe('Kalorienschätzung nach MET (Schritt E, Q-16)', () => {
  it('ordnet MET-Werte zu; Cardio ohne Tempo bekommt keinen', () => {
    expect(metFor({ trackingMode: 'weight_reps' })).toBe(3.5);
    expect(metFor({ trackingMode: 'assisted_reps' })).toBe(3.5);
    expect(metFor({ trackingMode: 'reps' })).toBe(3);
    expect(metFor({ trackingMode: 'time' })).toBe(3);
    expect(metFor({ trackingMode: 'time_distance' })).toBeNull();
  });

  it('rechnet kcal/min = MET × 3,5 × kg ÷ 200 über die Dauer', () => {
    const session = {
      durationSec: 60 * 60,
      exercises: [exercise('a', 'weight_reps', [set('1', 'done'), set('2', 'done')])],
    };
    // 3,5 × 3,5 × 80 ÷ 200 = 4,9 kcal/min × 60 min = 294
    expect(estimateCalories(session, 80)).toEqual({
      kcal: 294,
      countedMinutes: 60,
      uncountedMinutes: 0,
    });
    expect(estimateCalories(session, undefined)).toBeNull();
    expect(estimateCalories({ ...session, durationSec: undefined }, 80)).toBeNull();
  });

  it('verteilt die Zeit nach erledigten Sätzen und zieht Cardio ohne Tempo ab', () => {
    const session = {
      durationSec: 50 * 60,
      exercises: [
        exercise('kraft', 'weight_reps', [set('1', 'done'), set('2', 'done'), set('3', 'skipped')]),
        exercise('plank', 'time', [set('4', 'done', 60), set('5', 'done', 60)]),
        exercise('laufband', 'time_distance', [set('6', 'done', 20 * 60)]),
      ],
    };
    // 30 min zählen: je zwei Sätze → 15 min bei 3,5 MET (3,5 × 3,5 × 80 / 200 = 4,9 → 73,5)
    // und 15 min bei 3,0 MET (3 × 3,5 × 80 / 200 = 4,2 → 63) = 136,5 → 137
    expect(estimateCalories(session, 80)).toEqual({
      kcal: 137,
      countedMinutes: 30,
      uncountedMinutes: 20,
    });
  });

  it('liefert 0 kcal ohne erledigte Sätze', () => {
    expect(
      estimateCalories(
        { durationSec: 600, exercises: [exercise('a', 'reps', [set('1', 'planned')])] },
        70,
      ),
    ).toEqual({
      kcal: 0,
      countedMinutes: 10,
      uncountedMinutes: 0,
    });
  });
});
