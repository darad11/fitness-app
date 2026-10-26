import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { onPageScroll, pageScrollTop, scrollPageBy } from '@/shared/ui';

/** Abstand des aktiven Satzes zum Kopf (mit Pausenkarte) und zur Fußleiste, in px. */
const GAP = 12;

/**
 * So viele Bilder lang (rund 0,5 s) hält ein Größenwechsel mit neuer Breite den aktiven Satz an
 * seiner Stelle; eine Bedienung des Nutzers beendet das Festhalten.
 */
const HOLD_FRAMES = 30;
const STOP_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

interface Anchor {
  /** Satz, an dem sich die Ansicht ausrichtet. */
  id: string;
  /** Oberkante im Fenster und Scrollposition der Seite beim Messen (Rahmen `#seite`, D-384). */
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
  return { id, top: row.getBoundingClientRect().top, scrollY: pageScrollTop() };
}

/**
 * Steht der Kopf über der Liste? In zwei Spalten (D-380, `player-layout.css`) steht er rechts
 * daneben und verdeckt keine Sätze; dann zählt er weder beim Zeigen noch als Scroll-Abstand.
 */
function headAbove(head: HTMLElement | null): boolean {
  const side = head?.closest<HTMLElement>('.player-side');
  return !side || getComputedStyle(side).display === 'contents';
}

/** Sichtbarer Bereich für Sätze: unter dem Kopf (wenn er darüber steht), über der Fußleiste. */
function band(head: HTMLElement | null, foot: HTMLElement | null): { top: number; bottom: number } {
  const top = (head && headAbove(head) ? head.getBoundingClientRect().bottom : 0) + GAP;
  const viewport = window.visualViewport;
  const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const bottom = Math.min(foot?.getBoundingClientRect().top ?? visibleBottom, visibleBottom) - GAP;
  return { top, bottom };
}

/**
 * Ist der Satz zu sehen, also seine Oberkante zwischen Kopf und Fußleiste? Ein Satz mit offenem
 * Menü darf unten in die Fußleiste reichen. Ohne Ausmaße (Tests ohne Layout) gilt er als sichtbar.
 */
function topVisible(row: HTMLElement, head: HTMLElement | null, foot: HTMLElement | null): boolean {
  const rect = row.getBoundingClientRect();
  if (rect.height === 0) return true;
  const { top, bottom } = band(head, foot);
  return rect.top >= top - 1 && rect.top <= bottom;
}

/**
 * Zeigt die Zeile ganz zwischen Kopf und Fußleiste, mit möglichst kleiner Bewegung; `instant`
 * beim Größenwechsel, der die Anordnung ohnehin auf einmal ändert.
 */
function reveal(
  row: HTMLElement,
  head: HTMLElement | null,
  foot: HTMLElement | null,
  instant = false,
): void {
  const rect = row.getBoundingClientRect();
  // Ohne Ausmaße (nicht dargestellt, z. B. in Tests ohne Layout) gibt es nichts zu zeigen.
  if (rect.height === 0) return;
  const { top, bottom } = band(head, foot);
  let delta = 0;
  if (rect.top < top) delta = rect.top - top;
  else if (rect.bottom > bottom) delta = Math.min(rect.bottom - bottom, rect.top - top);
  if (Math.abs(delta) < 1) return;
  const reduce = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollPageBy(delta, reduce ? 'instant' : 'smooth');
}

/** Merkt Lage und Sichtbarkeit des aktiven Satzes. */
function note(
  container: HTMLElement,
  head: HTMLElement | null,
  foot: HTMLElement | null,
  anchor: { current: Anchor | null },
  visible: { current: boolean },
): void {
  anchor.current = measure(container);
  const row = activeRow(container);
  visible.current = row ? topVisible(row, head, foot) : false;
}

/**
 * Nach einer Änderung der Anordnung ohne Zutun des Nutzers (Auf- und Zuklappen, Kopf mit anderer
 * Höhe; D-380): War der aktive Satz zu sehen, steht er wieder an derselben Stelle im Fenster; läge
 * er dort hinter dem Kopf oder unter der Fußleiste, wird er ganz gezeigt. Gemessen am Fenster, so
 * gleicht es auch einen Ausgleich davor aus (Leseposition D-375, Scroll-Verankerung des Browsers).
 */
