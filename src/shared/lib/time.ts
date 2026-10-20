/**
 * Tagesbezug (data-model.md Abschnitt 1): `dayKey` ist das lokale Datum `YYYY-MM-DD`
 * in der IANA-Zone des Datensatzes. Tageswerte gruppieren nach `dayKey`, nie nach UTC.
 * Wochen beginnen am Montag (D-212).
 */

export type DayKey = string;

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const dayKeyFormatters = new Map<string, Intl.DateTimeFormat>();

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function dayKeyFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dayKeyFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dayKeyFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function dayKey(date: Date, timeZone: string = localTimeZone()): DayKey {
  const parts = dayKeyFormatter(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isValidDayKey(value: string): boolean {
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function dayKeyToUtcDate(key: DayKey): Date {
  if (!isValidDayKey(key)) throw new Error('Ungültiger Tag');
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function utcDateToDayKey(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = dayKeyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToDayKey(date);
}

/** ISO-Wochentag: Montag = 1 bis Sonntag = 7. */
export function isoWeekday(key: DayKey): number {
  const day = dayKeyToUtcDate(key).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Montag der Woche, zu der der Tag gehört. */
export function startOfWeek(key: DayKey): DayKey {
  return addDays(key, 1 - isoWeekday(key));
}

/**
 * Stunde (0 bis 23) in einer Zeitzone. Über `formatToParts`, weil `format` je nach Sprache und
 * Browser „07 Uhr“ liefert statt „07“ (Fehler vom 20.10.2026: immer „Guten Abend“).
 */
export function hourIn(date: Date, timeZone: string = localTimeZone()): number {
  const part = new Intl.DateTimeFormat('de-AT', { hour: 'numeric', hourCycle: 'h23', timeZone })
    .formatToParts(date)
    .find((p) => p.type === 'hour');
  return Number(part?.value ?? 0) % 24;
}
