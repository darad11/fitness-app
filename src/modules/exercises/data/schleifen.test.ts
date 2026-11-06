import { describe, expect, it } from 'vitest';
import bahnen from './schleifen-bahnen.v1.json';
import messung from './schleifen-messung.v1.json';

/**
 * Schleifen ohne Sprung, Ruckler und Zucken an der Naht (D-536). Die Werte misst
 * `tools/uebungen_schleifen_messen.py` an den ausgelieferten Dateien (MP4 und WebM, Bild für Bild),
 * die Bahnen von Körper und Gerät `tools/uebungen-3d/bahnen_messen.py` (Blender, Schleifen von
 * Dali’s PPLC); `check_medien.py` stellt sicher, dass beide zu den Dateien der Liste gehören.
 */
interface Messung {
  datei: string;
  bilder: number;
  /** Je Übergang (letzter zum ersten mit): 99. Perzentil der Änderung in Feldern von 15 × 15 px. */
  bewegung: number[];
  /** Pixel, die sich vom letzten zum ersten Bild um mehr als 8 Stufen ändern, und die größte Änderung. */
  nahtPixel: number;
  nahtMax: number;
}

const schleifen = Object.entries(
  messung.schleifen as Record<string, { mp4: Messung; webm: Messung }>,
).flatMap(([key, e]) => [
  { name: `${key} (MP4)`, m: e.mp4 },
  { name: `${key} (WebM)`, m: e.webm },
]);

/** Ein Übergang darf höchstens so viel stärker sein als der größere seiner Nachbarn. */
const SPRUNG = 1.6;
/** Darunter zählt eine Änderung nicht als Bewegung (Rauschen der Kompression). */
const RUHE = 3;
/** Pixel, die sich an einer Naht in der Pause um mehr als 8 Stufen ändern dürfen. */
const NAHT = 40;

describe('Schleifen Bild für Bild (D-536)', () => {
  it('misst alle Schleifen, je 60 oder 120 Bilder', () => {
    expect(schleifen.length).toBeGreaterThanOrEqual(64);
    for (const { name, m } of schleifen) {
      expect([60, 120], name).toContain(m.bilder);
      expect(m.bewegung, name).toHaveLength(m.bilder);
    }
  });

  it('kein Übergang springt: höchstens das 1,6fache der Nachbarn', () => {
    const fehler: string[] = [];
    for (const { name, m } of schleifen) {
      const b = m.bewegung;
      const n = b.length;
      // Die Naht selbst prüft der nächste Test, wenn davor Pause ist.
      const nahtInPause = (b[n - 2] ?? 0) < RUHE;
      b.forEach((wert, t) => {
        if (t === n - 1 && nahtInPause) return;
        const nachbar = Math.max(b[(t - 1 + n) % n] ?? 0, b[(t + 1) % n] ?? 0);
        if (wert >= RUHE && wert > SPRUNG * nachbar) {
          fehler.push(
            `${name}: Bild ${String(t)} → ${String((t + 1) % n)}: ${String(wert)} gegen ${String(nachbar)}`,
          );
        }
      });
    }
    expect(fehler).toEqual([]);
  });

  it('keine Naht zuckt: in der Pause ändern sich höchstens 40 Pixel um mehr als 8 Stufen', () => {
    const fehler = schleifen
      .filter(({ m }) => (m.bewegung[m.bewegung.length - 2] ?? 0) < RUHE)
      .filter(({ m }) => m.nahtPixel > NAHT)
      .map(
        ({ name, m }) => `${name}: ${String(m.nahtPixel)} Pixel, bis ${String(m.nahtMax)} Stufen`,
      );
    expect(fehler).toEqual([]);
  });
});

interface Bahn {
  name: string;
  datei: string;
  bilder: number;
  /** Je Bild die größte Änderung der Geschwindigkeit über alle Teile, px je Bild² (720 × 540). */
  aenderung: number[];
  groesste: number;
  spur: string;
  bild: number;
}

/**
 * Größte erlaubte Änderung der Geschwindigkeit eines Teils von einem Bild zum nächsten: Weiche
 * Bewegungen bleiben bis 2,9 px; am Stand vor D-536 lagen Military Press bei 67,5, Kreuzheben bei
 * 28,9 und Bankdrücken mit Kurzhanteln bei 12,4 px (Schrägbank 8,3 px).
 */
const AENDERUNG = 7.5;

describe('Bahnen der Schleifen von Dali’s PPLC (D-536)', () => {
  const liste = Object.entries(bahnen.schleifen as Record<string, Bahn>);

  it('misst alle 24 Schleifen des Programms Bild für Bild', () => {
    expect(liste).toHaveLength(24);
    for (const [key, m] of liste) {
      expect([60, 120], key).toContain(m.bilder);
      expect(m.aenderung, key).toHaveLength(m.bilder);
    }
  });

  it('kein Teil springt, stockt oder ruckt: höchstens 7,5 px Änderung je Bild', () => {
    const fehler = liste
      .filter(([, m]) => m.groesste > AENDERUNG)
      .map(
        ([key, m]) =>
          `${key} (${m.name}): ${String(m.groesste)} px bei ${m.spur}, Bild ${String(m.bild)}`,
      );
    expect(fehler).toEqual([]);
  });
});
