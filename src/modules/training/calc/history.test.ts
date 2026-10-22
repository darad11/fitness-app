import { describe, expect, it } from 'vitest';
import type { Session, SessionExercise, SessionSet } from '../model/session';
import {
  buildHistoryRows,
  groupByWeek,
  pauseAfterGroup,
  previousValues,
  summarizeSession,
} from './history';

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

describe('Verlauf: Wochen und Kennzahlen (AK-HIS-01)', () => {
  it('gruppiert nach Kalenderwoche ab Montag in Eingabereihenfolge', () => {
    const groups = groupByWeek([
      { dayKey: '2026-10-18' }, // Sonntag
      { dayKey: '2026-10-14' },
      { dayKey: '2026-10-12' }, // Montag
      { dayKey: '2026-10-11' }, // Sonntag der Vorwoche
    ]);
    expect(groups.map((g) => [g.weekStart, g.items.length])).toEqual([
      ['2026-10-12', 3],
      ['2026-10-05', 1],
    ]);
    expect(groupByWeek([])).toEqual([]);
  });

  it('beschriftet eine Lücke ab 14 Tagen ohne Training als Pause (D-319)', () => {
    const groups = groupByWeek([
      { dayKey: '2026-11-02' },
      { dayKey: '2026-10-19' }, // 14 Tage davor: Pause
      { dayKey: '2026-10-12' }, // 7 Tage davor: keine Pause
    ]);
    expect(groups.map((_, i) => pauseAfterGroup(groups, i))).toEqual([true, false, false]);
    const close = groupByWeek([{ dayKey: '2026-11-01' }, { dayKey: '2026-10-19' }]); // 13 Tage
    expect(pauseAfterGroup(close, 0)).toBe(false);
  });

  it('fasst Dauer, Übungen, erledigte Sätze und Volumen ohne Aufwärmsätze zusammen', () => {
    const set = (
      type: SessionSet['type'],
      status: SessionSet['status'],
      weightKg: number,
      reps: number,
    ): SessionSet => ({
      id: `${type}-${String(weightKg)}`,
      position: 0,
      type,
      actual: { weightKg, reps },
      status,
      hlc: '0',
      deletedAt: null,
    });
    const exercise = {
      id: 'e1',
      exerciseId: 'x',
      nameSnapshot: 'Test',
      trackingMode: 'weight_reps',
      sets: [
        set('warmup', 'done', 20, 10),
        set('working', 'done', 60, 8),
        set('working', 'skipped', 60, 8),
      ],
      deletedAt: null,
    } as unknown as SessionExercise;
    const session = {
      status: 'completed',
      durationSec: 1500,
      exercises: [exercise],
    } as unknown as Session;
    expect(summarizeSession(session)).toEqual({
      durationSec: 1500,
      exercises: 1,
      doneSets: 2,
      volumeKg: 480,
    });
  });
});
