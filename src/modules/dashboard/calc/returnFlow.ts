import { isPause } from '@/shared/lib/pause';
import type { DayKey } from '@/shared/lib/time';

/**
 * Auslöser des Rückkehr-Flows (form-markenleitplanken.md Abschnitt 3, D-319): Der letzte Eintrag
 * liegt mindestens 14 Tage zurück, und für genau diesen letzten Eintrag kam das Blatt noch nicht
 * (`shownFor`). So erscheint es einmal je Rückkehr; ohne jeden Eintrag (erster Start) nie.
 */
export function shouldShowReturn(
  lastEntry: DayKey | null,
  today: DayKey,
  shownFor: DayKey | null,
): boolean {
  if (lastEntry === null || shownFor === lastEntry) return false;
  return isPause(lastEntry, today);
}

/** Der jüngere von zwei Tagen; `null` zählt nicht. */
export function laterDay(a: DayKey | null, b: DayKey | null): DayKey | null {
  if (a === null) return b;
  if (b === null) return a;
  return a > b ? a : b;
}
