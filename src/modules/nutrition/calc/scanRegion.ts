/**
 * Erkennungsbereich des Barcode-Scanners (D-374): Das Kamerabild steht mit `object-fit: cover`
 * in seinem Kasten, ein Teil des Bilds ist also abgeschnitten. Erkannt wird nur, was im Kasten
 * zu sehen ist, und dort nur das Band um den Rahmen. So passen Bild, Rahmen und Erkennung
 * zusammen, in jeder Größe und Drehung.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Oberhalb und unterhalb des Rahmens zählt noch je die halbe Rahmenhöhe mit. */
export const FRAME_MARGIN = 0.5;

/**
 * Teil des Kamerabilds (in Pixeln des Videos), der in einem Kasten mit `object-fit: cover`
 * zu sehen ist; `null`, solange Bild oder Kasten keine Größe haben.
 */
export function coverSource(video: Size, box: Size): Rect | null {
  if (!(video.width > 0 && video.height > 0 && box.width > 0 && box.height > 0)) return null;
  const scale = Math.max(box.width / video.width, box.height / video.height);
  const width = box.width / scale;
  const height = box.height / scale;
  return { x: (video.width - width) / 2, y: (video.height - height) / 2, width, height };
}

/**
 * Erkennungsbereich im Kamerabild: das Band des Rahmens (Koordinaten im Kasten), oben und unten
 * um `margin` × Rahmenhöhe erweitert, links und rechts das ganze sichtbare Bild; nie über das
 * sichtbare Bild hinaus.
 */
export function scanRegion(
  video: Size,
  box: Size,
  frame: Rect,
  margin: number = FRAME_MARGIN,
): Rect | null {
  const visible = coverSource(video, box);
  if (!visible) return null;
  const perBoxPixel = visible.width / box.width;
  const extra = frame.height * margin;
  const top = Math.max(0, frame.y - extra);
  const bottom = Math.min(box.height, frame.y + frame.height + extra);
  if (bottom - top < 1) return null;
  return {
    x: visible.x,
    y: visible.y + top * perBoxPixel,
    width: visible.width,
    height: (bottom - top) * perBoxPixel,
  };
}

/** Ab dieser Änderung der Fensterbreite (Anteil) gilt ein Wechsel des Displays (iPhone Duo). */
export const DISPLAY_CHANGE = 0.2;

/**
 * Neue Haltung für die Kamera (D-385): Das Fenster wechselt zwischen hoch und quer (Drehen,
 * Auf- und Zuklappen) oder seine Breite ändert sich um mehr als ein Fünftel (Wechsel zwischen
 * äußerem und innerem Display bei gleicher Haltung). Dann startet der Scanner die Kamera neu, damit
 * iOS das Bild für die neue Haltung liefert; die App dreht das Bild nie selbst. Kleine Änderungen
 * (Tastatur, Systemleisten) zählen nicht.
 */
export function cameraPostureChanged(before: Size, after: Size): boolean {
  if (!(before.width > 0 && before.height > 0 && after.width > 0 && after.height > 0)) return false;
  const landscape = (size: Size) => size.width > size.height;
  if (landscape(before) !== landscape(after)) return true;
  return Math.abs(after.width - before.width) > before.width * DISPLAY_CHANGE;
}
