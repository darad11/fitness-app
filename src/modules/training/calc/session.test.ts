import { describe, expect, it } from 'vitest';
import type { SessionExercise, SessionSet } from '../model/session';
import {
  currentSet,
  bestOneRepMax,
  bestSet,
  checkValue,
  estimateOneRepMax,
  exerciseProgress,
  exerciseReps,
  exerciseVolume,
  nextOpenSet,
  resolveCompletion,
  sessionDurationSec,
  sessionProgress,
  sessionVolume,
  setSlot,
  suggestValues,
} from './session';

const HLC = '2026-10-18T09:00:00.000Z-0000-a1b2c3d4';
let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

function set(partial: Partial<SessionSet> & Pick<SessionSet, 'type'>, position = 0): SessionSet {
  return {
    id: id(),
    hlc: HLC,
    deletedAt: null,
    position,
    actual: {},
    status: 'planned',
    ...partial,
  };
}

function exercise(mode: SessionExercise['trackingMode'], sets: SessionSet[]): SessionExercise {
  return {
    id: id(),
    hlc: HLC,
    deletedAt: null,
    position: 0,
    exerciseId: id(),
    nameSnapshot: 'Übung',
    trackingMode: mode,
    sets: sets.map((s, i) => ({ ...s, position: i })),
  };
}

const done = (
  type: SessionSet['type'],
  actual: SessionSet['actual'],
  extra: Partial<SessionSet> = {},
) => set({ type, actual, status: 'done', ...extra });

describe('Eingabegrenzen (AK-TRN-04)', () => {
  it('akzeptiert 0 bis 500 kg und ganzzahlige 0 bis 200 Wiederholungen', () => {
    expect(checkValue('weightKg', 0)).toBeNull();
    expect(checkValue('weightKg', 72.5)).toBeNull();
    expect(checkValue('weightKg', 500)).toBeNull();
    expect(checkValue('weightKg', 500.5)).toBe('range');
    expect(checkValue('weightKg', -1)).toBe('range');
    expect(checkValue('weightKg', Number.NaN)).toBe('range');
    expect(checkValue('reps', 200)).toBeNull();
    expect(checkValue('reps', 201)).toBe('range');
    expect(checkValue('reps', 8.5)).toBe('whole');
    expect(checkValue('durationSec', 30.5)).toBe('whole');
    expect(checkValue('distanceM', 2000)).toBeNull();
    expect(checkValue('assistKg', 25)).toBeNull();
  });
});

describe('Vorschläge und „erledigt" (AK-TRN-06, D-225)', () => {
  it('schlägt Vorwerte vor, sonst feste Ziele, nie Bereiche', () => {
    const ranged = set({ type: 'working', target: { repsMin: 8, repsMax: 10, weightKg: 60 } });
    expect(suggestValues(ranged, undefined)).toEqual({ weightKg: 60 });
    expect(suggestValues(ranged, { weightKg: 62.5, reps: 9 })).toEqual({ weightKg: 62.5, reps: 9 });
    const fixed = set({ type: 'warmup', target: { repsMin: 10, repsMax: 10 } });
    expect(suggestValues(fixed, undefined)).toEqual({ reps: 10 });
    const timed = set({
      type: 'working',
      target: { durationMinSec: 30, durationMaxSec: 30, distanceM: 2000, assistKg: 20 },
    });
    expect(suggestValues(timed, undefined)).toEqual({
      durationSec: 30,
      distanceM: 2000,
      assistKg: 20,
    });
    expect(suggestValues(set({ type: 'working' }), undefined)).toEqual({});
  });

  it('übernimmt Vorschläge nur für leere Pflichtfelder und meldet fehlende', () => {
    expect(resolveCompletion('weight_reps', { reps: 8 }, { weightKg: 60, reps: 10 })).toEqual({
      values: { reps: 8, weightKg: 60 },
      missing: [],
    });
    expect(resolveCompletion('weight_reps', {}, { weightKg: 60 })).toEqual({
      values: { weightKg: 60 },
      missing: ['reps'],
    });
    expect(resolveCompletion('time_distance', {}, {}).missing).toEqual([
      'durationSec',
      'distanceM',
    ]);
    expect(resolveCompletion('assisted_reps', { assistKg: 20 }, {}).missing).toEqual(['reps']);
    expect(resolveCompletion('reps', { reps: 0 }, {}).missing).toEqual([]);
  });
});

