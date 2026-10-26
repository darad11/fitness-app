/**
 * Gerätedaten unter „Mehr › Über die App“ (D-388): Messwerte von Fenster und Bildschirm, damit
 * der Produktinhaber bei Fehlern am Gerät echte Werte nachsehen kann. Nur zur Anzeige; nichts
 * davon wird gespeichert oder übertragen.
 */

export interface DeviceSnapshot {
  /** `innerWidth` und `innerHeight` in CSS-Pixeln. */
  readonly inner: { readonly width: number; readonly height: number };
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
}

export interface DeviceTexts {
  readonly window: string;
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
  const { inner, viewport, safeArea, orientation } = snapshot;
  const size = (width: number, height: number) => `${num(width)} × ${num(height)}`;
  return [
    [texts.window, size(inner.width, inner.height)],
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
  ];
}
