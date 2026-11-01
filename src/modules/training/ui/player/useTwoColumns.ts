import { useLayoutEffect, useState, type RefObject } from 'react';

/** Ab dieser Breite (rem) steht der Player in zwei Spalten, wie `@container player (min-width: 48rem)`. */
export const TWO_COLUMNS_REM = 48;

/**
 * Steht der Player in zwei Spalten? Gemessen an seinem Rahmen (`.player-frame`) wie die
 * Container-Abfrage im CSS, beim Öffnen vor dem ersten Bild und bei jeder neuen Breite (D-502).
 */
export function useTwoColumns(frame: RefObject<HTMLElement | null>): boolean {
  const [two, setTwo] = useState(false);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    const check = (width: number) => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setTwo(width >= TWO_COLUMNS_REM * rem);
    };
    check(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) check(entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [frame]);
  return two;
}
