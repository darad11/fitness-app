import { describe, expect, it } from 'vitest';
import { dailyReferences, REFERENCE_NUTRIENTS, referenceLines, sharedMissing } from './references';

describe('Tagesreferenzen (D-359, D-369)', () => {
  it('rechnet Zucker und gesättigte Fettsäuren aus 10 % der Kalorien des Tagesziels', () => {
    expect(REFERENCE_NUTRIENTS).toEqual(['salt', 'sugar', 'saturatedFat', 'fiber']);
    // 2.390 kcal: Zucker 239 kcal / 4 = 59,75, also 60 g; gesättigte Fettsäuren 239 / 9 = 26,6,
    // also 27 g. Salz und Ballaststoffe hängen nicht am Ziel.
    expect(dailyReferences(2390)).toEqual({
      salt: { grams: 6, bound: 'atMost', source: 'lmiv' },
      sugar: {
        grams: 60,
        bound: 'atMost',
        source: 'energyShare',
        basis: { kcal: 2390, fromTarget: true },
      },
      saturatedFat: {
        grams: 27,
        bound: 'atMost',
        source: 'energyShare',
        basis: { kcal: 2390, fromTarget: true },
      },
      fiber: { grams: 30, bound: 'atLeast', source: 'dge' },
    });
    expect(dailyReferences(2200)).toMatchObject({
      sugar: { grams: 55 },
      saturatedFat: { grams: 24 },
    });
  });

  it('nimmt ohne Tagesziel 2.000 kcal: Zucker 50 g, gesättigte Fettsäuren 22 g', () => {
    for (const none of [undefined, null, 0, -1, Number.NaN]) {
      expect(dailyReferences(none)).toMatchObject({
        salt: { grams: 6 },
        sugar: { grams: 50, basis: { kcal: 2000, fromTarget: false } },
        saturatedFat: { grams: 22, basis: { kcal: 2000, fromTarget: false } },
        fiber: { grams: 30 },
      });
    }
  });

  it('gibt die Referenz des Tagesziels an jede Zeile weiter', () => {
    const lines = referenceLines([{ name: 'Milch', nutrients: { sugar: 9.6 } }], 2390);
    expect(lines.find((l) => l.nutrient === 'sugar')?.reference.grams).toBe(60);
    expect(lines.find((l) => l.nutrient === 'saturatedFat')?.reference.grams).toBe(27);
    expect(referenceLines([]).find((l) => l.nutrient === 'sugar')?.reference.grams).toBe(50);
  });

  it('summiert je Nährwert und rundet auf 0,1 g', () => {
    const lines = referenceLines([
      { name: 'Haferflocken', nutrients: { salt: 0.01, sugar: 0.4, saturatedFat: 0.6, fiber: 5 } },
      { name: 'Milch', nutrients: { salt: 0.25, sugar: 9.6, saturatedFat: 4.12, fiber: 0 } },
    ]);
    expect(lines.map((l) => [l.nutrient, l.total, l.missingCount])).toEqual([
      ['salt', 0.3, 0],
      ['sugar', 10, 0],
      ['saturatedFat', 4.7, 0],
      ['fiber', 5, 0],
    ]);
  });

  it('zählt fehlende Angaben nicht als 0, sondern nennt die Einträge', () => {
    const lines = referenceLines([
      { name: 'Apfel', nutrients: { sugar: 12, fiber: 2.4 } },
      { name: 'Müsli', nutrients: { salt: 0.2 } },
      { name: 'Müsli', nutrients: { salt: 0.2 } },
    ]);
    const salt = lines.find((l) => l.nutrient === 'salt');
    expect(salt).toMatchObject({ total: 0.4, missingNames: ['Apfel'], missingCount: 1 });
    const sugar = lines.find((l) => l.nutrient === 'sugar');
    expect(sugar).toMatchObject({ total: 12, missingNames: ['Müsli'], missingCount: 2 });
    // Kein Eintrag mit Angabe: keine Zahl statt „0 g“.
    const saturated = lines.find((l) => l.nutrient === 'saturatedFat');
    expect(saturated).toMatchObject({
      total: null,
      missingNames: ['Apfel', 'Müsli'],
      missingCount: 3,
    });
  });

  it('zeigt an einem Tag ohne Einträge 0 g und nichts Fehlendes', () => {
    for (const line of referenceLines([])) {
      expect(line).toMatchObject({ total: 0, missingNames: [], missingCount: 0 });
    }
  });
});

describe('Gemeinsamer Hinweis auf fehlende Angaben', () => {
  it('fasst zusammen, wenn bei allen Werten dieselben Einträge fehlen', () => {
    const lines = referenceLines([
      { name: 'Haferflocken', nutrients: { salt: 0, sugar: 0.7, saturatedFat: 1.3, fiber: 10 } },
      { name: 'Schnelleintrag', nutrients: { kcal: 450 } },
    ]);
    expect(sharedMissing(lines)).toEqual(['Schnelleintrag']);
  });

  it('bleibt bei Hinweisen je Wert, wenn sich die fehlenden Einträge unterscheiden', () => {
    const lines = referenceLines([
      { name: 'Apfel', nutrients: { sugar: 12, fiber: 2.4 } },
      { name: 'Schnelleintrag', nutrients: { kcal: 450 } },
    ]);
    expect(sharedMissing(lines)).toBeNull();
    expect(
      sharedMissing(
        referenceLines([
          { name: 'Müsli', nutrients: { salt: 1, sugar: 2, saturatedFat: 3, fiber: 4 } },
        ]),
      ),
    ).toBeNull();
    expect(sharedMissing(referenceLines([]))).toBeNull();
  });
});
