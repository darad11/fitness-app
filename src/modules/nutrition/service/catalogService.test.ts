import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { parseCatalogFile } from '../calc/catalogImport';
import { brandIndex, catalogDbName, catalogFoodId, toCatalogItems } from '../data/catalogStore';
import { logFood } from './nutritionService';
import {
  CatalogFileError,
  CatalogMissingError,
  commitCatalog,
  commitImport,
  deleteCatalog,
  prepareCatalog,
  prepareImport,
} from './catalogService';
import { listDayEntries } from '../data/nutritionRepository';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await Dexie.delete(catalogDbName(rt.db));
  await rt.db.delete();
});

const file = (content: unknown) =>
  new Blob([typeof content === 'string' ? content : JSON.stringify(content)], {
    type: 'application/json',
  });

const nutrients = {
  fiber: 2,
  kcal: 98.1,
  fat: 3.4,
  saturatedFat: 1.3,
  carbs: 8.9,
  sugar: 1.1,
  protein: 6.6,
  salt: 0.4,
};

const RECHERCHE = {
  source: 'https://www.nutritional-software.at/bls-recherche/resultView.php',
  fetchedAt: '2026-10-19 13:41',
  rows: [
    { code: 'C133000', source: 'BLS4.0', name: 'Hafer Flocken', ...nutrients },
    { code: 'C133000', source: 'BLS3.02', name: 'Haferflocken', ...nutrients },
    { code: 'X100000', source: 'BLS3.02', name: 'Brot hell', ...nutrients },
    { code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck', ...nutrients },
  ],
};

async function catalogRecord(): Promise<Record<string, unknown>[]> {
  const db = new Dexie(catalogDbName(rt.db));
  db.version(1).stores({ catalogs: 'id' });
  try {
    return (await db.table('catalogs').toArray()) as Record<string, unknown>[];
  } finally {
    db.close();
  }
}

describe('Lebensmitteldaten importieren (D-263)', () => {
  it('übernimmt nur ÖNWT, speichert lokal und entfernt wieder', async () => {
    const result = await prepareCatalog(file(RECHERCHE));
    expect(result.summary).toEqual({
      kept: { oenwt: 1 },
      skipped: { bls: 3, discontinued: 0, invalid: 0, ambiguous: 0 },
    });
    // Erst die Bestätigung speichert.
    expect(await catalogRecord()).toEqual([]);
    await commitCatalog(rt.db, result, new Date('2026-10-19T12:00:00.000Z'));
    const [record] = await catalogRecord();
    expect(record).toMatchObject({
      id: 'bls-recherche',
      formatVersion: 1,
      importedAt: '2026-10-19T12:00:00.000Z',
      fetchedAt: '2026-10-19 13:41',
    });
    expect((record as { rows: unknown[] }).rows).toHaveLength(1);
    // Nichts davon landet in der App-Datenbank (kein Export, kein Snapshot, keine Sync).
    expect(await rt.db.foods.count()).toBe(0);

    // Protokolleinträge behalten ihre Werte, auch wenn der Import entfernt wird.
    await logFood(rt, {
      food: {
        id: catalogFoodId('oenwt', '0003384'),
        name: 'Bohnen mit Speck',
        aliases: [],
        basis: 'g',
        per100: { kcal: 98.1, protein: 6.6, carbs: 8.9, fat: 3.4 },
        servings: [],
        source: 'import',
        catalog: 'oenwt',
        quality: 'verified',
      },
      slot: 'lunch',
      dayKey: '2026-10-19',
      quantity: { kind: 'amount', amount: 200 },
    });
    await deleteCatalog(rt.db);
    expect(await catalogRecord()).toEqual([]);
    const [entry] = await listDayEntries(rt.db, '2026-10-19');
    expect(entry?.nutrients.kcal).toBeCloseTo(196.2);
    expect(entry?.foodId).toBe(catalogFoodId('oenwt', '0003384'));
  });

  it('meldet unpassende Dateien', async () => {
    await expect(prepareCatalog(file('kein json'))).rejects.toBeInstanceOf(CatalogFileError);
    await expect(prepareCatalog(file({ foods: [] }))).rejects.toBeInstanceOf(CatalogFileError);
  });

  it('bildet stabile IDs je Quelle und Code', () => {
    expect(catalogFoodId('oenwt', '0003384')).toBe(catalogFoodId('oenwt', '0003384'));
    expect(catalogFoodId('oenwt', '0003384')).not.toBe(catalogFoodId('oenwt', '0003385'));
  });

  it('ergänzt Marken aus nuts-marken.json und behält sie bei neuem Import (D-271)', async () => {
    const MARKEN = {
      fetchedAt: '2026-10-19 18:04',
      rows: [
        {
          code: '0003384',
          source: 'ÖNWT-HH',
          name: 'Bohnen mit Speck',
          firma: 'Firma: Iglo Bohnen grün tiefgefroren',
        },
        // Gleicher Code, anderer Name: wird nicht zugeordnet.
        {
          code: '0003384',
          source: 'ÖNWT-HH',
          name: 'Speckbohnen',
          firma: 'Firma: Knorr, Unilever',
        },
        { code: '9999999', source: 'ÖNWT-HH', name: 'Unbekannt', firma: 'Firma: Spar Natur' },
      ],
    };
    // Ohne Lebensmitteldaten passt nichts.
    await expect(prepareImport(rt.db, file(MARKEN))).rejects.toBeInstanceOf(CatalogMissingError);

    const catalog = await prepareImport(rt.db, file(RECHERCHE));
    expect(catalog.kind).toBe('catalog');
    await commitImport(rt.db, catalog);
    const brands = await prepareImport(rt.db, file(MARKEN));
    expect(brands).toMatchObject({ kind: 'brands', matched: 1 });
    await commitImport(rt.db, brands);
    expect((await catalogRecord()).map((r) => r.id).sort()).toEqual(['bls-recherche', 'marken']);

    // Ein neuer Import der Lebensmitteldaten lässt die Marken stehen.
    await commitImport(rt.db, await prepareImport(rt.db, file(RECHERCHE)));
    const records = await catalogRecord();
    const brandRows = records.find((r) => r.id === 'marken')?.rows as [string, string, string][];
    const [item] = toCatalogItems(parseCatalogFile(RECHERCHE).rows, brandIndex(brandRows));
    expect(item).toMatchObject({ name: 'Bohnen mit Speck', brand: 'Iglo' });

    // Entfernen löscht beides.
    await deleteCatalog(rt.db);
    expect(await catalogRecord()).toEqual([]);
  });
});
