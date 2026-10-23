import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/** Abstand des aktiven Satzes zum Kopf (mit Pausenkarte) und zur Fußleiste, in px. */
const GAP = 12;

interface Anchor {
  /** Satz, an dem sich die Ansicht ausrichtet. */
  id: string;
  /** Oberkante im Fenster und Scrollposition beim Messen. */
  top: number;
  scrollY: number;
}

/** Zeile des aktiven Satzes: die mit dem Fokus (Eingabe), sonst der nächste offene Satz. */
function activeRow(root: HTMLElement): HTMLElement | null {
  const focused = document.activeElement;
  const row = focused instanceof HTMLElement ? focused.closest<HTMLElement>('[data-set-id]') : null;
  if (row && root.contains(row)) return row;
  return root.querySelector<HTMLElement>('[data-set-id][aria-current="step"]');
}

/** Satz-IDs sind UUIDs, im Selektor also ohne Maskierung sicher. */
function rowById(root: HTMLElement, id: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-set-id="${id}"]`);
}

function measure(root: HTMLElement): Anchor | null {
  const row = activeRow(root);
  const id = row?.dataset.setId;
  if (!row || !id) return null;
  return { id, top: row.getBoundingClientRect().top, scrollY: window.scrollY };
}

/** Zeigt die Zeile ganz zwischen Kopf und Fußleiste, mit möglichst kleiner Bewegung. */
function reveal(row: HTMLElement, head: HTMLElement | null, foot: HTMLElement | null): void {
  const rect = row.getBoundingClientRect();
  // Ohne Ausmaße (nicht dargestellt, z. B. in Tests ohne Layout) gibt es nichts zu zeigen.
  if (rect.height === 0) return;
  const top = (head?.getBoundingClientRect().bottom ?? 0) + GAP;
  const viewport = window.visualViewport;
  const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const bottom = Math.min(foot?.getBoundingClientRect().top ?? visibleBottom, visibleBottom) - GAP;
  let delta = 0;
  if (rect.top < top) delta = rect.top - top;
  else if (rect.bottom > bottom) delta = Math.min(rect.bottom - bottom, rect.top - top);
  if (Math.abs(delta) < 1) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollBy({ top: delta, behavior: reduce ? 'instant' : 'smooth' });
}

/**
 * Hält die Satzliste im aktiven Training ruhig (F5, D-323). Beim Erledigen eines Satzes erscheint
 * oben im klebenden Kopf die Pausenkarte, und die Karte „Jetzt“ über der Liste entfällt; endet
 * die Pause, kehrt beides um. Ohne Ausgleich rutschten der erledigte und der nächste Satz hinter
 * Kopf und Pausenkarte.
 *
 * - Vor dem Zeichnen gleicht der Hook jede Verschiebung durch Änderungen über dem aktiven Satz
 *   aus: Der Satz mit dem Fokus (beim Tippen) bzw. der zuletzt aktive Satz bleibt, wo er war.
 *   Gescrollt wird dabei nur um die Verschiebung, nie gegen das Scrollen des Nutzers.
 * - Wechselt der aktive Satz (erledigt, wieder geöffnet), zeigt er den neuen ganz unterhalb von
 *   Kopf und Pausenkarte und oberhalb der Fußleiste, aber nur, wenn er sonst verdeckt wäre.
 * - Die Höhe des Kopfs steht als `--player-head` bereit (`scroll-margin-top` der Satzzeilen),
 *   damit auch der Browser beim Fokussieren eines Feldes nicht hinter den Kopf scrollt.
 */
export function useStableSetView(
  root: RefObject<HTMLElement | null>,
  head: RefObject<HTMLElement | null>,
  foot: RefObject<HTMLElement | null>,
  currentId: string | null,
): void {
  const anchor = useRef<Anchor | null>(null);
  const shownCurrent = useRef<string | null>(currentId);

  useEffect(() => {
    const container = root.current;
    const header = head.current;
    if (!container || !header) return undefined;
    const update = () => {
      container.style.setProperty('--player-head', `${String(header.offsetHeight)}px`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => {
      observer.disconnect();
    };
  }, [root, head]);

  useEffect(() => {
    let frame = 0;
    const remember = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (root.current) anchor.current = measure(root.current);
      });
    };
    window.addEventListener('scroll', remember, { passive: true });
    document.addEventListener('focusin', remember);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', remember);
      document.removeEventListener('focusin', remember);
    };
  }, [root]);

  // Nach jeder Darstellung, vor dem Zeichnen; ohne Abhängigkeiten, weil sich Kopf und Liste bei
  // jeder Änderung der Einheit verschieben können.
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const before = anchor.current;
    const row = before ? rowById(container, before.id) : null;
    if (before && row) {
      const shift =
        row.getBoundingClientRect().top + window.scrollY - (before.top + before.scrollY);
      if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
    }
    if (currentId !== shownCurrent.current) {
      shownCurrent.current = currentId;
      const next = currentId ? rowById(container, currentId) : null;
      if (next) reveal(next, head.current, foot.current);
    }
    anchor.current = measure(container);
  });
}
