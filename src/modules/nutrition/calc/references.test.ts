import { describe, expect, it } from 'vitest';
import { DAILY_REFERENCES, REFERENCE_NUTRIENTS, referenceLines, sharedMissing } from './references';

describe('Tagesreferenzen (D-359)', () => {
  it('nennt die Referenzmengen der LMIV und den Richtwert der DGE', () => {
    expect(REFERENCE_NUTRIENTS).toEqual(['salt', 'sugar', 'saturatedFat', 'fiber']);
    expect(DAILY_REFERENCES).toEqual({
      salt: { grams: 6, bound: 'atMost', source: 'lmiv' },
      sugar: { grams: 90, bound: 'atMost', source: 'lmiv' },
      saturatedFat: { grams: 20, bound: 'atMost', source: 'lmiv' },
      fiber: { grams: 30, bound: 'atLeast', source: 'dge' },
    });
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
