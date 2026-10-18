import { describe, expect, it } from 'vitest';
import type { HistoryRow } from '@/modules/training';
import { compareBest, isNewRecord } from '@/modules/training';
import {
  bestRecords,
  exerciseSeries,
  frequentExercises,
  statPeriodStart,
  totalsFor,
} from './stats';

const NOW = new Date('2026-10-18T12:00:00.000Z'); // Sonntag
const row = (
  id: string,
  exerciseId: string,
  completedAt: string,
  best: HistoryRow['best'],
  extra: Partial<HistoryRow> = {},
): HistoryRow => ({
  id,
  version: 1,
  exerciseId,
  sessionId: `00000000-0000-4000-8000-0000000000${id.padStart(2, '0')}`,
  completedAt,
  dayKey: completedAt.slice(0, 10),
  title: 'Tag A',
  trackingMode: 'weight_reps',
  sets: [],
  best,
  bestOneRepMax: best?.weightKg && best.reps ? best.weightKg * (1 + best.reps / 30) : null,
  volumeKg: 0,
  reps: 0,
  setCount: 0,
  ...extra,
});
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';

describe('Zeiträume und Kennzahlen (TH-06)', () => {
  it('beginnt die Woche am Montag, den Monat am Ersten, sonst rollierend', () => {
    expect(statPeriodStart('week', NOW, 'UTC')).toBe('2026-10-12');
    expect(statPeriodStart('month', NOW, 'UTC')).toBe('2026-10-01');
    expect(statPeriodStart('3m', NOW, 'UTC')).toBe('2026-07-20');
    expect(statPeriodStart('year', NOW, 'UTC')).toBe('2025-10-18');
    expect(statPeriodStart('all', NOW, 'UTC')).toBeNull();
  });

  it('summiert Einheiten, Minuten, Volumen und Kalorien im Zeitraum', () => {
    const sessions = [
      { dayKey: '2026-10-17', durationSec: 3600, volume: 5000, kcal: 300 },
      { dayKey: '2026-10-13', durationSec: 1800, volume: 2000, kcal: null },
      { dayKey: '2026-09-30', durationSec: 2400, volume: 3000, kcal: 200 },
    ];
    const totals = totalsFor(
      sessions,
      'week',
      NOW,
      (s) => s.volume,
      (s) => s.kcal,
      'UTC',
    );
    expect(totals).toEqual({ sessions: 2, minutes: 90, volumeKg: 7000, kcal: 300, withoutKcal: 1 });
    expect(
      totalsFor(
        sessions,
        'all',
        NOW,
        (s) => s.volume,
        (s) => s.kcal,
        'UTC',
      ),
    ).toMatchObject({
      sessions: 3,
      kcal: 500,
    });
    expect(
      totalsFor(
        [],
        'all',
        NOW,
        () => 0,
        () => null,
      ).kcal,
    ).toBeNull();
  });
});

describe('Bestleistungen (TH-05)', () => {
  it('vergleicht je Erfassungsart', () => {
    expect(
      compareBest('weight_reps', { weightKg: 80, reps: 6 }, { weightKg: 80, reps: 5 }),
    ).toBeGreaterThan(0);
    expect(
      compareBest('weight_reps', { weightKg: 75, reps: 10 }, { weightKg: 80, reps: 5 }),
    ).toBeLessThan(0);
    expect(
      compareBest('assisted_reps', { assistKg: 10, reps: 6 }, { assistKg: 15, reps: 8 }),
    ).toBeGreaterThan(0);
    expect(compareBest('time', { durationSec: 60 }, { durationSec: 45 })).toBeGreaterThan(0);
    expect(compareBest('time_distance', { distanceM: 3000 }, { distanceM: 2500 })).toBeGreaterThan(
      0,
    );
  });

  it('liefert je Übung den besten Satz mit 1RM, neueste zuerst; erste Erreichung zählt', () => {
    const rows = [
      row('1', A, '2026-10-01T10:00:00.000Z', { weightKg: 80, reps: 5 }),
      row('2', A, '2026-10-08T10:00:00.000Z', { weightKg: 85, reps: 3 }),
      row('3', A, '2026-10-15T10:00:00.000Z', { weightKg: 85, reps: 3 }),
      row(
        '4',
        B,
        '2026-10-16T10:00:00.000Z',
        { reps: 12 },
        { trackingMode: 'reps', bestOneRepMax: null },
      ),
      row('5', B, '2026-10-17T10:00:00.000Z', null, { trackingMode: 'reps', bestOneRepMax: null }),
    ];
    const records = bestRecords(rows);
    expect(records.map((r) => [r.exerciseId, r.row.id, r.values, r.oneRepMax])).toEqual([
      [B, '4', { reps: 12 }, null],
      [A, '2', { weightKg: 85, reps: 3 }, 85 * (1 + 3 / 30)],
    ]);
    expect(isNewRecord(rows, A, 'weight_reps', { weightKg: 90, reps: 1 }, rows[2]!.sessionId)).toBe(
      true,
    );
    expect(isNewRecord(rows, A, 'weight_reps', { weightKg: 85, reps: 3 }, rows[2]!.sessionId)).toBe(
      false,
    );
    expect(isNewRecord(rows, 'unbekannt', 'weight_reps', { weightKg: 1, reps: 1 }, 'x')).toBe(
      false,
    );
  });
});

describe('Übungsverlauf (C-02, AK-HIS-05)', () => {
  const rows = [
    row('1', A, '2026-01-10T10:00:00.000Z', { weightKg: 70, reps: 8 }),
    row('2', A, '2026-09-01T10:00:00.000Z', { weightKg: 80, reps: 5 }),
    row('3', A, '2026-10-01T10:00:00.000Z', { weightKg: 82.5, reps: 12 }),
    row(
      '4',
      B,
      '2026-10-02T10:00:00.000Z',
      { reps: 10 },
      { trackingMode: 'reps', bestOneRepMax: null },
    ),
  ];
  it('filtert nach Übung und Zeitraum, aufsteigend', () => {
    expect(exerciseSeries(rows, A, 'best', '3m', NOW).map((p) => p.value)).toEqual([80, 82.5]);
    expect(exerciseSeries(rows, A, 'best', 'all', NOW).map((p) => p.value)).toEqual([70, 80, 82.5]);
    expect(exerciseSeries(rows, B, 'best', 'all', NOW).map((p) => p.value)).toEqual([10]);
  });
  it('zeigt das 1RM nur bei 1 bis 10 Wiederholungen (D-224)', () => {
    const orm = exerciseSeries(
      rows.map((r) => ({ ...r, bestOneRepMax: null })),
      A,
      'orm',
      'all',
      NOW,
    );
    expect(orm.map((p) => Math.round(p.value))).toEqual([89, 93]);
  });
  it('zählt Übungen nach Häufigkeit', () => {
    expect(frequentExercises(rows).map((e) => [e.exerciseId, e.count])).toEqual([
      [A, 3],
      [B, 1],
    ]);
  });
});
