import { describe, expect, it } from 'vitest';
import {
  changeInPeriod,
  groupByMonth,
  inPeriod,
  latestBefore,
  needsReview,
  periodStart,
  recentValues,
  withTrend,
  type WeightEntry,
} from './bodyWeight';

const NOW = new Date('2026-10-18T12:00:00.000Z');
const entry = (id: string, day: string, weightKg: number): WeightEntry => ({
  id,
  measuredAt: `${day}T07:00:00.000Z`,
  weightKg,
});

describe('Plausibilität (AK-BW-02)', () => {
  const entries = [entry('a', '2026-10-10', 80), entry('b', '2026-10-15', 79.5)];
  it('warnt bei mehr als 3 kg Abstand zum zeitlich nächsten Eintrag innerhalb von 3 Tagen', () => {
    expect(needsReview(entries, { measuredAt: '2026-10-16T07:00:00.000Z', weightKg: 83 })).toBe(
      true,
    );
    expect(needsReview(entries, { measuredAt: '2026-10-16T07:00:00.000Z', weightKg: 82.5 })).toBe(
      false,
    );
    // Zu weit weg vom nächsten Eintrag: kein Hinweis.
    expect(needsReview(entries, { measuredAt: '2026-10-25T07:00:00.000Z', weightKg: 90 })).toBe(
      false,
    );
    // Der nächste, nicht der erste Eintrag zählt.
    expect(needsReview(entries, { measuredAt: '2026-10-12T07:00:00.000Z', weightKg: 76.5 })).toBe(
      true,
    );
  });
  it('lässt beim Bearbeiten den eigenen Eintrag außen vor', () => {
    expect(
      needsReview(entries, { measuredAt: '2026-10-15T07:00:00.000Z', weightKg: 84 }, 'b'),
    ).toBe(false);
    expect(needsReview(entries, { measuredAt: '2026-10-15T07:00:00.000Z', weightKg: 84 })).toBe(
      true,
    );
  });
});

describe('Zeiträume und Trend (AK-BW-05, AK-BW-06)', () => {
  const entries = [
    entry('a', '2026-07-01', 84),
    entry('b', '2026-09-25', 82),
    entry('c', '2026-10-01', 81.5),
    entry('d', '2026-10-05', 81.9),
    entry('e', '2026-10-17', 80.6),
  ];
  it('filtert nach Zeitraum und liefert aufsteigend', () => {
    expect(periodStart('all', NOW)).toBeNull();
    expect(periodStart('30d', NOW)?.toISOString()).toBe('2026-09-18T12:00:00.000Z');
    expect(inPeriod(entries, '30d', NOW).map((e) => e.id)).toEqual(['b', 'c', 'd', 'e']);
    expect(inPeriod(entries, '90d', NOW).map((e) => e.id)).toEqual(['b', 'c', 'd', 'e']);
    expect(inPeriod(entries, 'all', NOW)).toHaveLength(5);
  });
  it('berechnet den 7-Tage-Durchschnitt ab drei Einträgen', () => {
    const points = withTrend(inPeriod(entries, '30d', NOW));
    expect(points.map((p) => p.avg7)).toEqual([82, 81.8, 81.7, 80.6]);
    expect(withTrend(entries.slice(0, 2)).every((p) => p.avg7 === undefined)).toBe(true);
  });
  it('zeigt die Veränderung nur bei zwei Einträgen mit mindestens 7 Tagen Abstand', () => {
    expect(changeInPeriod(inPeriod(entries, '30d', NOW))).toBe(-1.4);
    expect(changeInPeriod([entry('x', '2026-10-10', 80), entry('y', '2026-10-15', 79)])).toBeNull();
    expect(changeInPeriod([entry('x', '2026-10-10', 80)])).toBeNull();
    expect(changeInPeriod([])).toBeNull();
  });
});

describe('Liste, Mini-Verlauf, letzter Eintrag', () => {
  const entries = [
    entry('a', '2026-09-28', 82),
    entry('b', '2026-10-01', 81.5),
    entry('c', '2026-10-05', 81.9),
  ];
  it('gruppiert absteigend nach Monat mit Differenz zum älteren Eintrag (AK-BW-03)', () => {
    const groups = groupByMonth(entries, (iso) => iso.slice(0, 7));
    expect(groups.map((g) => g.month)).toEqual(['2026-10', '2026-09']);
    expect(groups[0]!.items.map((i) => [i.entry.id, i.diff])).toEqual([
      ['c', 0.4],
      ['b', -0.5],
    ]);
    expect(groups[1]!.items.map((i) => [i.entry.id, i.diff])).toEqual([['a', null]]);
  });
  it('liefert die letzten Werte aufsteigend und den letzten Eintrag vor einem Zeitpunkt', () => {
    expect(recentValues(entries, 2)).toEqual([81.5, 81.9]);
    expect(latestBefore(entries, '2026-10-03T00:00:00.000Z')?.id).toBe('b');
    expect(latestBefore(entries, '2026-09-01T00:00:00.000Z')).toBeUndefined();
  });
});