function settle(
  container: HTMLElement,
  head: HTMLElement | null,
  foot: HTMLElement | null,
  before: Anchor | null,
  wasVisible: boolean,
): void {
  const row = before ? rowById(container, before.id) : null;
  if (!before || !row || !wasVisible) return;
  const delta = row.getBoundingClientRect().top - before.top;
  if (Math.abs(delta) > 1) scrollPageBy(delta);
  if (!topVisible(row, head, foot)) reveal(row, head, foot, true);
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
 *   damit auch der Browser beim Fokussieren eines Feldes nicht hinter den Kopf scrollt. In zwei
 *   Spalten steht der Kopf neben der Liste und zählt nicht (D-380); `--player-foot` ist die Höhe
 *   der Fußleiste.
 */
export function useStableSetView(
  root: RefObject<HTMLElement | null>,
  head: RefObject<HTMLElement | null>,
  foot: RefObject<HTMLElement | null>,
  currentId: string | null,
): void {
  const anchor = useRef<Anchor | null>(null);
  const shownCurrent = useRef<string | null>(currentId);
  /** War der aktive Satz zuletzt zu sehen? Gilt bei der nächsten Änderung der Anordnung (D-380). */
  const visible = useRef(true);
  /** Zuletzt gemeldete Höhe des Kopfs (ResizeObserver). */
  const headHeight = useRef<number | null>(null);

  useEffect(() => {
    const container = root.current;
    const header = head.current;
    if (!container || !header) return undefined;
    const update = () => {
      const above = headAbove(header);
      container.style.setProperty('--player-head', `${String(above ? header.offsetHeight : 0)}px`);
      // Höhe der Fußleiste: Die Steuerung in zwei Spalten endet darüber (D-380).
      container.style.setProperty('--player-foot', `${String(foot.current?.offsetHeight ?? 0)}px`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    // Kopf und Fußleiste ändern ihre Größe auch beim Wechsel zwischen einer und zwei Spalten.
    // Ändert der Kopf seine Höhe ohne neue Darstellung (die Pause wechselt zwischen Zeile und
    // Karte, der sichere Bereich ändert sich), bleibt der aktive Satz im selben Bild an seiner
    // Stelle, nicht erst beim nächsten Takt der Pause (D-380).
    headHeight.current = header.offsetHeight;
    const observer = new ResizeObserver(() => {
      update();
      if (header.offsetHeight === headHeight.current) return;
      headHeight.current = header.offsetHeight;
      settle(container, header, foot.current, anchor.current, visible.current);
      note(container, header, foot.current, anchor, visible);
    });
    // Außenkante: Der sichere Bereich ändert nur den Innenabstand von Kopf und Fußleiste.
    observer.observe(header, { box: 'border-box' });
    if (foot.current) observer.observe(foot.current, { box: 'border-box' });
    return () => {
      observer.disconnect();
    };
  }, [root, head, foot]);

  useEffect(() => {
    let frame = 0;
    let resizeFrame = 0;
    let holdFrame = 0;
    let width = window.innerWidth;
    /** Hat sich seit dem letzten Ausgleich die Breite geändert? */
    let widthChanged = false;
    let stopHold: (() => void) | null = null;
    /**
     * Hält den Satz nach dem Ausgleich einige Bilder lang dort, wo er jetzt steht (Nachtrag zu
     * D-384): Der Browser kann die neue Anordnung erst Bilder später fertig haben oder danach
     * noch selbst scrollen. Nur bei neuer Breite (Auf- und Zuklappen, Drehen); die Tastatur ändert
     * nur die Höhe, dort scrollt der Browser zum Feld.
     */
    const hold = (target: HTMLElement) => {
      stopHold?.();
      const id = target.dataset.setId ?? '';
      let top = target.getBoundingClientRect().top;
      let count = 0;
      const stop = () => {
        cancelAnimationFrame(holdFrame);
        for (const name of STOP_EVENTS) window.removeEventListener(name, stop);
        stopHold = null;
      };
      const step = () => {
        const container = root.current;
        const row = container ? rowById(container, id) : null;
        if (!container || !row) {
          stop();
          return;
        }
        const delta = row.getBoundingClientRect().top - top;
        if (Math.abs(delta) > 1) scrollPageBy(delta);
        // Wird der Kopf noch höher, zeigt es den Satz darunter und hält ihn dort.
        if (!topVisible(row, head.current, foot.current)) {
          reveal(row, head.current, foot.current, true);
          top = row.getBoundingClientRect().top;
        }
        count += 1;
        if (count < HOLD_FRAMES) holdFrame = requestAnimationFrame(step);
        else stop();
      };
      for (const name of STOP_EVENTS) window.addEventListener(name, stop, { passive: true });
      stopHold = stop;
      holdFrame = requestAnimationFrame(step);
    };
    const remember = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const container = root.current;
        if (!container) return;
        // Hat der Kopf in diesem Bild seine Höhe geändert, gleicht das gleich danach der
        // ResizeObserver aus. Jetzt gemessen, gälte die Verschiebung als neue Lage (D-380).
        if (head.current && head.current.offsetHeight !== headHeight.current) return;
        note(container, head.current, foot.current, anchor, visible);
      });
    };
    // Auf- und Zuklappen (D-380): Der Kopf wechselt zwischen über und neben der Liste, die Pause
    // zwischen Zeile und Karte, Text bricht anders um. Ausgeglichen wird im ersten Bild nach der
    // Größenänderung, vor jedem Takt der Pause (vorher sprang der Satz bis dahin um die Änderung
    // des Kopfs). Hat man anderswo hingescrollt, bleibt es bei der Leseposition (D-375).
    const onResize = () => {
      const before = anchor.current;
      const wasVisible = visible.current;
      widthChanged ||= window.innerWidth !== width;
      width = window.innerWidth;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const container = root.current;
        if (!container) return;
        settle(container, head.current, foot.current, before, wasVisible);
        note(container, head.current, foot.current, anchor, visible);
        const row = before && wasVisible && widthChanged ? rowById(container, before.id) : null;
        if (row) hold(row);
        widthChanged = false;
      });
    };
    const detachScroll = onPageScroll(remember);
    window.addEventListener('resize', onResize);
    document.addEventListener('focusin', remember);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      stopHold?.();
      detachScroll();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('focusin', remember);
    };
  }, [root, head, foot]);

  // Nach jeder Darstellung, vor dem Zeichnen; ohne Abhängigkeiten, weil sich Kopf und Liste bei
  // jeder Änderung der Einheit verschieben können.
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const before = anchor.current;
    const row = before ? rowById(container, before.id) : null;
    if (before && row) {
      const shift =
        row.getBoundingClientRect().top + pageScrollTop() - (before.top + before.scrollY);
      if (Math.abs(shift) > 1) scrollPageBy(shift);
    }
    if (currentId !== shownCurrent.current) {
      shownCurrent.current = currentId;
      const next = currentId ? rowById(container, currentId) : null;
      if (next) reveal(next, head.current, foot.current);
    }
    note(container, head.current, foot.current, anchor, visible);
  });
}
