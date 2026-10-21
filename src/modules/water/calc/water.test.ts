import { describe, expect, it } from 'vitest';
import { addDays } from '@/shared/lib/time';
import {
  dayBars,
  dayTotal,
  entriesOf,
  parseAmount,
  progress,
  validQuickAmounts,
  waterGoalOn,
  waterStats,
  type GoalLike,
} from './water';

// Dienstag, 20.10.2026; alle Tage sind lokale Kalendertage (dayKey).
const TODAY = '2026-10-20';
const d = (offset: number) => addDays(TODAY, offset);
const entry = (dayKey: string, amountMl: number, loggedAt = `${dayKey}T08:00:00.000Z`) => ({
  dayKey,
  amountMl,
  loggedAt,
});

describe('Tagessumme und Fortschritt (D-289)', () => {
  const entries = [
    entry(d(-1), 2000),
    entry(TODAY, 250, `${TODAY}T07:30:00.000Z`),
    entry(TODAY, 500, `${TODAY}T09:15:00.000Z`),
  ];

  it('zählt nur den Tag, neueste zuerst', () => {
    expect(dayTotal(entries, TODAY)).toBe(750);
    expect(dayTotal(entries, d(-1))).toBe(2000);
    expect(dayTotal(entries, d(1))).toBe(0);
    expect(entriesOf(entries, TODAY).map((e) => e.amountMl)).toEqual([500, 250]);
  });

  it('Rest, erreicht und über dem Ziel, ohne bei 100 % zu enden', () => {
    expect(progress(750, 2000)).toEqual({
      totalMl: 750,
      goalMl: 2000,
      remainingMl: 1250,
      reached: false,
      ratio: 0.375,
    });
    expect(progress(2000, 2000)).toMatchObject({ remainingMl: 0, reached: true, ratio: 1 });
    expect(progress(2600, 2000)).toMatchObject({ remainingMl: 0, reached: true, ratio: 1.3 });
  });
});

describe('Eigene Menge', () => {
  it.each([
    ['330', 330],
    ['330 ml', 330],
    ['330ml', 330],
    ['1.000', 1000],
    ['1000', 1000],
    ['0,5 l', 500],
    ['0.5l', 500],
    ['1,5 Liter', 1500],
    ['  250  ', 250],
  ])('„%s“ → %d ml', (input, ml) => {
    expect(parseAmount(input)).toBe(ml);
  });

  it.each(['', '0', '-200', 'abc', '6000', '6 l', '12.5', '1,5', '0,0001 l'])(
    '„%s“ ist ungültig',
    (input) => {
      expect(parseAmount(input)).toBeNull();
    },
  );
});

describe('Tagesziel über die Zeit (datierte Ziele)', () => {
  const goal = (value: number, from: string, ended?: string, hlc = from): GoalLike => ({
    kind: 'water_daily',
    value,
    effectiveFrom: from,
    ...(ended ? { endedAt: `${ended}T10:00:00.000Z` } : {}),
    deletedAt: null,
    hlc,
  });
  const endedDay = (iso: string) => iso.slice(0, 10);

  it('frühere Tage behalten ihr Ziel, ein Wechsel gilt ab seinem Tag', () => {
    const goals = [goal(2000, d(-10), d(-3)), goal(2500, d(-3))];
    expect(waterGoalOn(goals, d(-11), endedDay)).toBeUndefined();
    expect(waterGoalOn(goals, d(-5), endedDay)?.value).toBe(2000);
    expect(waterGoalOn(goals, d(-4), endedDay)?.value).toBe(2000);
    expect(waterGoalOn(goals, d(-3), endedDay)?.value).toBe(2500);
    expect(waterGoalOn(goals, TODAY, endedDay)?.value).toBe(2500);
  });

  it('am selben Tag ersetzt zählt das zuletzt gesetzte; andere Ziele zählen nicht', () => {
    const goals: GoalLike[] = [
      goal(2000, TODAY, TODAY, 'a'),
      goal(3000, TODAY, undefined, 'b'),
      { ...goal(4, d(-20)), kind: 'weekly_sessions' },
    ];
    expect(waterGoalOn(goals, TODAY, endedDay)?.value).toBe(3000);
    expect(waterGoalOn([goal(2000, d(-5), d(-1))], TODAY, endedDay)).toBeUndefined();
  });
});

describe('Verlauf und Kennzahlen', () => {
  const goalOn = (day: string) => (day < d(-2) ? 2000 : 2500);
  const entries = [
    entry(d(-6), 2100),
    entry(d(-4), 1500),
    entry(d(-2), 2500),
    entry(d(-1), 1000),
    entry(d(-1), 1000),
    entry(TODAY, 300),
  ];

  it('Tage ohne Eintrag sind leer, nicht 0 ml; heute zählt mit 0', () => {
    const bars = dayBars(entries, goalOn, TODAY, 7);
    expect(bars.map((bar) => bar.totalMl)).toEqual([2100, null, 1500, null, 2500, 2000, 300]);
    expect(bars.map((bar) => bar.goalMl)).toEqual([2000, 2000, 2000, 2000, 2500, 2500, 2500]);
    expect(bars.at(-1)).toMatchObject({ today: true });
    expect(dayBars([], goalOn, TODAY, 3).map((bar) => bar.totalMl)).toEqual([null, null, 0]);
  });

  it('Durchschnitt und Ziel erreicht nur über abgeschlossene Tage mit Einträgen', () => {
    const stats = waterStats(dayBars(entries, goalOn, TODAY, 7));
    expect(stats).toEqual({
      daysWithData: 4,
      daysWithoutData: 2,
      averageMl: 2025,
      reachedDays: 2, // -6 (2100 ≥ 2000) und -2 (2500 ≥ 2500); -1 hat 2000 < 2500
      rate: 0.5,
    });
    expect(waterStats(dayBars([entry(TODAY, 3000)], goalOn, TODAY, 7))).toMatchObject({
      daysWithData: 0,
      averageMl: null,
      rate: null,
    });
  });
});

describe('Schnellmengen', () => {
  it('genau vier ganze Werte zwischen 10 ml und 2 l', () => {
    expect(validQuickAmounts([150, 250, 500, 750])).toBe(true);
    expect(validQuickAmounts([330, 500, 1000, 2000])).toBe(true);
    expect(validQuickAmounts([150, 250, 500])).toBe(false);
    expect(validQuickAmounts([5, 250, 500, 750])).toBe(false);
    expect(validQuickAmounts([150, 250, 500, 2500])).toBe(false);
    expect(validQuickAmounts([150.5, 250, 500, 750])).toBe(false);
  });
});
