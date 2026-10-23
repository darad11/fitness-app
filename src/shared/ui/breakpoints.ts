/**
 * Breakpoints für Abfragen im Code (D-313). Im CSS stehen dieselben Werte an einer Stelle:
 * `src/app/styles.css`, `@theme`, `--breakpoint-*`; `src/app/breakpoints.test.ts` prüft, dass
 * beide gleich sind. Bis `md` einspaltig am Handy, ab `lg` Seitenleiste statt Tab-Leiste.
 */
export const BREAKPOINTS = {
  xs: '22.5rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Media-Abfrage „mindestens so breit wie der Breakpoint“, z. B. für `matchMedia`. */
export function minWidth(breakpoint: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]})`;
}

/** Ist das Fenster mindestens so breit wie der Breakpoint? Ohne `matchMedia` (Tests): nein. */
export function isAtLeast(breakpoint: Breakpoint): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(minWidth(breakpoint)).matches;
}
