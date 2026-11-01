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

/** Ereignisse, mit denen die Wiedergabe steht: Die gespielte Zeit zählt dann nicht weiter. */
const HALTS = ['pause', 'waiting', 'emptied', 'ended'] as const;

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
 * - `endless` (Player) ohne Ende, sonst `LOOP_RUNS` Durchläufe, dann steht das letzte Bild.
 *
 * Die Durchläufe wiederholt der Browser selbst (`loop`), auch außerhalb des Players; gezählt wird
 * die gespielte Zeit, nicht Ereignisse. Nach anderthalb Durchläufen, mitten im letzten, endet
 * `loop`; der Durchlauf läuft zu Ende, und das Video steht am letzten Bild. Die Zeit zählt, solange
 * das Video spielt (`playing` bis `pause`, `waiting`, `ended`): Weggescrollt, im Hintergrund oder
 * beim Nachladen zählt sie nicht. Vorher zählte die App die Enden (`ended`) und startete jeden
 * Durchlauf neu; WebKit unter Linux meldete dabei Enden doppelt oder gar nicht, die Schleife lief
 * dreimal oder ohne Ende (Nachträge zu D-497).
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
    // Auch außerhalb des Players wiederholt der Browser selbst, bis zum letzten Durchlauf.
    element.loop = true;
    /** Läuft der letzte Durchlauf (ohne `loop`)? */
    let lastRun = false;
    let wanted = true;
    /** Gespielte Zeit in Sekunden der Schleife, ohne den laufenden Abschnitt. */
    let played = 0;
    /** Beginn des laufenden Abschnitts (`performance.now()`), solange das Video spielt. */
    let since: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
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

    const rate = () => (element.playbackRate > 0 ? element.playbackRate : 1);
    const length = () =>
      Number.isFinite(element.duration) && element.duration > 0 ? element.duration : 0;
    const elapsed = () =>
      played + (since === null ? 0 : ((performance.now() - since) / 1000) * rate());
    /** Ab hier endet `loop`: mitten im letzten Durchlauf. */
    const budget = () => (LOOP_RUNS - 0.5) * length();

    const schedule = () => {
      clearTimeout(timer);
      timer = undefined;
      if (endless || lastRun || since === null || length() === 0) return;
      const rest = Math.max(0, budget() - elapsed());
      timer = setTimeout(
        () => {
          timer = undefined;
          if (elapsed() + 0.01 < budget()) {
            schedule();
            return;
          }
          lastRun = true;
          element.loop = false;
        },
        (rest / rate()) * 1000,
      );
    };
    const onPlaying = () => {
      since ??= performance.now();
      schedule();
    };
    const onHalt = () => {
      if (since !== null) {
        played = elapsed();
        since = null;
      }
      clearTimeout(timer);
      timer = undefined;
    };
    const onEnded = () => {
      if (endless) return;
      if (!lastRun) {
        // Mit `loop` endet ein Video nicht; meldet der Browser es doch, läuft es weiter.
        attempt();
        return;
      }
      wanted = false;
      // Manche Browser melden das Ende, ohne anzuhalten.
      if (!element.paused) element.pause();
      setStopped(true);
    };
    restart.current = () => {
      wanted = true;
      lastRun = false;
      element.loop = true;
      played = 0;
      if (since !== null) since = performance.now();
      element.currentTime = 0;
      setStopped(false);
      attempt();
      schedule();
    };

    for (const name of GESTURES) document.addEventListener(name, attempt, true);
    document.addEventListener('visibilitychange', attempt);
    element.addEventListener('canplay', attempt);
    element.addEventListener('ended', onEnded);
    if (!endless) {
      element.addEventListener('playing', onPlaying);
      for (const name of HALTS) element.addEventListener(name, onHalt);
      element.addEventListener('durationchange', schedule);
    }
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
      clearTimeout(timer);
      for (const name of GESTURES) document.removeEventListener(name, attempt, true);
      document.removeEventListener('visibilitychange', attempt);
      element.removeEventListener('canplay', attempt);
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('playing', onPlaying);
      for (const name of HALTS) element.removeEventListener(name, onHalt);
      element.removeEventListener('durationchange', schedule);
      observer?.disconnect();
      restart.current = () => undefined;
    };
  }, [endless]);

  const replay = useCallback(() => {
    restart.current();
  }, []);

  return { ref, stopped, replay };
}
