import { describe, expect, it } from 'vitest';
import { addDays } from '@/shared/lib/time';
import {
  dayTotals,
  habitRate,
  habitState,
  habitStreaks,
  indexLogs,
  insights,
  overallRate,
  overallStreaks,
  periodDays,
  previousDays,
  progressBuckets,
  rateChange,
  weekdayRates,
  type HabitInfo,
} from './insights';
import type { LogLike } from './streak';

// Dienstag, 20.10.2026; alle Tage sind lokale Kalendertage (dayKey), keine Uhrzeiten.
const TODAY = '2026-10-20';
const d = (offset: number) => addDays(TODAY, offset);

function habit(id: string, from: string, extra: Partial<HabitInfo> = {}): HabitInfo {
  return { id, name: id, fromDayKey: from, ...extra };
}
function log(habitId: string, dayKey: string, done = true): LogLike {
  return { habitId, dayKey, done };
}

describe('Zustand je Aufgabe und Tag (D-284)', () => {
  const a = habit('a', d(-10), { pauses: [{ fromDayKey: d(-6), toDayKey: d(-4) }] });
  const index = indexLogs([log('a', d(-8)), log('x', d(-7)), log('a', d(-3), false)]);

  it('unterscheidet erledigt, offen, nicht fällig und keine Daten', () => {
    expect(habitState(a, d(-11), index, TODAY)).toBe('notDue'); // vor dem Anlegen
    expect(habitState(a, d(-8), index, TODAY)).toBe('done');
    expect(habitState(a, d(-7), index, TODAY)).toBe('open'); // Tag mit Einträgen anderer Aufgaben
    expect(habitState(a, d(-9), index, TODAY)).toBe('noData'); // App nicht benutzt
    expect(habitState(a, d(-5), index, TODAY)).toBe('notDue'); // pausiert
    expect(habitState(a, d(-3), index, TODAY)).toBe('open'); // zurückgenommen
    expect(habitState(a, TODAY, index, TODAY)).toBe('open'); // heute nie „keine Daten“
  });

  it('zählt Tage ohne Eintrag nicht als verfehlt', () => {
    expect(dayTotals([a], d(-9), index, TODAY)).toEqual({
      day: d(-9),
      due: 1,
      done: 0,
      noData: true,
    });
    const rate = habitRate(a, periodDays('30d', [a], TODAY), index, TODAY);
    // Fällig mit Daten: -8 (erledigt), -7 (offen), -3 (offen); ohne Daten: -10, -9, -4, -2, -1.
    expect(rate).toEqual({ done: 1, due: 3, rate: 1 / 3, noDataDays: 5 });
  });
});

describe('Zeiträume', () => {
  const habits = [habit('a', d(-40))];

  it('beginnt nie vor den ersten Daten und endet heute', () => {
    expect(periodDays('7d', habits, TODAY)).toHaveLength(7);
    expect(periodDays('7d', habits, TODAY).at(-1)).toBe(TODAY);
    expect(periodDays('90d', habits, TODAY)).toHaveLength(41);
    expect(periodDays('all', habits, TODAY)[0]).toBe(d(-40));
    expect(periodDays('7d', [], TODAY)).toEqual([]);
  });

  it('der Zeitraum davor hat dieselbe Länge, soweit Daten da sind', () => {
    expect(previousDays('7d', habits, TODAY)).toEqual([
      d(-13),
      d(-12),
      d(-11),
      d(-10),
      d(-9),
      d(-8),
      d(-7),
    ]);
    expect(previousDays('30d', habits, TODAY)).toHaveLength(11);
    expect(previousDays('all', habits, TODAY)).toEqual([]);
  });
});

describe('Erfüllungsquote', () => {
  it('neue Aufgabe zählt nicht rückwirkend als versäumt', () => {
    const old = habit('old', d(-29));
    const fresh = habit('new', d(-4));
    const logs: LogLike[] = [];
    for (let i = -29; i <= -1; i++) logs.push(log('old', d(i)));
    for (let i = -4; i <= -1; i++) logs.push(log('new', d(i), i !== -2));
    const index = indexLogs(logs);
    const days = periodDays('30d', [old, fresh], TODAY);
    expect(habitRate(fresh, days, index, TODAY)).toMatchObject({ done: 3, due: 4 });
    // 29 + 3 erledigt von 29 + 4 fälligen; heute zählt nicht mit.
    expect(overallRate([old, fresh], days, index, TODAY)).toMatchObject({ done: 32, due: 33 });
  });

  it('gelöschte Aufgabe zählt nur bis zum Löschen', () => {
    const a = habit('a', d(-5), { toDayKey: d(-2) });
    const index = indexLogs([log('a', d(-5)), log('a', d(-4)), log('a', d(-3), false)]);
    expect(habitRate(a, periodDays('7d', [a], TODAY), index, TODAY)).toMatchObject({
      done: 2,
      due: 3,
      noDataDays: 0,
    });
  });

  it('Vergleich nur mit genug Daten in beiden Zeiträumen', () => {
    expect(
      rateChange(
        { done: 6, due: 7, rate: 6 / 7, noDataDays: 0 },
        { done: 4, due: 7, rate: 4 / 7, noDataDays: 0 },
        7,
      ),
    ).toBe(29);
    expect(
      rateChange(
        { done: 6, due: 7, rate: 6 / 7, noDataDays: 0 },
        { done: 2, due: 4, rate: 0.5, noDataDays: 3 },
        7,
      ),
    ).toBeNull();
  });
});

