import type { AppDb } from '@/shared/db';
import {
  CatalogFileError,
  parseCatalogFile,
  type CatalogImportResult,
} from '../calc/catalogImport';
import { isBrandFile, parseBrandFile, type BrandImportResult } from '../calc/catalogBrands';
import { countBrandMatches, removeCatalog, saveBrands, saveCatalog } from '../data/catalogStore';

export { CatalogFileError };

/** Größte zulässige Datei (die vollständige Recherche hat rund 6 MB). */
export const CATALOG_FILE_MAX_BYTES = 30 * 1024 * 1024;

/**
 * Liest und prüft eine Datei der BLS-Recherche (D-263) und gibt die Vorschau zurück; gespeichert
 * wird erst mit `commitCatalog`. Die Datei verlässt das Gerät nicht.
 */
export async function prepareCatalog(file: Blob): Promise<CatalogImportResult> {
  return parseCatalogFile(await readJson(file));
}

async function readJson(file: Blob): Promise<unknown> {
  if (file.size > CATALOG_FILE_MAX_BYTES) throw new CatalogFileError('Datei zu groß');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new CatalogFileError('Kein JSON');
  }
}

export type PreparedImport =
  | { kind: 'catalog'; result: CatalogImportResult }
  | { kind: 'brands'; result: BrandImportResult; matched: number };

/** Markendatei ohne vorherigen Import der Lebensmitteldaten. */
export class CatalogMissingError extends Error {
  override name = 'CatalogMissingError';
}

/**
 * Liest eine Datei der Recherche: Lebensmitteldaten (`nuts-recherche.json`) oder Marken
 * (`nuts-marken.json`, D-271). Gespeichert wird erst mit `commitImport`.
 */
export async function prepareImport(db: AppDb, file: Blob): Promise<PreparedImport> {
  const raw = await readJson(file);
  if (!isBrandFile(raw)) return { kind: 'catalog', result: parseCatalogFile(raw) };
  const result = parseBrandFile(raw);
  if (!result) throw new CatalogFileError('Unbekanntes Dateiformat');
  const matched = await countBrandMatches(db, result.rows);
  if (matched === 0) throw new CatalogMissingError('Keine passenden Lebensmittel');
  return { kind: 'brands', result, matched };
}

export async function commitImport(db: AppDb, prepared: PreparedImport, now?: Date) {
  if (prepared.kind === 'catalog') await saveCatalog(db, prepared.result, now);
  else await saveBrands(db, prepared.result, now);
}

export async function commitCatalog(
  db: AppDb,
  result: CatalogImportResult,
  now?: Date,
): Promise<void> {
  await saveCatalog(db, result, now);
}

/** Entfernt die importierten Daten; Protokolleinträge behalten ihre Werte (D-209). */
export async function deleteCatalog(db: AppDb): Promise<void> {
  await removeCatalog(db);
}
