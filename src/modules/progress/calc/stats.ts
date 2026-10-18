import type { TrackingMode } from '@/modules/exercises';
import { compareBest, estimateOneRepMax, type HistoryRow, type Session } from '@/modules/training';
import { addDays, dayKey, startOfWeek, type DayKey } from '@/shared/lib/time';

export const STAT_PERIODS = ['week', 'month', '3m', 'year', 'all'] as const;
export type StatPeriod = (typeof STAT_PERIODS)[number];

/** Erster Tag des Zeitraums als `dayKey` oder `null` für „Gesamt“ (D-212: Woche ab Montag). */
export function statPeriodStart(period: StatPeriod, now: Date, timeZone?: string): DayKey | null {
  const today = dayKey(now, timeZone);
  switch (period) {
    case 'week':
      return startOfWeek(today);
    case 'month':
      return `${today.slice(0, 7)}-01`;
    case '3m':
      return addDays(today, -90);
    case 'year':
      return addDays(today, -365);
    case 'all':
      return null;
  }
}

export interface Totals {
  sessions: number;
  minutes: number;
  volumeKg: number;
  /** Summe der Schätzungen; `null`, wenn keine Einheit eine Schätzung hat. */
  kcal: number | null;
  /** Einheiten ohne Kalorienschätzung (kein Körpergewicht zum Zeitpunkt). */
  withoutKcal: number;
}

type SessionLike = Pick<Session, 'dayKey' | 'durationSec'>;

/** Kennzahlen aus abgeschlossenen Einheiten im Zeitraum (TH-06). */
export function totalsFor<T extends SessionLike>(
  sessions: readonly T[],
  period: StatPeriod,
  now: Date,
  volumeOf: (session: T) => number,
  kcalOf: (session: T) => number | null,
  timeZone?: string,
): Totals {
  const start = statPeriodStart(period, now, timeZone);
  const scoped = sessions.filter((session) => start === null || session.dayKey >= start);
  let kcal: number | null = null;
  let withoutKcal = 0;
  for (const session of scoped) {
    const estimate = kcalOf(session);
    if (estimate === null) withoutKcal += 1;
    else kcal = (kcal ?? 0) + estimate;
  }
  return {
    sessions: scoped.length,
    minutes: Math.round(scoped.reduce((sum, s) => sum + (s.durationSec ?? 0), 0) / 60),
    volumeKg: Math.round(scoped.reduce((sum, s) => sum + volumeOf(s), 0)),
    kcal,
    withoutKcal,
  };
}

type Values = NonNullable<HistoryRow['best']>;

export interface BestRecord {
  exerciseId: string;
  trackingMode: TrackingMode;
  row: HistoryRow;
  values: Values;
  oneRepMax: number | null;
}

/** Bestleistung je Übung aus der Projektion (TH-05): bester Satz nach Erfassungsart, dazu das beste 1RM. */
export function bestRecords(rows: readonly HistoryRow[]): BestRecord[] {
  const byExercise = new Map<string, BestRecord>();
  for (const row of rows) {
    if (!row.best) continue;
    const current = byExercise.get(row.exerciseId);
    const better =
      !current ||
      compareBest(row.trackingMode, row.best, current.values) > 0 ||
      (compareBest(row.trackingMode, row.best, current.values) === 0 &&
        row.completedAt < current.row.completedAt);
    const oneRepMax = Math.max(current?.oneRepMax ?? -1, row.bestOneRepMax ?? -1);
    byExercise.set(row.exerciseId, {
      exerciseId: row.exerciseId,
      trackingMode: row.trackingMode,
      row: better ? row : current.row,
      values: better ? row.best : current.values,
      oneRepMax: oneRepMax < 0 ? null : oneRepMax,
    });
  }
  return [...byExercise.values()].sort((a, b) =>
    b.row.completedAt.localeCompare(a.row.completedAt),
  );
}

export const EXERCISE_PERIODS = ['3m', '1y', 'all'] as const;
export type ExercisePeriod = (typeof EXERCISE_PERIODS)[number];
export type ExerciseMetric = 'best' | 'orm';

export interface SeriesPoint {
  time: number;
  value: number;
  row: HistoryRow;
}

/** Kennzahl des besten Satzes je Erfassungsart für das Übungsdiagramm (C-02). */
export function metricValue(mode: TrackingMode, values: Values): number | null {
  switch (mode) {
    case 'weight_reps':
    case 'weight_time':
      return values.weightKg ?? null;
    case 'reps':
      return values.reps ?? null;
    case 'time':
      return values.durationSec ?? null;
    case 'time_distance':
      return values.distanceM ?? null;
    case 'assisted_reps':
      return values.assistKg ?? null;
  }
}

/** Punkte einer Übung im Zeitraum, aufsteigend; beim 1RM nur Einheiten mit Schätzung (D-224). */
export function exerciseSeries(
  rows: readonly HistoryRow[],
  exerciseId: string,
  metric: ExerciseMetric,
  period: ExercisePeriod,
  now: Date,
): SeriesPoint[] {
  const days = period === '3m' ? 90 : period === '1y' ? 365 : null;
  const start = days === null ? null : now.getTime() - days * 24 * 60 * 60 * 1000;
  return rows
    .filter(
      (row) =>
        row.exerciseId === exerciseId && (start === null || Date.parse(row.completedAt) >= start),
    )
    .flatMap((row) => {
      const value =
        metric === 'orm'
          ? (row.bestOneRepMax ??
            (row.best ? estimateOneRepMax(row.best.weightKg ?? 0, row.best.reps ?? 0) : null))
          : row.best
            ? metricValue(row.trackingMode, row.best)
            : null;
      return value === null ? [] : [{ time: Date.parse(row.completedAt), value, row }];
    })
    .sort((a, b) => a.time - b.time);
}

/** Übungen nach Zahl der Einheiten, häufigste zuerst, bei Gleichstand die zuletzt trainierte. */
export function frequentExercises(
  rows: readonly HistoryRow[],
): { exerciseId: string; count: number; lastAt: string }[] {
  const map = new Map<string, { exerciseId: string; count: number; lastAt: string }>();
  for (const row of rows) {
    const entry = map.get(row.exerciseId);
    if (entry) {
      entry.count += 1;
      if (row.completedAt > entry.lastAt) entry.lastAt = row.completedAt;
    } else
      map.set(row.exerciseId, { exerciseId: row.exerciseId, count: 1, lastAt: row.completedAt });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
}
