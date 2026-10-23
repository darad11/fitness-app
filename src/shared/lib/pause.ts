import { addDays, type DayKey } from './time';

/**
 * Ab so vielen Tagen ohne Eintrag gilt eine Lücke als Pause: Rückkehr-Flow auf „Heute“ und die
 * Beschriftung „Pause“ im Verlauf (D-319). Gleich der Schwelle der Hinweise bei den Tagesaufgaben
 * (D-284: ab 14 fälligen Tagen), wie es `form-markenleitplanken.md` Abschnitt 3 verlangt.
 */
export const PAUSE_DAYS = 14;

/** Liegen zwischen zwei Tagen mindestens {@link PAUSE_DAYS} Tage? */
export function isPause(from: DayKey, to: DayKey): boolean {
  return addDays(from, PAUSE_DAYS) <= to;
}
