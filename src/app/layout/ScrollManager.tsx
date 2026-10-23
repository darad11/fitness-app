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

  useLayoutEffect(() => {
    keyRef.current = location.key;
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
