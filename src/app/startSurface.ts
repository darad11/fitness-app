/**
 * Startfläche der installierten App (F5, D-325): `index.html` zeigt beim Start dasselbe Bild wie
 * das Startbild von iOS (`#startflaeche`, erzeugt mit `tools/splash.mjs`). Sobald die erste Ansicht
 * steht, blendet sie in 250 ms aus. Keine künstliche Wartezeit: Ist noch nichts gezeichnet, fällt
 * sie sofort weg; bei „Bewegung reduzieren“ ebenfalls ohne Ausblenden.
 */
export const START_SURFACE_ID = 'startflaeche';
const FADE_MS = 250;

export function hideStartSurface(doc: Document = document): void {
  const surface = doc.getElementById(START_SURFACE_ID);
  if (!surface || surface.dataset.weg) return;
  surface.dataset.weg = '1';
  const view = doc.defaultView;
  const shown =
    view !== null &&
    view.getComputedStyle(surface).display !== 'none' &&
    view.performance.getEntriesByType('paint').length > 0;
  const still = view?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? true;
  if (!shown || still) {
    surface.remove();
    return;
  }
  const remove = () => {
    surface.remove();
  };
  surface.addEventListener('transitionend', remove, { once: true });
  // Falls kein transitionend kommt (z. B. Seite im Hintergrund), trotzdem entfernen.
  view.setTimeout(remove, FADE_MS + 100);
  surface.classList.add('weg');
}
