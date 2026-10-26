import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';
import {
  onPageScroll,
  ownPositionHeld,
  pageScroller,
  pageScrollTop,
  pageViewportHeight,
  scrollPageTo,
  suspendScrollAnchoring,
} from '@/shared/ui/pageScroll';

/** Scrollposition je Verlaufseintrag (`location.key`), solange die App offen ist. */
const positions = new Map<string, number>();

/**
 * So viele Bilder lang (rund 0,7 s) hält das Zurückgehen die Position fest: Die Liste lädt ihre
 * Daten erst nach dem Wechsel, und Platzhalter darüber ändern dabei noch ihre Höhe.
 */
const RESTORE_FRAMES = 40;

/**
 * Seitenanfang und Zurück (F5, D-324): Es scrollt der Rahmen der App (`#seite`, D-384), nicht
 * das Fenster und nicht `main`. Eine neu geöffnete Seite beginnt oben (vorher blieb die
 * Scrollposition der Liste stehen, Detailseiten öffneten mitten auf der Seite). Beim Zurückgehen
 * kommt die gemerkte Position wieder, auch wenn die Liste ihre Daten erst nach dem Wechsel lädt;
 * eine Bedienung des Nutzers beendet das Nachhelfen.
 */
export function ScrollManager() {
  const location = useLocation();
  const type = useNavigationType();
  const keyRef = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const save = () => {
      positions.set(keyRef.current, pageScrollTop());
    };
    // Beim Scrollen und unmittelbar vor einem Wechsel (Klick, Zurück), bevor die neue Seite
    // gezeichnet ist; das Scroll-Ereignis allein käme manchmal erst danach an.
    const detachScroll = onPageScroll(save);
    document.addEventListener('click', save, { capture: true });
    window.addEventListener('popstate', save, { capture: true });
    return () => {
      detachScroll();
      document.removeEventListener('click', save, { capture: true });
      window.removeEventListener('popstate', save, { capture: true });
    };
  }, []);

  // Tastatur am Desktop (D-384): Ohne Fokus scrollen Bild auf und ab, Leertaste, Pfeile, Pos1 und
  // Ende den Rahmen, wie zuvor das Fenster. Der Browser leitet sie nur dorthin, wenn der Fokus im
  // Rahmen liegt; den Fokus zu setzen, änderte aber die Reihenfolge der Tab-Taste.
  useEffect(() => {
    window.addEventListener('keydown', keyScroll);
    return () => {
      window.removeEventListener('keydown', keyScroll);
    };
  }, []);

  // Leseposition beim Auf- und Zuklappen (D-375): Ändert sich die Breite, bricht der Text anders
  // um, und ohne Ausgleich rutscht der Inhalt unter dem Finger weg (WebKit kennt keine
  // Scroll-Verankerung, Chromium setzt sie bei einer Breitenänderung aus). Gemerkt wird das
  // Element auf der Leselinie; nach der Größenänderung steht es wieder dort. Es bleibt der
  // Bezug, bis der Nutzer selbst scrollt: So kommt es nach Auf- und wieder Zuklappen an genau
  // dieselbe Stelle, auch wenn eine Haltung dazwischen das Scrollen begrenzt hat.
  const anchorRef = useRef<ReadingAnchor | null>(null);
  useEffect(() => {
    let frame = 0;
    let resizedAt = -Infinity;
    let inputAt = -Infinity;
    let touching = false;
    const onInput = () => {
      inputAt = performance.now();
    };
    const onTouch = (event: TouchEvent) => {
      touching = event.type === 'touchstart';
      onInput();
    };
    const remember = () => {
      // Scrollen kurz nach einer Größenänderung kommt vom Ausgleich oder vom Browser, außer der
      // Nutzer bedient gerade selbst (Finger, Mausrad, Tasten).
      const now = performance.now();
      const own = touching || now - inputAt < RESIZE_SETTLE_MS;
      if (now - resizedAt < RESIZE_SETTLE_MS && !own) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        anchorRef.current = readingAnchor();
      });
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      resizedAt = performance.now();
      // Hält die Seite ihre Lage selbst (Player), gleicht nur sie aus (Nachtrag zu D-384).
      if (ownPositionHeld()) {
        anchorRef.current = null;
        return;
      }
      const before = anchorRef.current;
      if (!before?.element.isConnected) {
        anchorRef.current = readingAnchor();
        return;
      }
      if (before.atTop) return;
      const shift = before.element.getBoundingClientRect().top - before.top;
      if (Math.abs(shift) > 1) scrollPageTo(pageScrollTop() + shift);
    };
    const detachScroll = onPageScroll(remember);
    window.addEventListener('resize', onResize);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchend', onTouch, { passive: true });
    window.addEventListener('touchcancel', onTouch, { passive: true });
    window.addEventListener('wheel', onInput, { passive: true });
    window.addEventListener('keydown', onInput);
    return () => {
      cancelAnimationFrame(frame);
      detachScroll();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchend', onTouch);
      window.removeEventListener('touchcancel', onTouch);
      window.removeEventListener('wheel', onInput);
      window.removeEventListener('keydown', onInput);
    };
  }, []);

  useLayoutEffect(() => {
    keyRef.current = location.key;
    anchorRef.current = null;
    if (location.hash) return undefined;
    const target = type === NavigationType.Pop ? (positions.get(location.key) ?? 0) : 0;
    scrollPageTo(target);
    if (target === 0) return undefined;
    // Während des Festhaltens ohne Scroll-Verankerung des Browsers: Jede andere Änderung der
    // Position kommt dann vom Nutzer oder von der Seite selbst und beendet das Festhalten.
    const root = pageScroller();
    const resumeAnchoring = suspendScrollAnchoring();
    let frame = 0;
    let count = 0;
    let last = pageScrollTop();
    const stop = () => {
      cancelAnimationFrame(frame);
      resumeAnchoring();
      for (const name of STOP_EVENTS) window.removeEventListener(name, stop);
    };
    const step = () => {
      const room = root.scrollHeight - root.clientHeight;
      if (room >= target - 1 && Math.abs(root.scrollTop - last) > 1) {
        stop();
        return;
      }
      if (Math.abs(root.scrollTop - target) > 1) scrollPageTo(target);
      last = root.scrollTop;
      count += 1;
      if (count >= RESTORE_FRAMES) stop();
      else frame = requestAnimationFrame(step);
    };
    for (const name of STOP_EVENTS) window.addEventListener(name, stop, { passive: true });
    frame = requestAnimationFrame(step);
    return stop;
  }, [location.key, location.hash, type]);

  return null;
}

