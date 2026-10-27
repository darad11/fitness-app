/**
 * Gerätedaten unter „Mehr › Über die App“ (D-388): Messwerte von Fenster und Bildschirm, damit
 * der Produktinhaber bei Fehlern am Gerät echte Werte nachsehen kann. Nur zur Anzeige; nichts
 * davon wird gespeichert oder übertragen.
 */

/**
 * Lage der Startfläche, wie `public/startflaeche.js` sie rechnet (D-393): woher die Größe des
 * Bildschirms kommt, Bildschirm `b` × `h`, Lage des Fensters darin `x`, `y` und die Verschiebung
 * der Mitte der Fläche gegenüber der Mitte des Fensters `dx`, `dy` (positiv nach rechts und unten).
 */
export interface StartPlacement {
  readonly quelle: 'bildschirm' | 'duo' | 'fenster';
  readonly b: number;
  readonly h: number;
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
}

export interface DeviceSnapshot {
  /** `innerWidth` und `innerHeight` in CSS-Pixeln. */
  readonly inner: { readonly width: number; readonly height: number };
  /** `screen.width`, `screen.height`, `screen.availWidth`, `screen.availHeight`; `null` ohne `screen`. */
  readonly screen: {
    readonly width: number;
    readonly height: number;
    readonly availWidth: number;
    readonly availHeight: number;
  } | null;
  /** `outerWidth` und `outerHeight`. */
  readonly outer: { readonly width: number; readonly height: number };
  /** `screenX` und `screenY`: Lage des Fensters auf dem Bildschirm. */
  readonly position: { readonly x: number; readonly y: number };
  /** `visualViewport`; `null`, wo es ihn nicht gibt. */
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly offsetTop: number;
    readonly pageTop: number;
  } | null;
  /** Sichere Bereiche aus `env(safe-area-inset-*)` in CSS-Pixeln. */
  readonly safeArea: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
  /** `screen.orientation`; `null`, wo es sie nicht gibt. */
  readonly orientation: { readonly type: string; readonly angle: number } | null;
  readonly pixelRatio: number;
  /** Als App vom Home-Bildschirm gestartet, sonst im Browser. */
  readonly standalone: boolean;
  /** Lage der Startfläche; `null`, wenn `public/startflaeche.js` nicht geladen ist. */
  readonly start: StartPlacement | null;
}

export interface DeviceTexts {
  readonly window: string;
  readonly screen: string;
  readonly available: string;
  readonly outer: string;
  readonly position: string;
  readonly startScreen: string;
  readonly startShift: string;
  readonly startSource: Readonly<Record<StartPlacement['quelle'], string>>;
  readonly viewport: string;
  readonly viewportOffset: string;
  readonly safeArea: string;
  readonly orientation: string;
  readonly pixelRatio: string;
  readonly displayMode: string;
  readonly standalone: string;
  readonly browser: string;
  readonly unavailable: string;
}

/** Zeilen „Bezeichnung, Wert“ in der Reihenfolge der Anzeige; `num` formatiert Zahlen. */
export function deviceRows(
  snapshot: DeviceSnapshot,
  texts: DeviceTexts,
  num: (value: number) => string,
): readonly (readonly [string, string])[] {
  const { inner, viewport, safeArea, orientation, screen, outer, position, start } = snapshot;
  const size = (width: number, height: number) => `${num(width)} × ${num(height)}`;
  return [
    [texts.window, size(inner.width, inner.height)],
    [texts.screen, screen ? size(screen.width, screen.height) : texts.unavailable],
    [texts.available, screen ? size(screen.availWidth, screen.availHeight) : texts.unavailable],
    [texts.outer, size(outer.width, outer.height)],
    [texts.position, `${num(position.x)} / ${num(position.y)}`],
    [texts.viewport, viewport ? size(viewport.width, viewport.height) : texts.unavailable],
    [
      texts.viewportOffset,
      viewport ? `${num(viewport.offsetTop)} / ${num(viewport.pageTop)}` : texts.unavailable,
    ],
    [
      texts.safeArea,
      [safeArea.top, safeArea.right, safeArea.bottom, safeArea.left].map(num).join(', '),
    ],
    [
      texts.orientation,
      orientation ? `${orientation.type}, ${num(orientation.angle)}°` : texts.unavailable,
    ],
    [texts.pixelRatio, num(snapshot.pixelRatio)],
    [texts.displayMode, snapshot.standalone ? texts.standalone : texts.browser],
    [
      texts.startScreen,
      start ? `${size(start.b, start.h)}, ${texts.startSource[start.quelle]}` : texts.unavailable,
    ],
    [texts.startShift, start ? `${num(start.dx)}, ${num(start.dy)}` : texts.unavailable],
  ];
}
