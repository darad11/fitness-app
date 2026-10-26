import { useEffect, type RefObject } from 'react';
import { onPageScroll, typing } from '@/shared/ui';

/** Attribut an der Fußleiste, solange sie das Feld verdecken würde (`styles.css`, D-391). */
export const FOOT_COVERING = 'data-covering';

/** Liegen die beiden Rechtecke um mehr als 1 px übereinander? */
function overlap(a: DOMRect, b: DOMRect): boolean {
  return (
    a.bottom > b.top + 1 && a.top < b.bottom - 1 && a.right > b.left + 1 && a.left < b.right - 1
  );
}

/**
 * Fußleiste im Training bei offener Tastatur (D-391): Sie bleibt über der Tastatur, „Satz
 * erledigt“ also in Reichweite, solange sie das Feld nicht verdeckt, in das getippt wird. Würde
 * sie es verdecken (niedriges Fenster wie iPhone quer, große Tastatur, Feld unter die Leiste
 * gescrollt), ist sie aus, bis das Feld wieder frei steht oder die Tastatur zugeht. Geprüft wird
 * nach jedem Fokuswechsel, Größenwechsel (die Tastatur geht auf) und Scrollen; das Maß der
 * ausgeblendeten Leiste bleibt dabei gleich, es springt also nichts hin und her. Felder in
 * Dialogen liegen ohnehin über der Leiste.
 */
export function useFootClearOfField(foot: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bar = foot.current;
        if (!bar) return;
        const field = document.activeElement;
        const covering =
          typing() &&
          field instanceof HTMLElement &&
          !bar.contains(field) &&
          !field.closest('dialog') &&
          overlap(field.getBoundingClientRect(), bar.getBoundingClientRect());
        bar.toggleAttribute(FOOT_COVERING, covering);
      });
    };
    const viewport = window.visualViewport;
    const detachScroll = onPageScroll(check);
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    window.addEventListener('resize', check);
    viewport?.addEventListener('resize', check);
    viewport?.addEventListener('scroll', check);
    check();
    const bar = foot.current;
    return () => {
      cancelAnimationFrame(frame);
      detachScroll();
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
      window.removeEventListener('resize', check);
      viewport?.removeEventListener('resize', check);
      viewport?.removeEventListener('scroll', check);
      bar?.removeAttribute(FOOT_COVERING);
    };
  }, [foot]);
}
