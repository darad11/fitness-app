import type { YearConfig } from '../model/steps';

/**
 * Zahlen der Schritte-Karte (D-277), gleich gerechnet wie die Step Challenge im Dashboard
 * (`js/steps-core.js`, `computeStats`, und `js/home-core.js`, `stepsSummary`):
 *
 * - Jahressumme = Startwert (1. Jänner bis Stichtag) + Tageswerte nach dem Stichtag bis heute.
 * - Tagesziel = was ab Beginn des heutigen Tages noch fehlt, geteilt durch die verbleibenden
 *   Tage einschließlich heute (aufgerundet).
 *
 * Tage sind Kalendertage als „JJJJ-MM-TT“; gerechnet wird mit UTC-Tagesnummern, damit die
 * Sommerzeit keinen Tag verschiebt.
 */
export interface StepsSummary {
  /** Schritte heute; `null` = für heute noch nichts übertragen. */
  todaySteps: number | null;
  /** Tagesziel; `null`, wenn heute außerhalb des Jahres oder vom Startwert abgedeckt ist. */
  target: number | null;
  /** Noch zu gehen bis zum Tagesziel. */
  remaining: number | null;
  /** Anteil am Tagesziel in Prozent (0 bis 100). */
  percent: number | null;
  ytd: number;
  goal: number;
  /** Anteil am Jahresziel in Prozent (0 bis 100, gerundet). */
  yearPercent: number;
}

const DAY_MS = 86_400_000;

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / DAY_MS;
}

function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

export function stepsSummary(
  config: YearConfig,
  entries: Readonly<Record<string, number>>,
  todayKey: string,
): StepsSummary | null {
  const year = Number(todayKey.slice(0, 4));
  const end = `${String(year)}-12-31`;
  const todayInYear = todayKey >= `${String(year)}-01-01` && todayKey <= end;
  if (!todayInYear) return null;
  const { goal, baselineSteps, baselineDate } = config;
  const asOf = todayKey < baselineDate ? baselineDate : todayKey;
  let entriesSum = 0;
  for (const [date, steps] of Object.entries(entries)) {
    if (date > baselineDate && date <= asOf && date <= end) entriesSum += steps;
  }
  const ytd = baselineSteps + entriesSum;
  const coveredByBaseline = todayKey <= baselineDate;
  const todayValue = entries[todayKey];
  const todaySteps = !coveredByBaseline && todayValue !== undefined ? todayValue : null;
  let target: number | null = null;
  if (!coveredByBaseline) {
    const daysLeftIncludingToday = daysBetween(todayKey, end) + 1;
    const remainingBeforeToday = Math.max(0, goal - (ytd - (todaySteps ?? 0)));
    target = Math.ceil(remainingBeforeToday / daysLeftIncludingToday);
  }
  const walked = todaySteps ?? 0;
  return {
    todaySteps,
    target,
    remaining: target !== null ? Math.max(0, target - walked) : null,
    percent: target ? Math.min(100, Math.round((walked / target) * 100)) : null,
    ytd,
    goal,
    yearPercent: Math.min(100, Math.round(goal > 0 ? (ytd / goal) * 100 : 0)),
  };
}

/** Einstellung des Dashboards für ein Jahr lesen; ungültig oder fehlend → `null`. */
export function yearConfigFrom(
  years: Readonly<Record<string, unknown>>,
  year: number,
  parse: (value: unknown) => YearConfig | null,
): YearConfig | null {
  const config = parse(years[String(year)]);
  if (!config) return null;
  // Wie im Dashboard: Stichtag zwischen 31.12. des Vorjahres und 31.12. dieses Jahres.
  if (
    config.baselineDate < `${String(year - 1)}-12-31` ||
    config.baselineDate > `${String(year)}-12-31`
  ) {
    return null;
  }
  return config;
}