const STOP_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/** Pfeiltasten scrollen um so viele px, wie es Browser beim Fenster tun. */
const ARROW_STEP = 40;

/**
 * Scroll-Tasten ohne Fokus (D-384): Liegt der Fokus auf `body`, scrollt die Taste den Rahmen der
 * Seite um eine Bildschirmseite (Bild auf und ab, Leertaste, mit Umschalt zurück), eine Zeile
 * (Pfeile) oder an Anfang und Ende (Pos1, Ende). Felder, Knöpfe, offene Dialoge und Tastenkürzel
 * mit Strg, Alt oder Befehl bleiben unberührt; ohne Rahmen scrollt der Browser selbst.
 */
function keyScroll(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target !== document.body && event.target !== document.documentElement) return;
  if (document.querySelector('dialog[open]')) return;
  const frame = pageScroller();
  if (frame === document.scrollingElement || frame === document.documentElement) return;
  const page = Math.max(ARROW_STEP, frame.clientHeight * 0.875);
  const steps: Record<string, number> = {
    PageDown: page,
    PageUp: -page,
    ' ': event.shiftKey ? -page : page,
    ArrowDown: ARROW_STEP,
    ArrowUp: -ARROW_STEP,
    Home: -frame.scrollHeight,
    End: frame.scrollHeight,
  };
  const delta = steps[event.key];
  if (delta === undefined) return;
  event.preventDefault();
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  frame.scrollBy({ top: delta, behavior: reduce ? 'instant' : 'smooth' });
}

interface ReadingAnchor {
  element: Element;
  /** Oberkante im Fenster beim Merken. */
  top: number;
  /** Seite stand ganz oben: Sie bleibt oben, statt einem Element nachzurücken. */
  atTop: boolean;
}

/** Die Leselinie liegt auf einem Viertel der Fensterhöhe. */
const READING_LINE = 0.25;

/** So lange nach einer Größenänderung wählt Scrollen keinen neuen Bezug (ms). */
const RESIZE_SETTLE_MS = 500;

/**
 * Element des Inhalts (`main`) auf der Leselinie, ohne Dialoge und ohne feste oder klebende
 * Teile (die verschieben sich beim Scrollen nicht mit dem Inhalt).
 */
function readingAnchor(): ReadingAnchor | null {
  const main = document.getElementById('inhalt');
  if (!main || typeof document.elementsFromPoint !== 'function') return null;
  const atTop = pageScrollTop() <= 8;
  const height = pageViewportHeight();
  // Der Rahmen beginnt oben im Fenster (`inset: 0`); die Leselinie gilt also im Fenster.
  const y = height * READING_LINE;
  const box = main.getBoundingClientRect();
  for (const x of [box.left + box.width / 2, box.left + box.width / 4, box.left + 24]) {
    for (const element of document.elementsFromPoint(x, y)) {
      if (element === main || !main.contains(element) || element.closest('dialog')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.height === 0 || rect.height >= height || pinned(element, main)) continue;
      return { element, top: rect.top, atTop };
    }
  }
  return null;
}

/** Liegt das Element in einem festen oder klebenden Teil der Seite? */
function pinned(element: Element, root: Element): boolean {
  for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
    const { position } = getComputedStyle(node);
    if (position === 'fixed' || position === 'sticky') return true;
  }
  return false;
}
