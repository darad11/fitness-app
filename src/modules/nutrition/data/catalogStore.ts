import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, type AppDb } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { austrianAliases } from '../calc/austrianTerms';
import {
  rowNutrients,
  type CatalogImportResult,
  type CatalogRow,
  type CatalogSummary,
} from '../calc/catalogImport';
import type { FoodItem } from '../model/foodItem';
import { CATALOG_SOURCES, NUTRIENTS, type CatalogSource } from '../model/nutrition';

/**
 * Importierte Lebensmitteldaten (D-263) liegen in einer eigenen Datenbank neben der App-Datenbank:
 * Es sind Nachschlagedaten, keine eigenen Einträge. Sie werden nicht synchronisiert, nicht
 * exportiert und nicht in Snapshots kopiert; die Datei lässt sich jederzeit erneut importieren.
 */
export const CATALOG_ID = 'bls-recherche';
const FORMAT_VERSION = 1;

export interface CatalogRecord {
  id: string;
  formatVersion: number;
  importedAt: string;
  fetchedAt?: string;
  summary: CatalogSummary;
  rows: CatalogRow[];
}

export type CatalogInfo = Omit<CatalogRecord, 'rows'> & { count: number };

class CatalogDb extends Dexie {
  declare catalogs: Table<CatalogRecord, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ catalogs: 'id' });
  }
}

const instances = new Map<string, CatalogDb>();

/** Name der Katalog-Datenbank zur App-Datenbank (in Tests je Laufzeit eine eigene). */
export function catalogDbName(db: AppDb): string {
  return `${db.name}-lebensmittel`;
}

function catalogDb(db: AppDb): CatalogDb {
  const name = catalogDbName(db);
  let instance = instances.get(name);
  if (!instance) {
    instance = new CatalogDb(name);
    instances.set(name, instance);
  }
  return instance;
}

/** Ersetzt den bisherigen Import vollständig (gleiche IDs, also bleiben Verweise gültig). */
export async function saveCatalog(
  db: AppDb,
  result: CatalogImportResult,
  now: Date = new Date(),
): Promise<void> {
  await catalogDb(db).catalogs.put({
    id: CATALOG_ID,
    formatVersion: FORMAT_VERSION,
    importedAt: now.toISOString(),
    ...(result.fetchedAt ? { fetchedAt: result.fetchedAt } : {}),
    summary: result.summary,
    rows: result.rows,
  });
}

export async function removeCatalog(db: AppDb): Promise<void> {
  await catalogDb(db).catalogs.delete(CATALOG_ID);
}

function isRow(row: unknown): row is CatalogRow {
  return (
    Array.isArray(row) &&
    row.length === 3 + NUTRIENTS.length &&
    typeof row[0] === 'string' &&
    (CATALOG_SOURCES as readonly unknown[]).includes(row[1]) &&
    typeof row[2] === 'string' &&
    row.slice(3).every((v) => v === null || typeof v === 'number')
  );
}

async function readCatalog(db: AppDb): Promise<CatalogRecord | null> {
  const record = await catalogDb(db).catalogs.get(CATALOG_ID);
  if (record?.formatVersion !== FORMAT_VERSION || !Array.isArray(record.rows)) {
    return null;
  }
  return { ...record, rows: record.rows.filter(isRow) };
}

/** ID eines importierten Lebensmittels: auf allen Geräten gleich (D-207). */
export function catalogFoodId(source: CatalogSource, code: string): string {
  return stableId(`import:${source}:${code}`);
}

const itemCache = new Map<string, readonly FoodItem[]>();

export function toCatalogItems(rows: readonly CatalogRow[]): FoodItem[] {
  return rows.map((row) => ({
    id: catalogFoodId(row[1], row[0]),
    name: row[2],
    aliases: austrianAliases(row[2]),
    basis: 'g' as const,
    per100: rowNutrients(row),
    servings: [],
    source: 'import' as const,
    catalog: row[1],
    quality: 'verified' as const,
    sourceRef: row[0],
  }));
}

export interface ImportedCatalog {
  info: CatalogInfo;
  items: readonly FoodItem[];
}

/** Importierte Lebensmittel (reaktiv); `null` ohne Import, `undefined` beim Laden. */
export function useImportedCatalog(): ImportedCatalog | null | undefined {
  const { db } = useDb();
  return useLiveQuery(async () => {
    const record = await readCatalog(db);
    if (!record) return null;
    const { rows, ...info } = record;
    // Die IDs (SHA-1) für rund 17 000 Einträge nur einmal je Import berechnen.
    const key = `${db.name}|${info.importedAt}`;
    let items = itemCache.get(key);
    if (!items) {
      items = Object.freeze(toCatalogItems(rows));
      itemCache.clear();
      itemCache.set(key, items);
    }
    return { info: { ...info, count: rows.length }, items };
  }, [db]);
}
