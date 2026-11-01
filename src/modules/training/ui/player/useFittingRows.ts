import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Annahmen, solange nichts gemessen ist: Höhe eines Eintrags und der Zeile „und n weitere“. */
const ROW_FALLBACK_PX = 40;
const MORE_FALLBACK_PX = 28;

/**
 * Zahl der ganzen Einträge für `space` px (D-495): Einträge von `row` px mit `gap` px Abstand;
 * passen nicht alle `total`, braucht die Zeile „und n weitere“ noch `more` px darunter.
 */
export function fittingCount(
  space: number,
  row: number,
  gap: number,
  more: number,
  total: number,
): number {
  const fit = (room: number) => Math.max(0, Math.floor((room + gap) / (row + gap)));
  const all = Math.min(total, fit(space));
  return all < total ? Math.min(all, fit(space - more)) : all;
}

/**
 * Wie viele Einträge einer Liste passen ganz in ihren Bereich (D-495)? Für „Als Nächstes“ in der
 * rechten Spalte des Players: Die Spalte steht fest und ist so hoch wie der sichtbare Platz über
 * der Fußleiste; die Liste bekommt, was Kopf, Demonstration und „Jetzt“ übrig lassen, und zeigt
 * nur ganze Einträge. Bleiben Einträge weg, braucht die Zeile „und n weitere Übungen“ Platz.
 *
 * `area` ist der Bereich mit der Liste (`<ol>`) und gegebenenfalls der Zeile `[data-mehr]`
 * darunter; seine Höhe gibt das Layout vor, angezeigt durch die CSS-Variable `--nur-ganze: 1`
 * (`player-layout.css`). Sonst (eine Spalte: der Bereich ist ausgeblendet; niedriges Fenster:
 * die Spalte scrollt; Tests ohne Layout) gelten alle `total` Einträge. Gemessen wird vor dem
 * Zeichnen und bei jeder Größenänderung des Bereichs.
 */
export function useFittingRows(area: RefObject<HTMLElement | null>, total: number): number {
  const [fitting, setFitting] = useState(total);
  const rowHeight = useRef(ROW_FALLBACK_PX);
  const moreHeight = useRef(MORE_FALLBACK_PX);

  useLayoutEffect(() => {
    const box = area.current;
    // Ohne Bereich gibt es keine Einträge (`total` ist 0).
    if (!box) return undefined;
    const measure = () => {
      const list = box.querySelector('ol');
      const style = getComputedStyle(box);
      // Ausgeblendet (eine Spalte), ohne Liste oder ohne vorgegebene Höhe (`--nur-ganze` nicht 1,
      // die Spalte scrollt bei niedrigem Fenster für sich): alle, wie bisher.
      if (
        !list ||
        box.getClientRects().length === 0 ||
        box.clientHeight === 0 ||
        style.getPropertyValue('--nur-ganze').trim() !== '1'
      ) {
        setFitting(total);
        return;
      }
      const row = list.querySelector('li');
      if (row && row.offsetHeight > 0) rowHeight.current = row.offsetHeight;
      const more = box.querySelector<HTMLElement>('[data-mehr]');
      if (more && more.offsetHeight > 0) {
        moreHeight.current = more.offsetHeight + parseFloat(getComputedStyle(more).marginTop);
      }
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      // Platz unter dem Anfang der Liste bis zum Innenrand unten.
      const top = list.getBoundingClientRect().top - box.getBoundingClientRect().top;
      const space = box.clientHeight - top - parseFloat(style.paddingBottom);
      setFitting(fittingCount(space, rowHeight.current, gap, moreHeight.current, total));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [area, total]);

  return Math.min(fitting, total);
}
