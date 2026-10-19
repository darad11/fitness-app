import { describe, expect, it } from 'vitest';
import { catalogSource, CatalogFileError, parseCatalogFile, rowNutrients } from './catalogImport';

const row = (patch: Record<string, unknown>) => ({
  code: 'X100000',
  source: 'ÖNWT2.0',
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
    expect(catalogSource('BLS4.0')).toBe('bls');
    expect(catalogSource('BLS3.02')).toBe('bls');
    expect(catalogSource('ÖNWT-TK')).toBe('oenwt');
    expect(catalogSource('ÖNWT2.0')).toBe('oenwt');
    expect(catalogSource('XYZ')).toBeUndefined();
  });

  it('übernimmt nur ÖNWT, ohne deutsche, auslaufende, unvollständige und unklare Einträge', () => {
    const result = parseCatalogFile({
      source: 'https://www.nutritional-software.at/bls-recherche/resultView.php',
      fetchedAt: '2026-10-19 13:41',
      rows: [
        row({ code: 'C133000', source: 'BLS4.0', name: 'Hafer Flocken' }),
        row({ code: 'B100000', source: 'BLS3.02', name: 'Brot hell' }),
        row({ code: '0003383', source: 'ÖNWT-HH', name: '  Fisolen   mit Speck ' }),
        row({ code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck' }),
        row({ code: '0003385', source: 'ÖNWT2.0', name: 'Vollkornbrot, +++läuft aus' }),
        row({ code: '0003386', source: 'ÖNWT-SPORT', name: 'BCAA Plus, +++läüft aus' }),
        row({ code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck' }),
        row({ code: '0003387', source: 'ÖNWT-HH', name: 'Ohne Fett', fat: null }),
        row({ code: '0003388', source: 'ÖNWT-HH', name: 'Zu viel', protein: 150 }),
        row({ code: '0003389', source: 'ÖNWT-HH', name: 'Ohne Ballaststoffe', fiber: null }),
        row({ code: '0003390', source: 'ÖNWT2.0', name: 'Öl', kcal: 900.8, fat: 100 }),
        row({ code: 'Z1', source: 'Unbekannt' }),
        row({ code: '0004000', source: 'ÖNWT2.0', name: 'Eck Ei-Rucula', kcal: 378 }),
        row({ code: '0004000', source: 'ÖNWT-SGB', name: 'Soletti Salzstangerl', kcal: 378 }),
        'kaputt',
      ],
    });
    expect(result.fetchedAt).toBe('2026-10-19 13:41');
    expect(result.rows.map((r) => r[2])).toEqual([
      'Fisolen mit Speck',
      'Bohnen mit Speck',
      'Ohne Ballaststoffe',
      'Öl',
    ]);
    expect(result.summary).toEqual({
      kept: { oenwt: 4 },
      skipped: { bls: 2, discontinued: 2, invalid: 5, ambiguous: 2 },
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
    expect(() => parseCatalogFile({ foods: [] })).toThrow(CatalogFileError);
    expect(() => parseCatalogFile({ rows: [] })).toThrow(CatalogFileError);
    expect(() => parseCatalogFile({ rows: [{ a: 1 }, row({ source: 'X' })] })).toThrow(
      CatalogFileError,
    );
    expect(() => parseCatalogFile([1, 2])).toThrow(CatalogFileError);
  });
});
