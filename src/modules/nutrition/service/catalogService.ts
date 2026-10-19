import type { AppDb } from '@/shared/db';
import {
  CatalogFileError,
  parseCatalogFile,
  type CatalogImportResult,
} from '../calc/catalogImport';
import { removeCatalog, saveCatalog } from '../data/catalogStore';

export { CatalogFileError };

/** Größte zulässige Datei (die vollständige Recherche hat rund 6 MB). */
export const CATALOG_FILE_MAX_BYTES = 30 * 1024 * 1024;

/**
 * Liest und prüft eine Datei der BLS-Recherche (D-263) und gibt die Vorschau zurück; gespeichert
 * wird erst mit `commitCatalog`. Die Datei verlässt das Gerät nicht.
 */
export async function prepareCatalog(file: Blob): Promise<CatalogImportResult> {
  if (file.size > CATALOG_FILE_MAX_BYTES) throw new CatalogFileError('Datei zu groß');
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new CatalogFileError('Kein JSON');
  }
  return parseCatalogFile(raw);
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
