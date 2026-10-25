/**
 * Wischen zum Löschen in der Einkaufsliste (Phase Ernährung §4, D-360), ohne React und DOM:
 * Richtung festlegen, Verschiebung begrenzen, Löschen erst ab einer Mindeststrecke.
 */

/** Unterhalb dieser Strecke (px) ist noch nicht entschieden, wohin der Finger will. */
export const SWIPE_SLOP = 10;
/** Waagrecht heißt: mindestens doppelt so weit zur Seite wie nach oben oder unten (unter etwa 27°). */
export const SWIPE_DIRECTION_RATIO = 2;
/** Löschen ab 40 % der Zeilenbreite, mindestens aber 96 px: ein kurzer Wisch löst nichts aus. */
export const SWIPE_DELETE_SHARE = 0.4;
export const SWIPE_DELETE_MIN = 96;

/** `pending` vor der Entscheidung, `swipe` waagrecht nach links, `ignore` alles andere. */
export type SwipeIntent = 'pending' | 'swipe' | 'ignore';

/**
 * Entscheidet nach den ersten Pixeln einmal für die ganze Geste: Nur ein klar waagrechter Wisch
 * nach links wird zum Löschwisch. Senkrecht (Scrollen), schräg oder nach rechts bleibt die Zeile
 * stehen, auch wenn der Finger später waagrecht weiterzieht.
 */
export function swipeIntent(dx: number, dy: number): SwipeIntent {
  if (Math.hypot(dx, dy) < SWIPE_SLOP) return 'pending';
  return dx < 0 && Math.abs(dx) >= SWIPE_DIRECTION_RATIO * Math.abs(dy) ? 'swipe' : 'ignore';
}

/** Verschiebung der Zeile: nur nach links, höchstens um die eigene Breite. */
export function swipeOffset(dx: number, width: number): number {
  return Math.max(Math.min(dx, 0), -Math.max(width, 0));
}

/** Strecke, ab der das Loslassen löscht. */
export function deleteDistance(width: number): number {
  return Math.max(SWIPE_DELETE_MIN, width * SWIPE_DELETE_SHARE);
}

/** Löscht das Loslassen bei dieser Verschiebung? */
export function releasesDelete(offset: number, width: number): boolean {
  return -offset >= deleteDistance(width);
}
