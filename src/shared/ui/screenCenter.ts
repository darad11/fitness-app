import { useLayoutEffect } from 'react';

/**
 * Mitte des ganzen Bildschirms für Vollbildansichten (D-495). Am iPhone Duo liegen Systemstreifen
 * neben dem Fenster der App (rechts 84 pt, aufgeklappt quer zeitweise auch oben 82 pt, D-393):
 * Was mittig im Fenster steht, steht dann um die halbe Breite des Streifens neben der Mitte des
 * Bildschirms. Die Startfläche rechnet das seit D-393 und D-394 aus (`public/startflaeche.js`,
 * `window.__formStartLage`). Dieselbe Rechnung setzt hier, solange die App läuft, die Verschiebung
 * der Bildschirmmitte gegenüber der Fenstermitte als CSS-Variablen `--bildschirm-dx` und
 * `--bildschirm-dy` (px, positiv nach rechts und unten). Die Utilities `screen-center-x`,
 * `screen-center-y` und `dialog-mitte` (src/app/styles.css) rücken damit den Inhalt in die Mitte
 * des Bildschirms; Bedienelemente bleiben im Fenster, nie im Streifen.
 *
 * Widersprechen sich die Werte (Ausrichtung passt nicht zur Form des Fensters, D-394), bleiben die
 * letzten stimmigen. Ohne das Skript der Startfläche oder ohne Streifen (iPhone, iPad, Computer)
 * ist die Verschiebung 0, und alles steht wie bisher mittig im Fenster.
 */

interface Placement {
  dx: number;
  dy: number;
  widerspruch: string | null;
}

type StartLage = (messung: {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
  ausrichtung: 'hoch' | 'quer' | null;
}) => Placement;

export interface ScreenOffset {
  dx: number;
  dy: number;
}

/** `screen.orientation` fehlt in älteren Browsern und in Tests ohne Bildschirm. */
function screenOrientation(win: Window): ScreenOrientation | undefined {
  const display = win.screen as Screen | undefined;
  return display?.orientation;
}

/** Ausrichtung wie beim Start: `screen.orientation`, sonst das alte `window.orientation`. */
function alignment(win: Window): 'hoch' | 'quer' | null {
  const type = screenOrientation(win)?.type as string | undefined;
  if (type) return type.startsWith('landscape') ? 'quer' : 'hoch';
  const legacy = (win as unknown as { orientation?: unknown }).orientation;
  if (typeof legacy === 'number') return Math.abs(legacy) === 90 ? 'quer' : 'hoch';
  return null;
}

/**
 * Verschiebung der Bildschirmmitte gegenüber der Fenstermitte jetzt. `null`, wenn die Werte sich
 * widersprechen; ohne Rechnung der Startfläche keine Verschiebung.
 */
export function measureScreenOffset(win: Window = window): ScreenOffset | null {
  const startLage = (win as Window & { __formStartLage?: StartLage }).__formStartLage;
  if (typeof startLage !== 'function') return { dx: 0, dy: 0 };
  const root = win.document.documentElement;
  const display = win.screen as Screen | undefined;
  const lage = startLage({
    fenster: { b: root.clientWidth || win.innerWidth, h: root.clientHeight || win.innerHeight },
    bildschirm: display ? { b: display.width, h: display.height } : null,
    ausrichtung: alignment(win),
  });
  if (lage.widerspruch) return null;
  return { dx: lage.dx, dy: lage.dy };
}

/** Setzt die Verschiebung als CSS-Variablen, wenn die Werte stimmig sind. */
export function applyScreenOffset(win: Window = window): void {
  const offset = measureScreenOffset(win);
  if (!offset) return;
  const style = win.document.documentElement.style;
  style.setProperty('--bildschirm-dx', `${String(offset.dx)}px`);
  style.setProperty('--bildschirm-dy', `${String(offset.dy)}px`);
}

/**
 * Misst beim Start und bei jeder Größenänderung, Drehung, Änderung des visualViewport und Rückkehr
 * in den Vordergrund, jeweils sofort und im nächsten Bild (iOS meldet neue Maße manchmal erst ein
 * Bild später, D-394). Gibt die Abmeldung zurück.
 */
export function installScreenCenter(win: Window = window): () => void {
  let frame = 0;
  const update = () => {
    applyScreenOffset(win);
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => {
      applyScreenOffset(win);
    });
  };
  const onVisible = () => {
    if (win.document.visibilityState === 'visible') update();
  };
  update();
  const orientation = screenOrientation(win);
  win.addEventListener('resize', update);
  win.addEventListener('orientationchange', update);
  orientation?.addEventListener('change', update);
  win.visualViewport?.addEventListener('resize', update);
  win.document.addEventListener('visibilitychange', onVisible);
  return () => {
    win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', update);
    win.removeEventListener('orientationchange', update);
    orientation?.removeEventListener('change', update);
    win.visualViewport?.removeEventListener('resize', update);
    win.document.removeEventListener('visibilitychange', onVisible);
  };
}

/**
 * Für Vollbildansichten: misst beim Öffnen frisch, bevor sie gezeichnet wird. So stimmt die Mitte
 * auch, wenn iOS eine Änderung des Fensters ohne Ereignis gemeldet hat (D-394).
 */
export function useScreenCenter(active = true): void {
  useLayoutEffect(() => {
    if (active) applyScreenOffset();
  }, [active]);
}
