/**
 * Formatierung nach Gerätesprache über `Intl` (D-212, AK-SET-04):
 * de-AT, de-CH oder de-DE (sonst de-DE); 24-Stunden-Zeit; Dezimalkomma.
 * Bei de-CH bleibt das Schweizer Tausendertrennzeichen, das Dezimalzeichen ist aber
 * wie festgelegt ein Komma (D-233).
 */
import { localTimeZone } from './time';

export const APP_LOCALES = ['de-AT', 'de-CH', 'de-DE'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export type LocalePreference = 'auto' | AppLocale;

/** Geschütztes Leerzeichen zwischen Zahl und Einheit. */
export const NBSP = '\u00A0';

function regionOf(tag: string): { language: string; region: string | undefined } | null {
  try {
    const locale = new Intl.Locale(tag);
    return { language: locale.language, region: locale.region };
  } catch {
    return null;
  }
}

function localeForRegion(region: string | undefined): AppLocale | null {
  if (region === 'AT') return 'de-AT';
  if (region === 'CH' || region === 'LI') return 'de-CH';
  return null;
}

/**
 * Wählt das Format. Entscheidend ist die erste deutsche Sprache der Geräteliste;
 * gibt es keine, zählt die Region der ersten Sprache (z. B. en-AT → de-AT); sonst de-DE.
 */
export function resolveLocale(
  preference: LocalePreference,
  languages: readonly string[],
): AppLocale {
  if (preference !== 'auto') return preference;
  const parsed = languages.map(regionOf).filter((entry) => entry !== null);
  const german = parsed.find((entry) => entry.language === 'de');
  if (german) return localeForRegion(german.region) ?? 'de-DE';
  return localeForRegion(parsed[0]?.region) ?? 'de-DE';
}

export interface NumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /**
   * `false` für vorbelegte Eingabefelder: `parseDecimal` liest kein Tausendertrennzeichen,
   * „1.500“ käme sonst als 1,5 zurück (D-291). Anzeigen behalten die Tausendertrennung.
   */
  useGrouping?: boolean;
}

export interface Formatters {
  readonly locale: AppLocale;
  readonly timeZone: string;
  /** „Samstag, 18. Oktober" */
  weekdayDayMonth(date: Date): string;
  /** „Sa., 18. Okt." (kurze Datumszeile, F5 D-326) */
  weekdayDayMonthShort(date: Date): string;
  /** „17. Jänner 2026" bzw. „17. Januar 2026" */
  dayMonthYear(date: Date): string;
  /** „18.10.2026, 09:15" */
  dateTimeShort(date: Date): string;
  /** „18. Okt." (Achsenbeschriftung) */
  dayMonth(date: Date): string;
  /** „Oktober 2026" */
  monthYear(date: Date): string;
  /** „09:15" */
  time(date: Date): string;
  number(value: number, options?: NumberOptions): string;
  /** Last: bis 0,25 kg genau ohne überflüssige Nullen, z. B. „72,5 kg" */
  loadKg(value: number): string;
  /** Körpergewicht mit einer Nachkommastelle, z. B. „78,4 kg" */
  bodyWeightKg(value: number): string;
}

export function createFormatters(
  locale: AppLocale,
  timeZone: string = localTimeZone(),
): Formatters {
  const base = { timeZone, hourCycle: 'h23' } as const;
  const weekdayDayMonth = new Intl.DateTimeFormat(locale, {
    ...base,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const weekdayDayMonthShort = new Intl.DateTimeFormat(locale, {
    ...base,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const dayMonthYear = new Intl.DateTimeFormat(locale, {
    ...base,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dateTimeShort = new Intl.DateTimeFormat(locale, {
    ...base,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const time = new Intl.DateTimeFormat(locale, { ...base, hour: '2-digit', minute: '2-digit' });
  const dayMonth = new Intl.DateTimeFormat(locale, { ...base, day: 'numeric', month: 'short' });
  const monthYear = new Intl.DateTimeFormat(locale, { ...base, month: 'long', year: 'numeric' });
  const numberFormats = new Map<string, Intl.NumberFormat>();

  const formatNumber = (value: number, options: NumberOptions = {}): string => {
    const key = [options.minimumFractionDigits, options.maximumFractionDigits, options.useGrouping]
      .map(String)
      .join('|');
    let format = numberFormats.get(key);
    if (!format) {
      format = new Intl.NumberFormat(locale, options);
      numberFormats.set(key, format);
    }
    return format
      .formatToParts(value)
      .map((part) => (part.type === 'decimal' ? ',' : part.value))
      .join('');
  };

  return {
    locale,
    timeZone,
    weekdayDayMonth: (date) => weekdayDayMonth.format(date),
    weekdayDayMonthShort: (date) => weekdayDayMonthShort.format(date),
    dayMonthYear: (date) => dayMonthYear.format(date),
    dateTimeShort: (date) => dateTimeShort.format(date),
    time: (date) => time.format(date),
    dayMonth: (date) => dayMonth.format(date),
    monthYear: (date) => monthYear.format(date),
    number: formatNumber,
    loadKg: (value) => `${formatNumber(value, { maximumFractionDigits: 2 })}${NBSP}kg`,
    bodyWeightKg: (value) =>
      `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${NBSP}kg`,
  };
}

/**
 * Liest eine Dezimalzahl mit Komma oder Punkt („62,5", „62.5"). Tausendertrennzeichen
 * sind nicht erlaubt, weil sie bei Gewichten und Wiederholungen nicht vorkommen; vorbelegte
 * Eingabefelder formatieren deshalb mit `useGrouping: false` (D-291).
 * Gibt `null` zurück, wenn die Eingabe keine Zahl ist.
 */
export function parseDecimal(
  input: string,
  options: { allowNegative?: boolean } = {},
): number | null {
  const compact = input.trim().replace(/\s+/g, '');
  const pattern = options.allowNegative
    ? /^-?(\d+([.,]\d*)?|[.,]\d+)$/
    : /^(\d+([.,]\d*)?|[.,]\d+)$/;
  if (!pattern.test(compact)) return null;
  const value = Number(compact.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}
