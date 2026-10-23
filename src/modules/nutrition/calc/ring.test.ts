import { describe, expect, it } from 'vitest';
import { SEAM_HALF_DEG, macroRing, ringGeometry, seamSteps } from './ring';

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

describe('Übergänge im Ring (F6, D-333)', () => {
  const round = (value: number) => Number(value.toFixed(3));

  it('etwa 18° je Seite einer Naht, höchstens ein Drittel des kürzeren Nachbarn', () => {
    // 600 kcal von 1.000, je ein Drittel aus jedem Makro: Abschnitte von 72°.
    const even = ringGeometry(macroRing({ kcal: 600, protein: 50, carbs: 50, fat: 22.2222 }, 1000));
    expect(even.arcs.map((a) => round(a.sweep))).toEqual([72, 72, 72]);
    expect(even.seams.map((s) => [s.from, s.to, round(s.at), s.half])).toEqual([
      ['protein', 'carbs', 72, SEAM_HALF_DEG],
      ['carbs', 'fat', 144, SEAM_HALF_DEG],
    ]);
    // Beispiel aus F5: 28,5°, 10,5° und 71,2°; der kurze Abschnitt Kohlenhydrate begrenzt beide.
    const example = ringGeometry(macroRing({ kcal: 732, protein: 46, carbs: 17, fat: 51 }, 2390));
    const carbs = example.arcs[1]?.sweep ?? 0;
    expect(round(carbs)).toBe(10.545);
    expect(example.seams.map((s) => round(s.half))).toEqual([round(carbs / 3), round(carbs / 3)]);
    // Vom kurzen Abschnitt bleibt ein Drittel in seiner eigenen Farbe.
    const [a, b] = example.seams;
    expect(round((b?.at ?? 0) - (b?.half ?? 0) - ((a?.at ?? 0) + (a?.half ?? 0)))).toBe(
      round(carbs / 3),
    );
  });

  it('der Übergang liegt symmetrisch um die Naht; die Anteile bleiben', () => {
    const geometry = ringGeometry(
      macroRing({ kcal: 1000, protein: 100, carbs: 50, fat: 40 }, 2000),
    );
    const total = geometry.arcs.reduce((sum, a) => sum + a.sweep, 0);
    expect(round(total)).toBe(180);
    for (const [i, seam] of geometry.seams.entries()) {
      const arc = geometry.arcs[i];
      expect(seam.at).toBeCloseTo((arc?.start ?? 0) + (arc?.sweep ?? 0), 9);
    }
  });

  it('über dem Ziel auch vom letzten zum ersten Abschnitt, ohne runde Enden', () => {
    const geometry = ringGeometry(
      macroRing({ kcal: 2600, protein: 150, carbs: 300, fat: 88.889 }, 2390),
    );
    expect(geometry.caps).toEqual([]);
    expect(geometry.seams.map((s) => `${s.from}-${s.to}`)).toEqual([
      'protein-carbs',
      'carbs-fat',
      'fat-protein',
    ]);
    expect(round(geometry.seams[2]?.at ?? 0)).toBe(360);
  });

  it('runde Enden am Anfang und Ende; ein Abschnitt allein ohne Naht; 0 kcal ohne alles', () => {
    expect(ringGeometry(macroRing({ kcal: 400, protein: 0, carbs: 100, fat: 0 }, 2000))).toEqual({
      arcs: [{ part: 'carbs', start: 0, sweep: 72 }],
      seams: [],
      caps: [
        { part: 'carbs', deg: 0 },
        { part: 'carbs', deg: 72 },
      ],
    });
    expect(ringGeometry(macroRing({ kcal: 0, protein: 0, carbs: 0, fat: 0 }, 2000))).toEqual({
      arcs: [],
      seams: [],
      caps: [],
    });
  });

  it('feine Schritte von höchstens 1°, lückenlos, Mischanteil steigt gleichmäßig', () => {
    const steps = seamSteps({ from: 'protein', to: 'carbs', at: 72, half: 18 });
    expect(steps).toHaveLength(36);
    expect(steps[0]?.start).toBe(54);
    expect(round(steps[35]?.end ?? 0)).toBe(90);
    for (const [k, step] of steps.entries()) {
      expect(step.end - step.start).toBeLessThanOrEqual(1 + 1e-9);
      if (k > 0) expect(step.start).toBeCloseTo(steps[k - 1]?.end ?? 0, 9);
      expect(step.t).toBeCloseTo((k + 0.5) / 36, 9);
    }
    // Sehr kurze Übergänge: ein Schritt mit der halben Mischung.
    expect(
      seamSteps({ from: 'fat', to: 'other', at: 10, half: 0.2 }).map((step) => [
        round(step.start),
        round(step.end),
        step.t,
      ]),
    ).toEqual([[9.8, 10.2, 0.5]]);
  });
});
