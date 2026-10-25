import { describe, expect, it } from 'vitest';
import { coverSource, scanRegion } from './scanRegion';

describe('coverSource (object-fit: cover)', () => {
  it('zeigt das ganze Bild, wenn Kasten und Bild dasselbe Seitenverhältnis haben', () => {
    expect(coverSource({ width: 640, height: 480 }, { width: 320, height: 240 })).toEqual({
      x: 0,
      y: 0,
      width: 640,
      height: 480,
    });
  });

  it('schneidet ein hohes Bild im breiten Kasten oben und unten ab', () => {
    // iPhone hoch: 480 × 640, Kasten 4 : 3. Sichtbar ist die Mitte, 360 von 640 Zeilen.
    expect(coverSource({ width: 480, height: 640 }, { width: 400, height: 300 })).toEqual({
      x: 0,
      y: 140,
      width: 480,
      height: 360,
    });
  });

  it('schneidet ein breites Bild im hohen Kasten links und rechts ab', () => {
    expect(coverSource({ width: 1920, height: 1080 }, { width: 300, height: 400 })).toEqual({
      x: 555,
      y: 0,
      width: 810,
      height: 1080,
    });
  });

  it('ohne Größe kein Ausschnitt', () => {
    expect(coverSource({ width: 0, height: 0 }, { width: 300, height: 200 })).toBeNull();
    expect(coverSource({ width: 640, height: 480 }, { width: 0, height: 200 })).toBeNull();
  });
});

describe('scanRegion', () => {
  it('nimmt das Band um den Rahmen, links und rechts das ganze sichtbare Bild', () => {
    // Kasten 320 × 240 zeigt 640 × 480 ganz (2 Videopixel je Kastenpixel); Rahmen mittig 96 hoch.
    expect(
      scanRegion(
        { width: 640, height: 480 },
        { width: 320, height: 240 },
        { x: 32, y: 72, width: 256, height: 96 },
      ),
    ).toEqual({ x: 0, y: 48, width: 640, height: 384 });
  });

  it('überträgt den Rahmen in den sichtbaren Teil eines beschnittenen Bilds', () => {
    // Hohes Bild im breiten Kasten: sichtbar sind die Zeilen 140 bis 500 (1,2 Videopixel je
    // Kastenpixel); Rahmen von 102 bis 198 im Kasten, mit halber Rahmenhöhe darüber und darunter.
    const region = scanRegion(
      { width: 480, height: 640 },
      { width: 400, height: 300 },
      { x: 32, y: 102, width: 336, height: 96 },
    );
    expect(region?.x).toBe(0);
    expect(region?.width).toBe(480);
    expect(region?.y).toBeCloseTo(140 + 54 * 1.2);
    expect(region?.height).toBeCloseTo(192 * 1.2);
  });

  it('bleibt im sichtbaren Bild, auch wenn der Rahmen fast den ganzen Kasten füllt', () => {
    const region = scanRegion(
      { width: 640, height: 480 },
      { width: 320, height: 120 },
      { x: 16, y: 12, width: 288, height: 96 },
    );
    // Sichtbar sind 240 Zeilen ab Zeile 120; das Band endet an den Rändern des Kastens.
    expect(region).toEqual({ x: 0, y: 120, width: 640, height: 240 });
  });

  it('ohne Bild kein Bereich', () => {
    expect(
      scanRegion(
        { width: 0, height: 0 },
        { width: 320, height: 240 },
        { x: 0, y: 0, width: 10, height: 10 },
      ),
    ).toBeNull();
  });
});
