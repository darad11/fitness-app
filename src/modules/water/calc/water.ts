import { addDays, type DayKey } from '@/shared/lib/time';
import { WATER_ENTRY_MAX_ML } from '../model/waterEntry';

/**
 * Rechnung für Wasser (D-289): Tagessumme, Ziel, Rest, Eingabe und Verlauf. Ohne React und Dexie.
 */

/** Gilt nur, solange kein eigenes Ziel gesetzt ist; ein Startwert, keine Empfehlung. */
export const WATER_DEFAULT_GOAL_ML = 2000;
/** Schnellmengen, solange keine eigenen gespeichert sind. */
export const WATER_QUICK_DEFAULT: readonly number[] = [150, 250, 500, 750];
export const WATER_QUICK_COUNT = 4;

export interface AmountLike {
  dayKey: DayKey;
  amountMl: number;
  loggedAt: string;
}

/** Summe eines Tages in ml. */
export function dayTotal(entries: readonly AmountLike[], day: DayKey): number {
  return entries.reduce((sum, entry) => (entry.dayKey === day ? sum + entry.amountMl : sum), 0);
}

/** Einträge eines Tages, neueste zuerst. */
export function entriesOf<T extends AmountLike>(entries: readonly T[], day: DayKey): T[] {
  return entries
    .filter((entry) => entry.dayKey === day)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export interface Progress {
  totalMl: number;
  goalMl: number;
  remainingMl: number;
  reached: boolean;
  /** Anteil am Ziel, nicht gekappt (über 1 nach dem Ziel). */
  ratio: number;
}

export function progress(totalMl: number, goalMl: number): Progress {
  return {
    totalMl,
    goalMl,
    remainingMl: Math.max(0, goalMl - totalMl),
    reached: totalMl >= goalMl,
    ratio: goalMl > 0 ? totalMl / goalMl : 0,
  };
}

/**
 * Eigene Menge aus dem Eingabefeld: „330“, „330 ml“, „1.000“, „0,5 l“, „1,5 Liter“. Ganze ml,
 * größer als 0 und höchstens 5 l je Eintrag; sonst `null`.
 */
export function parseAmount(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, ' ');
  const liters = /^(\d{1,2}(?:[.,]\d{1,3})?) ?(?:l|liter)$/.exec(text);
  const ml = /^(\d{1,3}(?:\.\d{3})+|\d{1,5}) ?(?:ml)?$/.exec(text);
  let value: number | null = null;
  if (liters?.[1]) value = Math.round(Number(liters[1].replace(',', '.')) * 1000);
  else if (ml?.[1]) value = Number(ml[1].replace(/\./g, ''));
  if (value === null || !Number.isFinite(value) || value <= 0 || value > WATER_ENTRY_MAX_ML) {
    return null;
  }
  return value;
}

export interface DayBar {
  day: DayKey;
  /** `null`: an dem Tag gibt es keinen Eintrag (keine Daten, nicht 0 ml). */
  totalMl: number | null;
  goalMl: number;
  today: boolean;
}

/** Tage von `days` Tagen bis heute, älteste zuerst. */
export function dayBars(
  entries: readonly AmountLike[],
  goalOn: (day: DayKey) => number,
  today: DayKey,
  days: number,
): DayBar[] {
  const totals = new Map<DayKey, number>();
  for (const entry of entries) {
    totals.set(entry.dayKey, (totals.get(entry.dayKey) ?? 0) + entry.amountMl);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    return {
      day,
      totalMl: totals.get(day) ?? (day === today ? 0 : null),
      goalMl: goalOn(day),
      today: day === today,
    };
  });
}

export interface WaterStats {
  /** Abgeschlossene Tage mit mindestens einem Eintrag (heute zählt nicht mit). */
  daysWithData: number;
  daysWithoutData: number;
  /** Durchschnitt über die Tage mit Einträgen; `null` ohne solche Tage. */
  averageMl: number | null;
  reachedDays: number;
  /** Anteil der Tage mit Einträgen, an denen das Ziel erreicht war. */
  rate: number | null;
}

/**
 * Kennzahlen ohne heute (der Tag läuft noch). Tage ohne Eintrag zählen weder als 0 ml noch als
 * verfehlt, weil unbekannt ist, ob nur das Eintragen fehlte.
 */
export function waterStats(bars: readonly DayBar[]): WaterStats {
  const closed = bars.filter((bar) => !bar.today);
  const withData = closed.filter((bar) => bar.totalMl !== null);
  const sum = withData.reduce((total, bar) => total + (bar.totalMl ?? 0), 0);
  const reachedDays = withData.filter((bar) => (bar.totalMl ?? 0) >= bar.goalMl).length;
  return {
    daysWithData: withData.length,
    daysWithoutData: closed.length - withData.length,
    averageMl: withData.length > 0 ? Math.round(sum / withData.length) : null,
    reachedDays,
    rate: withData.length > 0 ? reachedDays / withData.length : null,
  };
}

/** Eigene Schnellmengen prüfen: genau vier ganze Werte zwischen 10 ml und 2 l. */
export function validQuickAmounts(values: readonly number[]): boolean {
  return (
    values.length === WATER_QUICK_COUNT &&
    values.every((value) => Number.isInteger(value) && value >= 10 && value <= 2000)
  );
}

export interface GoalLike {
  kind: string;
  value: number;
  effectiveFrom: DayKey;
  endedAt?: string;
  deletedAt: string | null;
  hlc: string;
}

/**
 * Wasserziel, das an einem Tag galt (datierte Ziele, AK-SET-01): `effectiveFrom` bis zum Tag vor
 * dem Beenden. Ein am selben Tag ersetztes Ziel gilt nie; so zählt für jeden Tag das zuletzt
 * gesetzte. `endedDay` rechnet den Zeitpunkt des Beendens in den lokalen Kalendertag um.
 */
export function waterGoalOn<T extends GoalLike>(
  goals: readonly T[],
  day: DayKey,
  endedDay: (iso: string) => DayKey,
): T | undefined {
  return goals
    .filter(
      (goal) =>
        goal.kind === 'water_daily' &&
        goal.deletedAt === null &&
        goal.effectiveFrom <= day &&
        (goal.endedAt === undefined || endedDay(goal.endedAt) > day),
    )
    .sort(
      (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.hlc.localeCompare(a.hlc),
    )[0];
}