describe('Serien', () => {
  it('aktuelle und beste Serie; heute offen unterbricht nicht, ohne Daten schon', () => {
    const a = habit('a', d(-12));
    const b = habit('b', d(-12));
    const logs: LogLike[] = [];
    const full = (i: number) => {
      logs.push(log('a', d(i)), log('b', d(i)));
    };
    [-12, -11, -10, -9].forEach(full); // 4 Tage am Stück
    logs.push(log('a', d(-8))); // -8 nur halb
    full(-7);
    // -6 ohne Daten unterbricht
    [-5, -4, -3, -2, -1].forEach(full); // 5 Tage bis gestern
    const index = indexLogs(logs);
    expect(overallStreaks([a, b], index, TODAY)).toEqual({ current: 5, best: 5 });
    logs.push(log('a', TODAY), log('b', TODAY));
    expect(overallStreaks([a, b], indexLogs(logs), TODAY)).toEqual({ current: 6, best: 6 });
    expect(habitStreaks(a, indexLogs(logs), TODAY)).toEqual({ current: 6, best: 6 });
  });

  it('Tage ohne fällige Aufgabe (Pause) sind neutral', () => {
    const a = habit('a', d(-6), { pauses: [{ fromDayKey: d(-4), toDayKey: d(-2) }] });
    const index = indexLogs([log('a', d(-6)), log('a', d(-5)), log('a', d(-2)), log('a', d(-1))]);
    expect(habitStreaks(a, index, TODAY)).toEqual({ current: 4, best: 4 });
    expect(overallStreaks([a], index, TODAY)).toEqual({ current: 4, best: 4 });
  });
});

describe('Verlauf und Wochentage', () => {
  it('bis 31 Tage je Tag, darüber je Woche ab Montag', () => {
    const a = habit('a', d(-60));
    const index = indexLogs([log('a', d(-1)), log('a', d(-2), false)]);
    const short = progressBuckets([a], periodDays('7d', [a], TODAY), index, TODAY);
    expect(short.unit).toBe('day');
    expect(short.buckets).toHaveLength(7);
    expect(short.buckets.at(-2)).toMatchObject({ done: 1, due: 1, complete: true });
    expect(short.buckets.at(-3)).toMatchObject({ done: 0, due: 1, noData: false });
    expect(short.buckets[0]).toMatchObject({ noData: true });
    expect(short.buckets.at(-1)).toMatchObject({ today: true, due: 1, done: 0 });
    const long = progressBuckets([a], periodDays('90d', [a], TODAY), index, TODAY);
    expect(long.unit).toBe('week');
    expect(long.buckets.every((bucket) => bucket.start <= TODAY)).toBe(true);
    expect(long.buckets.at(-1)?.start).toBe('2026-10-19'); // Montag
  });

  it('Wochentage ohne heute', () => {
    const a = habit('a', d(-14));
    const logs: LogLike[] = [];
    for (let i = -14; i <= -1; i++) logs.push(log('a', d(i), ![4, 5].includes(isoDay(i))));
    const rows = weekdayRates(a, periodDays('30d', [a], TODAY), indexLogs(logs), TODAY);
    expect(rows.map((row) => row.due)).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(rows.map((row) => row.done)).toEqual([2, 2, 2, 0, 0, 2, 2]);
  });
});

function isoDay(offset: number): number {
  // 20.10.2026 ist ein Dienstag (2).
  return ((((2 - 1 + offset) % 7) + 7) % 7) + 1;
}

describe('Hinweise (D-284)', () => {
  it('ohne genug Daten kein Hinweis', () => {
    const a = habit('a', d(-5));
    const index = indexLogs([log('a', d(-1), false), log('a', d(-2), false)]);
    expect(insights([a], index, TODAY)).toEqual([]);
  });

  it('oft ausgelassen, Wochenende, deutlich besser', () => {
    const skipped = habit('skip', d(-60));
    const weekend = habit('weekend', d(-60));
    const better = habit('better', d(-60));
    const logs: LogLike[] = [];
    for (let i = -60; i <= -1; i++) {
      logs.push(log('skip', d(i), i % 3 === 0));
      logs.push(log('weekend', d(i), isoDay(i) <= 5));
      logs.push(log('better', d(i), i >= -30 ? true : i % 2 === 0));
    }
    const found = insights([skipped, weekend, better], indexLogs(logs), TODAY);
    expect(found.map((item) => item.kind)).toEqual(['oftenSkipped', 'weekend', 'improving']);
    expect(found[0]).toMatchObject({ habitId: 'skip' });
    expect(found[2]).toMatchObject({ habitId: 'better', change: 50 });
  });
});
