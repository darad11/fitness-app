import { describe, expect, it } from 'vitest';
import { macroRing } from './ring';

const parts = (model: ReturnType<typeof macroRing>) =>
  model.segments.map((s) => [s.part, Number(s.share.toFixed(4))]);

describe('Ring mit Makros (F5, D-326)', () => {
  it('teilt den Bogen nach dem Kalorienanteil der Makros (4, 4, 9 kcal je g)', () => {
    // Beispiel aus dem Auftrag: 46 g Eiweiß, 17 g Kohlenhydrate, 51 g Fett, 732 kcal.
    const model = macroRing({ kcal: 732, protein: 46, carbs: 17, fat: 51 }, 2390);
    expect(model.kcal).toEqual({ protein: 184, carbs: 68, fat: 459, other: 0 });
    expect(model.fill).toBeCloseTo(732 / 2390, 6);
    // 21 kcal ohne Makro sind unter 5 %: anteilig auf die Makros verteilt.
    expect(parts(model)).toEqual([
      ['protein', Number((184 / 711).toFixed(4))],
      ['carbs', Number((68 / 711).toFixed(4))],
      ['fat', Number((459 / 711).toFixed(4))],
    ]);
    expect(model.segments.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1, 10);
    expect(model.remaining).toBe(1658);
    expect(model.over).toBe(0);
  });

  it('zeigt kcal ohne Makro ab 5 % als letzten Abschnitt', () => {
    // 1000 kcal, davon 600 aus Makros: 400 kcal (40 %) ohne Zuordnung.
    const model = macroRing({ kcal: 1000, protein: 50, carbs: 50, fat: 22.22222 }, 2000);
    expect(model.segments.map((s) => s.part)).toEqual(['protein', 'carbs', 'fat', 'other']);
    expect(model.kcal.other).toBeCloseTo(400, 3);
    expect(model.segments[3]?.share).toBeCloseTo(0.4, 4);
    expect(model.segments.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1, 10);
  });

  it('Grenze genau bei 5 %: ab 5 % eigener Abschnitt, darunter verteilt', () => {
    expect(
      macroRing({ kcal: 1000, protein: 0, carbs: 237.5, fat: 0 }, 2000).segments.map((s) => s.part),
    ).toEqual(['carbs', 'other']);
    expect(
      macroRing({ kcal: 1000, protein: 0, carbs: 237.6, fat: 0 }, 2000).segments.map((s) => s.part),
    ).toEqual(['carbs']);
  });

  it('nur Schnelleinträge mit kcal: ein grauer Abschnitt', () => {
    const model = macroRing({ kcal: 350, protein: 0, carbs: 0, fat: 0 }, 2000);
    expect(parts(model)).toEqual([['other', 1]]);
    expect(model.kcal.other).toBe(350);
  });

  it('mehr kcal aus Makros als eingetragen: anteilig gekürzt, Bogen bleibt bei den gegessenen kcal', () => {
    const model = macroRing({ kcal: 500, protein: 40, carbs: 40, fat: 20 }, 2000);
    expect(parts(model)).toEqual([
      ['protein', Number((160 / 500).toFixed(4))],
      ['carbs', Number((160 / 500).toFixed(4))],
      ['fat', Number((180 / 500).toFixed(4))],
    ]);
    expect(model.fill).toBe(0.25);
    expect(model.kcal.other).toBe(0);
  });

  it('über dem Ziel: Ring voll, Anteile bleiben, Abstand zum Ziel', () => {
    const model = macroRing({ kcal: 2600, protein: 150, carbs: 300, fat: 88.889 }, 2390);
    expect(model.fill).toBe(1);
    expect(model.over).toBe(210);
    expect(model.remaining).toBe(0);
    expect(model.segments.map((s) => s.part)).toEqual(['protein', 'carbs', 'fat']);
  });

  it('0 kcal: keine Abschnitte, nur die Spur; ohne Ziel kein gefüllter Bogen', () => {
    expect(macroRing({ kcal: 0, protein: 0, carbs: 0, fat: 0 }, 2000)).toMatchObject({
      fill: 0,
      segments: [],
      remaining: 2000,
    });
    // Unstimmige Daten (Makros ohne kcal) zeichnen keinen Bogen.
    expect(macroRing({ kcal: 0, protein: 10, carbs: 0, fat: 0 }, 2000).segments).toEqual([]);
    expect(macroRing({ kcal: 500, protein: 10, carbs: 0, fat: 0 }, 0).fill).toBe(0);
  });

  it('leere Makros fallen weg', () => {
    const model = macroRing({ kcal: 400, protein: 0, carbs: 100, fat: 0 }, 2000);
    expect(parts(model)).toEqual([['carbs', 1]]);
  });
});
