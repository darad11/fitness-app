import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';

/** Scrollposition je Verlaufseintrag (`location.key`), solange die App offen ist. */
const positions = new Map<string, number>();

/**
 * So viele Bilder lang (rund 0,7 s) hält das Zurückgehen die Position fest: Die Liste lädt ihre
 * Daten erst nach dem Wechsel, und Platzhalter darüber ändern dabei noch ihre Höhe.
 */
const RESTORE_FRAMES = 40;

/**
 * Seitenanfang und Zurück (F5, D-324): Es scrollt das Fenster, nicht `main`. Eine neu geöffnete
 * Seite beginnt oben (vorher blieb die Scrollposition der Liste stehen, Detailseiten öffneten
 * mitten auf der Seite). Beim Zurückgehen kommt die gemerkte Position wieder, auch wenn die Liste
 * ihre Daten erst nach dem Wechsel lädt; eine Bedienung des Nutzers beendet das Nachhelfen.
 */
export function ScrollManager() {
  const location = useLocation();
  const type = useNavigationType();
  const keyRef = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const save = () => {
      positions.set(keyRef.current, window.scrollY);
    };
    // Beim Scrollen und unmittelbar vor einem Wechsel (Klick, Zurück), bevor die neue Seite
    // gezeichnet ist; das Scroll-Ereignis allein käme manchmal erst danach an.
    window.addEventListener('scroll', save, { passive: true });
    document.addEventListener('click', save, { capture: true });
    window.addEventListener('popstate', save, { capture: true });
    return () => {
      window.removeEventListener('scroll', save);
      document.removeEventListener('click', save, { capture: true });
      window.removeEventListener('popstate', save, { capture: true });
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
      const before = anchorRef.current;
      if (!before?.element.isConnected) {
        anchorRef.current = readingAnchor();
        return;
      }
      if (before.atTop) return;
      const shift = before.element.getBoundingClientRect().top - before.top;
      if (Math.abs(shift) > 1) {
        window.scrollTo({ top: window.scrollY + shift, behavior: 'instant' });
      }
    };
    window.addEventListener('scroll', remember, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchend', onTouch, { passive: true });
    window.addEventListener('touchcancel', onTouch, { passive: true });
    window.addEventListener('wheel', onInput, { passive: true });
    window.addEventListener('keydown', onInput);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', remember);
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
    window.scrollTo({ top: target, behavior: 'instant' });
    if (target === 0) return undefined;
    // Während des Festhaltens ohne Scroll-Verankerung des Browsers: Jede andere Änderung der
    // Position kommt dann vom Nutzer oder von der Seite selbst und beendet das Festhalten.
    const root = document.documentElement;
    const anchoring = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    let frame = 0;
    let count = 0;
    let last = window.scrollY;
    const stop = () => {
      cancelAnimationFrame(frame);
      root.style.overflowAnchor = anchoring;
      for (const name of STOP_EVENTS) window.removeEventListener(name, stop);
    };
    const step = () => {
      const room = root.scrollHeight - window.innerHeight;
      if (room >= target - 1 && Math.abs(window.scrollY - last) > 1) {
        stop();
        return;
      }
      if (Math.abs(window.scrollY - target) > 1) {
        window.scrollTo({ top: target, behavior: 'instant' });
      }
      last = window.scrollY;
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
  const atTop = window.scrollY <= 8;
  const y = window.innerHeight * READING_LINE;
  const box = main.getBoundingClientRect();
  for (const x of [box.left + box.width / 2, box.left + box.width / 4, box.left + 24]) {
    for (const element of document.elementsFromPoint(x, y)) {
      if (element === main || !main.contains(element) || element.closest('dialog')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.height === 0 || rect.height >= window.innerHeight || pinned(element, main)) continue;
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