describe('Zuordnung zu Vorwerten (AK-TRN-05)', () => {
  it('nutzt Typ und Position innerhalb des Typs; Drop-Sätze über ihren Arbeitssatz', () => {
    const w1 = set({ type: 'warmup' });
    const a = set({ type: 'working' });
    const b = set({ type: 'working' });
    const d1 = set({ type: 'drop', parentSetId: b.id });
    const d2 = set({ type: 'drop', parentSetId: b.id });
    const ex = exercise('weight_reps', [w1, a, b, d1, d2]);
    expect(setSlot(ex, w1.id)).toBe('warmup:0');
    expect(setSlot(ex, b.id)).toBe('working:1');
    expect(setSlot(ex, d2.id)).toBe('drop:1:1');
    expect(setSlot(ex, 'fehlt')).toBeNull();
  });
});

describe('Kennzahlen (data-model.md Abschnitt 9)', () => {
  it('schätzt das 1RM nach Epley nur für 1 bis 10 Wiederholungen (D-224)', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.333, 3);
    expect(estimateOneRepMax(100, 11)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
  });

  it('zählt Volumen ohne Aufwärm-, offene und gelöschte Sätze', () => {
    const ex = exercise('weight_reps', [
      done('warmup', { weightKg: 40, reps: 10 }),
      done('working', { weightKg: 60, reps: 8 }),
      done('working', { weightKg: 60, reps: 7 }),
      set({ type: 'working', actual: { weightKg: 60, reps: 8 } }),
      done('working', { weightKg: 60, reps: 8 }, { deletedAt: HLC }),
      done('working', { weightKg: 60, reps: 8 }, { status: 'skipped' }),
    ]);
    expect(exerciseVolume(ex)).toBe(900);
    expect(sessionVolume({ exercises: [ex, { ...ex, deletedAt: HLC }] })).toBe(900);
    expect(exerciseReps(ex)).toBe(0);
    expect(exerciseVolume(exercise('reps', [done('working', { reps: 12 })]))).toBe(0);
    expect(
      exerciseReps(exercise('reps', [done('warmup', { reps: 5 }), done('working', { reps: 12 })])),
    ).toBe(12);
  });

  it('wählt den besten Satz je Erfassungsart (D-241)', () => {
    const best = (mode: SessionExercise['trackingMode'], values: SessionSet['actual'][]) =>
      bestSet(
        exercise(
          mode,
          values.map((v) => done('working', v)),
        ),
      )?.actual;
    expect(
      best('weight_reps', [
        { weightKg: 80, reps: 5 },
        { weightKg: 80, reps: 6 },
        { weightKg: 75, reps: 10 },
      ]),
    ).toEqual({ weightKg: 80, reps: 6 });
    expect(best('reps', [{ reps: 10 }, { reps: 15 }])).toEqual({ reps: 15 });
    expect(best('time', [{ durationSec: 40 }, { durationSec: 30 }])).toEqual({ durationSec: 40 });
    expect(
      best('weight_time', [
        { weightKg: 20, durationSec: 40 },
        { weightKg: 20, durationSec: 60 },
      ]),
    ).toEqual({ weightKg: 20, durationSec: 60 });
    expect(
      best('time_distance', [
        { durationSec: 600, distanceM: 2000 },
        { durationSec: 300, distanceM: 2500 },
      ]),
    ).toEqual({ durationSec: 300, distanceM: 2500 });
    expect(
      best('assisted_reps', [
        { assistKg: 30, reps: 8 },
        { assistKg: 20, reps: 5 },
        { assistKg: 20, reps: 6 },
      ]),
    ).toEqual({ assistKg: 20, reps: 6 });
    expect(
      bestSet(exercise('weight_reps', [done('warmup', { weightKg: 100, reps: 1 })])),
    ).toBeNull();
  });

  it('nimmt das höchste geschätzte 1RM, nur bei Gewicht × Wiederholungen', () => {
    const ex = exercise('weight_reps', [
      done('working', { weightKg: 100, reps: 5 }),
      done('working', { weightKg: 110, reps: 1 }),
      done('working', { weightKg: 60, reps: 15 }),
    ]);
    expect(bestOneRepMax(ex)).toBeCloseTo(116.667, 3);
    expect(bestOneRepMax(exercise('reps', [done('working', { reps: 5 })]))).toBeNull();
    expect(
      bestOneRepMax(exercise('weight_reps', [done('working', { weightKg: 60, reps: 15 })])),
    ).toBeNull();
  });

  it('rechnet die Dauer ohne Pausen', () => {
    const startedAt = '2026-10-18T09:00:00.000Z';
    const now = new Date('2026-10-18T10:00:00.000Z');
    expect(sessionDurationSec({ startedAt, pauses: [] }, now)).toBe(3600);
    expect(
      sessionDurationSec(
        {
          startedAt,
          pauses: [
            { start: '2026-10-18T09:10:00.000Z', end: '2026-10-18T09:20:00.000Z' },
            { start: '2026-10-18T09:50:00.000Z' },
          ],
        },
        now,
      ),
    ).toBe(2400);
    expect(
      sessionDurationSec({ startedAt, endedAt: '2026-10-18T09:30:00.000Z', pauses: [] }, now),
    ).toBe(1800);
  });

  it('zählt Fortschritt ohne übersprungene Sätze und findet den nächsten offenen Satz', () => {
    const a = exercise('weight_reps', [
      done('working', { weightKg: 1, reps: 1 }),
      set({ type: 'working', status: 'skipped' }),
      set({ type: 'working' }),
    ]);
    const b = exercise('reps', [set({ type: 'working' })]);
    b.position = 1;
    expect(exerciseProgress(a)).toEqual({ done: 1, skipped: 1, total: 2 });
    expect(sessionProgress({ exercises: [a, b] })).toEqual({ done: 1, skipped: 1, total: 3 });
    const session = { exercises: [a, b] };
    expect(nextOpenSet(session, a.sets[0]!.id)?.set.id).toBe(a.sets[2]!.id);
    expect(nextOpenSet(session, a.sets[2]!.id)?.set.id).toBe(b.sets[0]!.id);
    expect(nextOpenSet(session, b.sets[0]!.id)?.set.id).toBe(a.sets[2]!.id);
    expect(nextOpenSet(session)?.set.id).toBe(a.sets[2]!.id);
    expect(
      nextOpenSet({ exercises: [exercise('reps', [done('working', { reps: 1 })])] }),
    ).toBeNull();
  });

  it('hebt den nächsten offenen Satz nach dem zuletzt erledigten hervor', () => {
    const a = exercise('weight_reps', [
      done('working', { weightKg: 1, reps: 1 }, { completedAt: '2026-10-18T09:10:00.000Z' }),
      set({ type: 'working' }),
      set({ type: 'working' }),
    ]);
    const b = exercise('reps', [
      done('working', { reps: 5 }, { completedAt: '2026-10-18T09:20:00.000Z' }),
      set({ type: 'working' }),
    ]);
    b.position = 1;
    expect(currentSet({ exercises: [a, b] })?.id).toBe(b.sets[1]!.id);
    expect(
      currentSet({ exercises: [exercise('reps', [set({ type: 'working' })])] }),
    ).not.toBeNull();
    expect(currentSet({ exercises: [] })).toBeNull();
  });
});
