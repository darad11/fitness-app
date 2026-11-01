import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * So oft läuft eine Schleife außerhalb des Players von selbst, dann hält sie an (D-497): in der
 * Übungsinfo und in den Details. Zwei Durchläufe sind 5 s Bewegung, die Grenze von WCAG 2.2.2
 * („Pause, Stop, Hide“) für Bewegung, die von selbst startet. Im Player läuft sie ohne Ende
 * (Leitlinien Kapitel 3: nahtlos wiederholt); bei weniger Bewegung steht überall das Standbild.
 */
export const LOOP_RUNS = 2;

/**
 * Ereignisse, die iOS als Geste zählt (`touchend`, `click`, `keydown`; `pointerup` für die übrigen
 * Browser). Nur darin darf ein Video starten, wenn das System das Abspielen sonst ablehnt, etwa im
 * Stromsparmodus.
 */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const;

/** Rücksprung der Zeit um mehr als das: Die Schleife hat einen Durchlauf beendet. */
const WRAP_SECONDS = 0.5;

export interface LoopPlayback {
  /** Gehört an das `<video>`. */
  ref: RefObject<HTMLVideoElement | null>;
  /** Nach den Durchläufen angehalten: Die Ansicht zeigt das Symbol zum Wiederholen. */
  stopped: boolean;
  /** Spielt die Schleife von vorn wieder `LOOP_RUNS`-mal ab; innerhalb einer Geste aufrufen. */
  replay: () => void;
}

/**
 * Abspielen einer stummen Schleife (D-497). Die App startet sie selbst mit `play()`, das Attribut
 * `autoplay` fehlt: Safari startet `autoplay` nur, solange es das Video für sichtbar hält, und hält
 * es an, sobald es das nicht mehr tut. In der festen rechten Spalte des Players (klebend, mit
 * negativem Rand, `overflow: clip`, in einem eigenen Scrollbereich) ist diese Prüfung die
 * wahrscheinliche Ursache dafür, dass die Beinpresse nach dem Start nicht lief, in der Übungsinfo
 * aber schon. Für `play()` gilt sie nicht. Deshalb:
 *
 * - stumm (Eigenschaft und Attribut) und `playsInline`, dann ist `play()` ohne Geste erlaubt,
 * - `play()`, sobald das Video wirklich sichtbar ist (`IntersectionObserver`), wenn es abspielbar
 *   wird und bei Rückkehr in die App; unsichtbar (andere Spalte, weggescrollt) hält es an,
 * - lehnt das System ab (Stromsparmodus: nur aus einer Geste), startet es bei der nächsten Geste
 *   irgendwo in der App,
 * - `endless` (Player) mit `loop` ohne Ende, sonst `LOOP_RUNS` nahtlose Durchläufe: `loop` bis
 *   zum Beginn des letzten, dann endet das Video und zeigt sein letztes Bild.
 */
export function useLoopPlayback(endless: boolean): LoopPlayback {
  const ref = useRef<HTMLVideoElement>(null);
  const [stopped, setStopped] = useState(false);
  const restart = useRef<() => void>(() => undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    element.muted = true;
    element.defaultMuted = true;
    element.setAttribute('muted', '');
    element.playsInline = true;
    // Auch mit zwei Durchläufen zunächst `loop`: Der Übergang in den letzten ist so nahtlos.
    element.loop = true;
    let runs = 0;
    let last = 0;
    let wanted = true;
    // Ohne IntersectionObserver (sehr alte Browser, Tests) gilt das Video als sichtbar.
    const observed = typeof IntersectionObserver !== 'undefined';
    let visible = !observed;

    const attempt = () => {
      if (!wanted || !visible || document.visibilityState === 'hidden' || !element.paused) return;
      // Abgelehnt oder unterbrochen: Die nächste Geste, das Sichtbarwerden oder die Rückkehr in
      // die App versuchen es erneut. Ältere Browser geben kein Promise zurück oder werfen.
      try {
        Promise.resolve(element.play()).catch(() => undefined);
      } catch {
        // wie abgelehnt
      }
    };
    const onTime = () => {
      const now = element.currentTime;
      if (now + WRAP_SECONDS < last) {
        runs += 1;
        if (!endless && runs >= LOOP_RUNS - 1) element.loop = false;
      }
      last = now;
    };
    const onEnded = () => {
      if (endless) return;
      wanted = false;
      setStopped(true);
    };
    restart.current = () => {
      runs = 0;
      last = 0;
      wanted = true;
      element.loop = true;
      element.currentTime = 0;
      setStopped(false);
      attempt();
    };

    for (const name of GESTURES) document.addEventListener(name, attempt, true);
    document.addEventListener('visibilitychange', attempt);
    element.addEventListener('canplay', attempt);
    element.addEventListener('timeupdate', onTime);
    element.addEventListener('ended', onEnded);
    let observer: IntersectionObserver | undefined;
    if (observed) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) attempt();
        else if (!element.paused) element.pause();
      });
      observer.observe(element);
    }
    attempt();

    return () => {
      for (const name of GESTURES) document.removeEventListener(name, attempt, true);
      document.removeEventListener('visibilitychange', attempt);
      element.removeEventListener('canplay', attempt);
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('ended', onEnded);
      observer?.disconnect();
      restart.current = () => undefined;
    };
  }, [endless]);

  const replay = useCallback(() => {
    restart.current();
  }, []);

  return { ref, stopped, replay };
}
