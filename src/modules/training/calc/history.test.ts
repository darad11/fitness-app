import { describe, expect, it } from 'vitest';
import type { Session, SessionExercise, SessionSet } from '../model/session';
import { buildHistoryRows, previousValues } from './history';

const HLC = '2026-10-18T09:00:00.000Z-0000-a1b2c3d4';
const EX = '11111111-1111-4111-8111-111111111111';
let n = 0;
const uid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

const set = (
  actual: SessionSet['actual'],
  status: SessionSet['status'] = 'done',
  type: SessionSet['type'] = 'working',
): SessionSet => ({
  id: uid(),
  hlc: HLC,
  deletedAt: null,
  position: 0,
  type,
  actual,
  status,
});
const exercise = (position: number, sets: SessionSet[]): SessionExercise => ({
  id: uid(),
  hlc: HLC,
  deletedAt: null,
  position,
  exerciseId: EX,
  nameSnapshot: 'Bankdrücken',
  trackingMode: 'weight_reps',
  sets: sets.map((s, i) => ({ ...s, position: i })),
});

function session(exercises: SessionExercise[], status: Session['status'] = 'completed'): Session {
  return {
    id: uid(),
    type: 'session',
    schemaVersion: 1,
    createdAt: '2026-10-18T09:00:00.000Z',
    hlc: HLC,
    deletedAt: null,
    deviceId: 'a1b2c3d4',
    kind: 'strength',
    source: 'free',
    status,
    title: 'Freies Training',
    dayKey: '2026-10-18',
    tz: 'Europe/Vienna',
    startedAt: '2026-10-18T09:00:00.000Z',
    ...(status === 'completed' ? { endedAt: '2026-10-18T10:00:00.000Z', durationSec: 3600 } : {}),
    pauses: [],
    exerciseIds: [EX],
    exercises,
  };
}

describe('Projektion exerciseHistory', () => {
  it('fasst eine mehrfach vorkommende Übung zusammen und zählt fortlaufend', () => {
    const s = session([
      exercise(0, [
        set({ weightKg: 40, reps: 10 }, 'done', 'warmup'),
        set({ weightKg: 60, reps: 8 }),
      ]),
      exercise(1, [set({ weightKg: 65, reps: 5 }), set({}, 'skipped')]),
    ]);
    const [row] = buildHistoryRows(s);
    expect(row).toMatchObject({
      id: `${s.id}:${EX}`,
      completedAt: '2026-10-18T10:00:00.000Z',
      volumeKg: 805,
      setCount: 2,
      best: { weightKg: 65, reps: 5 },
    });
    expect(row!.sets.map((x) => x.slot)).toEqual(['warmup:0', 'working:0', 'working:1']);
    expect(previousValues(row, 'working:1')).toEqual({ weightKg: 65, reps: 5 });
    expect(previousValues(row, null)).toBeUndefined();
  });

  it('erzeugt nur für abgeschlossene Einheiten Zeilen', () => {
    expect(
      buildHistoryRows(session([exercise(0, [set({ weightKg: 60, reps: 8 })])], 'in_progress')),
    ).toEqual([]);
  });
});
