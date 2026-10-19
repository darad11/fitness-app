import { describe, expect, it } from 'vitest';
import { catalogSource, CatalogFileError, parseCatalogFile, rowNutrients } from './catalogImport';

const BLS = { codes: new Set(['C133000']), names: new Set(['apfel roh']) };

const row = (patch: Record<string, unknown>) => ({
  code: 'X100000',
  source: 'BLS3.02',
  name: 'Testlebensmittel',
  fiber: 1,
  kcal: 100,
  fat: 2,
  saturatedFat: 0.5,
  carbs: 15,
  sugar: 3,
  protein: 5,
  salt: 0.1,
  ...patch,
});

describe('Import der BLS-Recherche (D-263)', () => {
  it('erkennt die Quellen', () => {
    expect(catalogSource('BLS4.0')).toBe('bls4');
    expect(catalogSource('BLS3.02')).toBe('bls302');
    expect(catalogSource('ÖNWT-TK')).toBe('oenwt');
    expect(catalogSource('ÖNWT2.0')).toBe('oenwt');
    expect(catalogSource('XYZ')).toBeUndefined();
  });

  it('übernimmt BLS 3.02 und ÖNWT, lässt BLS 4.0, Doppeltes und Auslaufendes weg', () => {
    const result = parseCatalogFile(
      {
        source: 'https://www.nutritional-software.at/bls-recherche/resultView.php',
        fetchedAt: '2026-10-19 13:41',
        rows: [
          row({ code: 'C133000', source: 'BLS4.0', name: 'Hafer Flocken' }),
          row({ code: 'C133000', source: 'BLS3.02', name: 'Haferflocken alt' }),
          row({ code: 'F999999', source: 'BLS3.02', name: 'Apfel roh' }),
          row({ code: 'B100000', source: 'BLS3.02', name: '  Brot   hell ' }),
          row({ code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck' }),
          row({ code: '0003385', source: 'ÖNWT2.0', name: 'Vollkornbrot, +++läuft aus' }),
          row({ code: '0003386', source: 'ÖNWT-SPORT', name: 'BCAA Plus, +++läüft aus' }),
          row({ code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck' }),
          row({ code: '0003387', source: 'ÖNWT-HH', name: 'Ohne Fett', fat: null }),
          row({ code: '0003388', source: 'ÖNWT-HH', name: 'Zu viel', protein: 150 }),
          row({ code: '0003389', source: 'ÖNWT-HH', name: 'Ohne Ballaststoffe', fiber: null }),
          row({ code: 'Q100000', source: 'BLS3.02', name: 'Öl', kcal: 900.8, fat: 100 }),
          row({ code: 'Z1', source: 'Unbekannt' }),
          row({ code: '0004000', source: 'ÖNWT2.0', name: 'Eck Ei-Rucula', kcal: 378 }),
          row({ code: '0004000', source: 'ÖNWT-SGB', name: 'Soletti Salzstangerl', kcal: 378 }),
          'kaputt',
        ],
      },
      BLS,
    );
    expect(result.fetchedAt).toBe('2026-10-19 13:41');
    expect(result.rows.map((r) => r[2])).toEqual([
      'Brot hell',
      'Bohnen mit Speck',
      'Ohne Ballaststoffe',
      'Öl',
    ]);
    expect(result.summary).toEqual({
      kept: { bls302: 2, oenwt: 2 },
      skipped: { inBls: 3, discontinued: 2, invalid: 5, ambiguous: 2 },
    });
    // Reine Fette leicht über 900 kcal werden auf die Grenze gekappt; fehlende Werte fehlen.
    expect(rowNutrients(result.rows[3]!).kcal).toBe(900);
    expect(rowNutrients(result.rows[2]!)).not.toHaveProperty('fiber');
    expect(rowNutrients(result.rows[0]!)).toEqual({
      kcal: 100,
      protein: 5,
      carbs: 15,
      sugar: 3,
      fat: 2,
      saturatedFat: 0.5,
      fiber: 1,
      salt: 0.1,
    });
  });

  it('lehnt fremde Dateien ab', () => {
    expect(() => parseCatalogFile({ foods: [] }, BLS)).toThrow(CatalogFileError);
    expect(() => parseCatalogFile({ rows: [] }, BLS)).toThrow(CatalogFileError);
    expect(() => parseCatalogFile({ rows: [{ a: 1 }, row({ source: 'X' })] }, BLS)).toThrow(
      CatalogFileError,
    );
    expect(() => parseCatalogFile([1, 2], BLS)).toThrow(CatalogFileError);
  });
});
