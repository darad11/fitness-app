import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, type AppDb } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { austrianAliases } from '../calc/austrianTerms';
import type { BrandImportResult, BrandRow } from '../calc/catalogBrands';
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

/** Marken zu den importierten Einträgen (D-271); eigener Datensatz, bleibt bei neuem Import. */
export const BRANDS_ID = 'marken';

export interface BrandRecord {
  id: string;
  formatVersion: number;
  importedAt: string;
  fetchedAt?: string;
  rows: BrandRow[];
}

export type CatalogInfo = Omit<CatalogRecord, 'rows'> & {
  count: number;
  /** Einträge mit Marke, sofern die Markendatei importiert ist. */
  brandCount?: number;
};

class CatalogDb extends Dexie {
  declare catalogs: Table<CatalogRecord | BrandRecord, string>;

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

export async function saveBrands(
  db: AppDb,
  result: BrandImportResult,
  now: Date = new Date(),
): Promise<void> {
  await catalogDb(db).catalogs.put({
    id: BRANDS_ID,
    formatVersion: FORMAT_VERSION,
    importedAt: now.toISOString(),
    ...(result.fetchedAt ? { fetchedAt: result.fetchedAt } : {}),
    rows: result.rows,
  });
}

/** Entfernt Lebensmitteldaten und Marken. */
export async function removeCatalog(db: AppDb): Promise<void> {
  await catalogDb(db).catalogs.bulkDelete([CATALOG_ID, BRANDS_ID]);
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
  const record = (await catalogDb(db).catalogs.get(CATALOG_ID)) as CatalogRecord | undefined;
  if (record?.formatVersion !== FORMAT_VERSION || !Array.isArray(record.rows)) {
    return null;
  }
  return { ...record, rows: record.rows.filter(isRow) };
}

function isBrandRow(row: unknown): row is BrandRow {
  return (
    Array.isArray(row) &&
    row.length === 3 &&
    row.every((v) => typeof v === 'string' && v.length > 0 && v.length <= 200)
  );
}

async function readBrands(db: AppDb): Promise<BrandRecord | null> {
  const record = (await catalogDb(db).catalogs.get(BRANDS_ID)) as BrandRecord | undefined;
  if (record?.formatVersion !== FORMAT_VERSION || !Array.isArray(record.rows)) return null;
  return { ...record, rows: record.rows.filter(isBrandRow) };
}

/** Marke je Eintrag: Code und Name müssen übereinstimmen (gleiche Codes mit anderem Namen). */
export function brandIndex(rows: readonly BrandRow[]): Map<string, string> {
  return new Map(rows.map(([code, name, brand]) => [`${code}\u0000${name}`, brand]));
}

/** Wie viele importierte Einträge eine Marke bekommen. */
export async function countBrandMatches(db: AppDb, rows: readonly BrandRow[]): Promise<number> {
  const catalog = await readCatalog(db);
  if (!catalog) return 0;
  const index = brandIndex(rows);
  return catalog.rows.filter((row) => index.has(`${row[0]}\u0000${row[2]}`)).length;
}

/** ID eines importierten Lebensmittels: auf allen Geräten gleich (D-207). */
export function catalogFoodId(source: CatalogSource, code: string): string {
  return stableId(`import:${source}:${code}`);
}

const itemCache = new Map<string, readonly FoodItem[]>();

export function toCatalogItems(
  rows: readonly CatalogRow[],
  brands: ReadonlyMap<string, string> = new Map(),
): FoodItem[] {
  return rows.map((row) => {
    const brand = brands.get(`${row[0]}\u0000${row[2]}`);
    return {
      id: catalogFoodId(row[1], row[0]),
      name: row[2],
      ...(brand ? { brand } : {}),
      aliases: austrianAliases(row[2]),
      basis: 'g' as const,
      per100: rowNutrients(row),
      servings: [],
      source: 'import' as const,
      catalog: row[1],
      quality: 'verified' as const,
      sourceRef: row[0],
    };
  });
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
    const brands = await readBrands(db);
    const { rows, ...info } = record;
    // Die IDs (SHA-1) für alle Einträge nur einmal je Import berechnen.
    const key = `${db.name}|${info.importedAt}|${brands?.importedAt ?? ''}`;
    let items = itemCache.get(key);
    if (!items) {
      items = Object.freeze(toCatalogItems(rows, brandIndex(brands?.rows ?? [])));
      itemCache.clear();
      itemCache.set(key, items);
    }
    const brandCount = brands ? items.filter((item) => item.brand).length : undefined;
    return {
      info: { ...info, count: rows.length, ...(brandCount === undefined ? {} : { brandCount }) },
      items,
    };
  }, [db]);
}
