/**
 * Startfläche der installierten App (F5, D-325; Dauer F6, D-337): `index.html` zeigt beim Start
 * dasselbe Bild wie das Startbild von iOS (`#startflaeche`, erzeugt mit `tools/splash.mjs`) und
 * setzt es so ohne Sprung fort. Beim Kaltstart bleibt die Fläche ab dem ersten Bild mindestens
 * 1,0 s sichtbar, die Ladezeit eingerechnet, und blendet dann in 300 ms aus; dauert das Laden
 * länger, bleibt sie, bis die erste Ansicht steht (dann ruft der Rahmen der App, die Fehleransicht
 * oder die Wiederherstellung `hideStartSurface`). Bei „Bewegung reduzieren“ verschwindet sie ohne
 * Ausblenden, die Mindestzeit bleibt. Die Fläche gibt es nur beim Laden der Seite: Nach der
 * Rückkehr aus dem Hintergrund und beim Wechsel der Ansicht erscheint sie nicht.
 */
export const START_SURFACE_ID = 'startflaeche';
/** Mindestens so lange sichtbar, ab dem ersten Bild. */
export const START_MIN_MS = 1000;
/** Ausblenden (CSS in `index.html`, aus `tools/splash.mjs`). */
export const START_FADE_MS = 300;

/**
 * Zeit des ersten Bildes seit Beginn der Navigation; `null`, solange noch nichts gezeichnet ist.
 * Chromium meldet die Fläche als ersten Paint-Eintrag. Safari meldet für die Fläche ohne Text
 * keinen, sondern erst den Text der App; deshalb zählt auch das erste Bild, das
 * `public/theme-init.js` vor dem Start der App vermerkt (`__startFrame`, D-337). Es gilt der
 * frühere Zeitpunkt.
 */
function firstFrame(view: Window): number | null {
  const times = view.performance.getEntriesByType('paint').map((entry) => entry.startTime);
  const noted = (view as Window & { __startFrame?: unknown }).__startFrame;
  if (typeof noted === 'number' && Number.isFinite(noted)) times.push(noted);
  return times.length > 0 ? Math.min(...times) : null;
}

export function hideStartSurface(doc: Document = document): void {
  const surface = doc.getElementById(START_SURFACE_ID);
  const view = doc.defaultView;
  if (!surface || surface.dataset.weg || !view) return;
  surface.dataset.weg = '1';
  // Im Browser-Tab ist die Fläche unsichtbar (nur `display-mode: standalone`): sofort weg.
  if (view.getComputedStyle(surface).display === 'none') {
    surface.remove();
    return;
  }
  const still = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fade = () => {
    if (still) {
      surface.remove();
      return;
    }
    const remove = () => {
      surface.remove();
    };
    surface.addEventListener('transitionend', remove, { once: true });
    // Falls kein transitionend kommt (z. B. Seite im Hintergrund), trotzdem entfernen.
    view.setTimeout(remove, START_FADE_MS + 100);
    surface.classList.add('weg');
  };
  const hold = (shown: number) => {
    view.setTimeout(fade, Math.max(0, shown + START_MIN_MS - view.performance.now()));
  };
  const shown = firstFrame(view);
  if (shown !== null) {
    hold(shown);
    return;
  }
  // Noch nichts gezeichnet: das erste Bild abwarten und ab dort zählen.
  view.requestAnimationFrame(() => {
    view.setTimeout(() => {
      hold(firstFrame(view) ?? view.performance.now());
    }, 0);
  });
}
