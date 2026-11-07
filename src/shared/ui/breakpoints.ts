import { useCallback, useSyncExternalStore } from 'react';

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

/**
 * Ist das Fenster mindestens so breit wie der Breakpoint, und bleibt das so (D-499)? Folgt dem
 * Fenster, etwa beim Auf- und Zuklappen des Duo. Ohne `matchMedia` (Tests): nein.
 */
export function useAtLeast(breakpoint: Breakpoint): boolean {
  const query = minWidth(breakpoint);
  const subscribe = useCallback(
    (change: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', change);
      return () => {
        list.removeEventListener('change', change);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}
