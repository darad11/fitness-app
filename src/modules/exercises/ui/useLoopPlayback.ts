import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/*
 * Außerhalb des Players (Übungsinfo, Details) läuft eine Schleife von selbst zweimal, dann hält sie
 * an (D-497): Zwei Durchläufe sind 5 s Bewegung, die Grenze von WCAG 2.2.2 („Pause, Stop, Hide“)
 * für Bewegung, die von selbst startet. Im Player läuft sie ohne Ende (Leitlinien Kapitel 3:
 * nahtlos wiederholt); bei weniger Bewegung steht überall das Standbild.
 */

/**
 * Ereignisse, die iOS als Geste zählt (`touchend`, `click`, `keydown`; `pointerup` für die übrigen
 * Browser). Nur darin darf ein Video starten, wenn das System das Abspielen sonst ablehnt, etwa im
 * Stromsparmodus.
 */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const;

/** Ab diesem Sprung zurück (Sekunden) beginnt ein neuer Durchlauf; kleinere Sprünge sind Rauschen. */
const JUMP = 0.5;

export interface LoopPlayback {
  /** Gehört an das `<video>`. */
  ref: RefObject<HTMLVideoElement | null>;
  /** Nach den Durchläufen angehalten: Die Ansicht zeigt das Symbol zum Wiederholen. */
  stopped: boolean;
  /** Spielt die Schleife von vorn wieder zweimal ab; innerhalb einer Geste aufrufen. */
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
 * - `endless` (Player) ohne Ende, sonst zwei Durchläufe, dann steht das letzte Bild.
 *
 * Die Durchläufe wiederholt der Browser selbst (`loop`), auch außerhalb des Players. Gezählt wird
 * der Sprung an den Anfang, den jeder Browser beim Wiederholen macht (`seeking`, `timeupdate`):
 * Nach dem ersten endet `loop`, der zweite Durchlauf läuft zu Ende, und das Video steht am letzten
 * Bild. Das braucht weder die Länge des Videos noch eine Uhr: WebKit unter Linux sprang schon bei
 * 1,91 s statt 2,5 s zurück und meldete die Länge nicht so, dass eine Rechnung damit griff; vorher
 * meldete es Enden doppelt oder gar nicht (Nachträge zu D-497).
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
    /** Zuletzt gesehene Stelle in Sekunden; ein Sprung zurück ist ein neuer Durchlauf. */
    let last = element.currentTime;
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
    /** Sprung an den Anfang beim Wiederholen: Danach läuft der letzte Durchlauf. */
    const onPosition = () => {
      const now = element.currentTime;
      if (!lastRun && now < last - JUMP) {
        lastRun = true;
        element.loop = false;
      }
      last = now;
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
      // Vor `loop`: Mit `loop` gilt ein Video nie als zu Ende. An den Anfang nur angehalten; in
      // der laufenden Wiedergabe gesucht, blieb WebKit unter Linux an Stelle 0 hängen.
      if (element.ended || element.currentTime > JUMP) {
        if (!element.paused) element.pause();
        element.currentTime = 0;
      }
      last = 0;
      element.loop = true;
      setStopped(false);
      attempt();
    };

    for (const name of GESTURES) document.addEventListener(name, attempt, true);
    document.addEventListener('visibilitychange', attempt);
    element.addEventListener('canplay', attempt);
    element.addEventListener('ended', onEnded);
    if (!endless) {
      element.addEventListener('seeking', onPosition);
      element.addEventListener('timeupdate', onPosition);
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
      for (const name of GESTURES) document.removeEventListener(name, attempt, true);
      document.removeEventListener('visibilitychange', attempt);
      element.removeEventListener('canplay', attempt);
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('seeking', onPosition);
      element.removeEventListener('timeupdate', onPosition);
      observer?.disconnect();
      restart.current = () => undefined;
    };
  }, [endless]);

  const replay = useCallback(() => {
    restart.current();
  }, []);

  return { ref, stopped, replay };
}
