/**
 * Gerätedaten unter „Mehr › Über die App“ (D-388): Messwerte von Fenster und Bildschirm, damit
 * der Produktinhaber bei Fehlern am Gerät echte Werte nachsehen kann, dazu die Rechnung und das
 * Protokoll der Startfläche (D-393, D-394). Nur zur Anzeige; nichts davon wird gespeichert oder
 * übertragen.
 */

/**
 * Lage der Startfläche, wie `public/startflaeche.js` sie rechnet (D-393, D-394): woher die Größe
 * des Bildschirms kommt (oder dass sich die Werte widersprechen), Bildschirm `b` × `h`, die
 * Streifen um das Fenster, die Verschiebung der Mitte der Fläche gegenüber der Mitte des Fensters
 * `dx`, `dy` (positiv nach rechts und unten) und ob die Werte zum Zeigen des Logos reichen.
 */
export interface StartPlacement {
  readonly quelle: 'bildschirm' | 'duo' | 'fenster' | 'widerspruch';
  readonly b: number;
  readonly h: number;
  readonly links: number;
  readonly rechts: number;
  readonly oben: number;
  readonly unten: number;
  readonly dx: number;
  readonly dy: number;
  readonly sicher: boolean;
  readonly widerspruch: string | null;
}

/** Eine Messung beim Start aus `public/startflaeche.js` (D-394); `t` in ms seit dem Laden. */
export interface StartMeasurement {
  readonly t: number;
  /** Fenster, wie die Startfläche es zeichnet (`clientWidth` × `clientHeight`). */
  readonly fenster: { readonly b: number; readonly h: number };
  /** `innerWidth` × `innerHeight`. */
  readonly innen: { readonly b: number; readonly h: number };
  readonly bildschirm: { readonly b: number; readonly h: number } | null;
  readonly ausrichtung: 'hoch' | 'quer' | null;
  /** `screen.orientation.type`; `null`, wo es ihn nicht gibt. */
  readonly typ: string | null;
  /** Winkel aus `screen.orientation`, sonst `window.orientation`. */
  readonly winkel: number | null;
}

/**
 * Protokoll des Starts (D-394): die erste Messung, jede Änderung danach und wann das Logo der
 * Startfläche erschien (`stabil`: zwei gleiche Bilder; `zeit`: nach der Wartezeit von 300 ms).
 */
export interface StartLog {
  readonly erste: StartMeasurement | null;
  readonly aenderungen: readonly StartMeasurement[];
  readonly sichtbar: { readonly t: number; readonly grund: 'stabil' | 'zeit' } | null;
}

export interface DeviceSnapshot {
  /** `innerWidth` und `innerHeight` in CSS-Pixeln. */
  readonly inner: { readonly width: number; readonly height: number };
  /** `clientWidth` und `clientHeight` des Wurzelelements: das Fenster, wie das Layout es nutzt. */
  readonly layout: { readonly width: number; readonly height: number };
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
  /** Protokoll des Starts; `null`, wenn `public/startflaeche.js` nicht geladen ist. */
  readonly startLog: StartLog | null;
}

export interface DeviceTexts {
  readonly window: string;
  readonly layout: string;
  readonly screen: string;
  readonly available: string;
  readonly outer: string;
  readonly position: string;
  readonly startScreen: string;
  readonly startShift: string;
  readonly startSource: Readonly<Record<StartPlacement['quelle'], string>>;
  readonly startFirst: string;
  readonly startChanges: string;
  readonly startShown: string;
  readonly startNoChanges: string;
  readonly startNotShown: string;
  readonly startReason: Readonly<Record<'stabil' | 'zeit', string>>;
  readonly startLayout: (size: string) => string;
  readonly startScreenOf: (size: string) => string;
  readonly startAfter: (ms: string) => string;
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
  const { inner, layout, viewport, safeArea, orientation, screen, outer, position, start } =
    snapshot;
  const log = snapshot.startLog;
  const size = (width: number, height: number) => `${num(width)} × ${num(height)}`;
  /** Eine Messung beim Start: Fenster, Layout (wenn anders), Bildschirm und Ausrichtung. */
  const measurement = (m: StartMeasurement) => {
    const window = size(m.innen.b, m.innen.h);
    const sameLayout = m.fenster.b === m.innen.b && m.fenster.h === m.innen.h;
    const parts = [
      sameLayout ? window : `${window} (${texts.startLayout(size(m.fenster.b, m.fenster.h))})`,
    ];
    if (m.bildschirm) parts.push(texts.startScreenOf(size(m.bildschirm.b, m.bildschirm.h)));
    if (m.typ) parts.push(`${m.typ}, ${num(m.winkel ?? 0)}°`);
    else if (m.winkel !== null) parts.push(`${num(m.winkel)}°`);
    return parts.join(', ');
  };
  const first = () =>
    log?.erste ? `${measurement(log.erste)}, ${texts.startAfter(num(log.erste.t))}` : null;
  const changes = () => {
    if (!log) return texts.unavailable;
    if (log.aenderungen.length === 0) return texts.startNoChanges;
    return log.aenderungen
      .map((m) => `${texts.startAfter(num(m.t))}: ${measurement(m)}`)
      .join('; ');
  };
  const shown = () => {
    if (!log) return texts.unavailable;
    if (!log.sichtbar) return texts.startNotShown;
    return `${texts.startAfter(num(log.sichtbar.t))}, ${texts.startReason[log.sichtbar.grund]}`;
  };
  return [
    [texts.window, size(inner.width, inner.height)],
    [texts.layout, size(layout.width, layout.height)],
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
    [texts.startFirst, first() ?? texts.unavailable],
    [texts.startChanges, changes()],
    [texts.startShown, shown()],
  ];
}
