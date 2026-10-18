import { PLAUSIBILITY } from '../model/bodyWeight';

/** Was die Berechnungen von einem Eintrag brauchen. */
export interface WeightEntry {
  id: string;
  measuredAt: string;
  weightKg: number;
  note?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const at = (entry: Pick<WeightEntry, 'measuredAt'>) => Date.parse(entry.measuredAt);

/** Aufsteigend nach Zeitpunkt. */
export function ascending<T extends Pick<WeightEntry, 'measuredAt'>>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => at(a) - at(b));
}

/** Absteigend nach Zeitpunkt (neueste zuerst). */
export function descending<T extends Pick<WeightEntry, 'measuredAt'>>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => at(b) - at(a));
}

/**
 * „Bitte prüfen“ (AK-BW-02): Der Wert weicht um mehr als 3 kg vom zeitlich nächsten Eintrag
 * innerhalb von 3 Tagen ab. Beim Bearbeiten bleibt der eigene Eintrag außen vor.
 */
export function needsReview(
  entries: readonly WeightEntry[],
  candidate: Pick<WeightEntry, 'measuredAt' | 'weightKg'>,
  excludeId?: string,
): boolean {
  const time = at(candidate);
  let nearest: WeightEntry | undefined;
  for (const entry of entries) {
    if (entry.id === excludeId) continue;
    if (Math.abs(at(entry) - time) > PLAUSIBILITY.windowDays * DAY_MS) continue;
    if (!nearest || Math.abs(at(entry) - time) < Math.abs(at(nearest) - time)) nearest = entry;
  }
  return (
    nearest !== undefined && Math.abs(nearest.weightKg - candidate.weightKg) > PLAUSIBILITY.jumpKg
  );
}

export const WEIGHT_PERIODS = ['30d', '90d', '1y', 'all'] as const;
export type WeightPeriod = (typeof WEIGHT_PERIODS)[number];

const PERIOD_DAYS: Record<WeightPeriod, number | null> = {
  '30d': 30,
  '90d': 90,
  '1y': 365,
  all: null,
};

/** Beginn des Zeitraums oder `null` für „Gesamt“. */
export function periodStart(period: WeightPeriod, now: Date): Date | null {
  const days = PERIOD_DAYS[period];
  return days === null ? null : new Date(now.getTime() - days * DAY_MS);
}

/** Einträge im Zeitraum, aufsteigend. */
export function inPeriod<T extends Pick<WeightEntry, 'measuredAt'>>(
  entries: readonly T[],
  period: WeightPeriod,
  now: Date,
): T[] {
  const start = periodStart(period, now);
  return ascending(entries).filter((entry) => start === null || at(entry) >= start.getTime());
}

export interface TrendPoint<T> {
  entry: T;
  /** Gleitender 7-Tage-Durchschnitt; fehlt unter drei Einträgen im Zeitraum (AK-BW-05). */
  avg7?: number;
}

/** Je Eintrag der Mittelwert aller Einträge der vorangehenden 7 Tage einschließlich (data-model.md 9). */
export function withTrend<T extends WeightEntry>(entries: readonly T[]): TrendPoint<T>[] {
  const sorted = ascending(entries);
  if (sorted.length < 3) return sorted.map((entry) => ({ entry }));
  return sorted.map((entry) => {
    const end = at(entry);
    const window = sorted.filter((e) => at(e) > end - 7 * DAY_MS && at(e) <= end);
    const avg7 = window.reduce((sum, e) => sum + e.weightKg, 0) / window.length;
    return { entry, avg7: Math.round(avg7 * 10) / 10 };
  });
}

/** Letzter minus erster Eintrag; nur bei mindestens zwei Einträgen mit mindestens 7 Tagen Abstand (AK-BW-06). */
export function changeInPeriod(entries: readonly WeightEntry[]): number | null {
  const sorted = ascending(entries);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last || first === last) return null;
  if (at(last) - at(first) < 7 * DAY_MS) return null;
  return Math.round((last.weightKg - first.weightKg) * 10) / 10;
}

export interface MonthGroup<T> {
  /** `YYYY-MM` in der Zeitzone des Geräts. */
  month: string;
  items: { entry: T; diff: number | null }[];
}

/** Einträge absteigend, nach Monat gruppiert, mit Differenz zum vorherigen (älteren) Eintrag (AK-BW-03). */
export function groupByMonth<T extends WeightEntry>(
  entries: readonly T[],
  monthOf: (iso: string) => string,
): MonthGroup<T>[] {
  const sorted = descending(entries);
  const groups: MonthGroup<T>[] = [];
  sorted.forEach((entry, index) => {
    const older = sorted[index + 1];
    const diff = older ? Math.round((entry.weightKg - older.weightKg) * 10) / 10 : null;
    const month = monthOf(entry.measuredAt);
    const group = groups.at(-1);
    if (group?.month === month) group.items.push({ entry, diff });
    else groups.push({ month, items: [{ entry, diff }] });
  });
  return groups;
}

/** Die letzten n Messungen aufsteigend, für den Mini-Verlauf (C-03). */
export function recentValues(entries: readonly WeightEntry[], n = 12): number[] {
  return descending(entries)
    .slice(0, n)
    .reverse()
    .map((entry) => entry.weightKg);
}

/** Letzter Eintrag, der spätestens zum Zeitpunkt gemessen wurde (für Schätzungen je Einheit). */
export function latestBefore<T extends WeightEntry>(
  entries: readonly T[],
  iso: string,
): T | undefined {
  const limit = Date.parse(iso);
  return descending(entries).find((entry) => at(entry) <= limit);
}
