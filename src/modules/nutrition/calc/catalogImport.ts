import { z } from 'zod';
import {
  CORE_NUTRIENTS,
  type CatalogSource,
  FOOD_NAME_MAX,
  NUTRIENT_LIMITS,
  NUTRIENTS,
  type Nutrients,
} from '../model/nutrition';

/**
 * Import einer Lebensmitteldatei der BLS-Recherche von nutritional-software.at (D-263): Die Datei
 * bringt die Nutzerin bzw. der Nutzer selbst mit; die App prüft sie, filtert und speichert die
 * Einträge nur auf dem Gerät. Reine Funktionen ohne Dexie und React.
 */

/** Kompakte Zeile: Code, Quelle, Name, dann die Nährwerte in der Reihenfolge von NUTRIENTS. */
export type CatalogRow = [string, CatalogSource, string, ...(number | null)[]];

export interface CatalogSummary {
  /** Übernommene Einträge je Quelle. */
  kept: Record<CatalogSource, number>;
  skipped: {
    /** Deutsche Daten (BLS 4.0 und BLS 3.02), auf Wunsch des Produktinhabers nicht übernommen. */
    bls: number;
    /** Vom Hersteller als auslaufend markiert („+++läuft aus“). */
    discontinued: number;
    /** Unbekannte Quelle, fehlende Pflichtwerte, Werte außerhalb des Bereichs oder doppelt. */
    invalid: number;
    /**
     * Gleicher Code bei verschiedenen Namen (in der Recherche bei einigen ÖNWT-Einträgen mit
     * identischen Werten): Welcher Name stimmt, ist unklar, daher fallen alle Einträge weg.
     */
    ambiguous: number;
  };
}

export interface CatalogImportResult {
  fetchedAt?: string;
  rows: CatalogRow[];
  summary: CatalogSummary;
}

export class CatalogFileError extends Error {
  override name = 'CatalogFileError';
}

const value = z.number().nullable().optional();
const rowSchema = z.object({
  code: z.string(),
  source: z.string(),
  name: z.string(),
  ...Object.fromEntries(NUTRIENTS.map((n) => [n, value])),
});
const fileSchema = z.object({
  fetchedAt: z.string().max(40).optional(),
  rows: z.array(z.unknown()).min(1),
});

/** Quelle aus der Kennung der Recherche, z. B. „BLS3.02“ oder „ÖNWT-TK“. */
export function catalogSource(tag: string): CatalogSource | 'bls' | undefined {
  const normalized = tag.normalize('NFC').trim().toUpperCase();
  if (normalized.startsWith('BLS')) return 'bls';
  if (normalized.startsWith('ÖNWT')) return 'oenwt';
  return undefined;
}

const CODE_PATTERN = /^[0-9A-Za-z]{1,20}$/;

function cleanName(name: string) {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Nährwerte prüfen; Energie leicht über der Grenze (reine Fette, z. B. 900,8 kcal) wird gekappt. */
function nutrientValues(row: Record<string, unknown>): (number | null)[] | undefined {
  const result: (number | null)[] = [];
  for (const nutrient of NUTRIENTS) {
    const raw = row[nutrient];
    if (raw === null || raw === undefined) {
      if ((CORE_NUTRIENTS as readonly string[]).includes(nutrient)) return undefined;
      result.push(null);
      continue;
    }
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return undefined;
    const limit = NUTRIENT_LIMITS[nutrient];
    if (raw > limit * 1.02) return undefined;
    result.push(Math.min(raw, limit));
  }
  return result;
}

/**
 * Prüft und filtert die Datei: übernimmt nur ÖNWT-Einträge; BLS 4.0 und BLS 3.02 (deutsche Daten),
 * auslaufende Produkte, unvollständige und unklare Einträge fallen weg.
 */
export function parseCatalogFile(raw: unknown): CatalogImportResult {
  const file = fileSchema.safeParse(raw);
  if (!file.success) throw new CatalogFileError('Unbekanntes Dateiformat');
  const summary: CatalogSummary = {
    kept: { oenwt: 0 },
    skipped: { bls: 0, discontinued: 0, invalid: 0, ambiguous: 0 },
  };
  const byKey = new Map<string, { row: CatalogRow; count: number; ambiguous: boolean }>();
  let recognized = 0;
  for (const item of file.data.rows) {
    const parsed = rowSchema.safeParse(item);
    if (!parsed.success) {
      summary.skipped.invalid += 1;
      continue;
    }
    const row = parsed.data as Record<string, unknown> & {
      code: string;
      source: string;
      name: string;
    };
    const source = catalogSource(row.source);
    const name = cleanName(row.name);
    const code = row.code.trim();
    if (source === undefined || !CODE_PATTERN.test(code)) {
      summary.skipped.invalid += 1;
      continue;
    }
    recognized += 1;
    if (source === 'bls') {
      summary.skipped.bls += 1;
      continue;
    }
    if (name.includes('+++')) {
      summary.skipped.discontinued += 1;
      continue;
    }
    const values = nutrientValues(row);
    const key = `${source}:${code}`;
    if (!name || name.length > FOOD_NAME_MAX || values === undefined) {
      summary.skipped.invalid += 1;
      continue;
    }
    const previous = byKey.get(key);
    if (previous) {
      previous.count += 1;
      if (previous.row[2] !== name) previous.ambiguous = true;
      continue;
    }
    byKey.set(key, { row: [code, source, name, ...values], count: 1, ambiguous: false });
  }
  const rows: CatalogRow[] = [];
  for (const { row, count, ambiguous } of byKey.values()) {
    if (ambiguous) {
      summary.skipped.ambiguous += count;
      continue;
    }
    summary.skipped.invalid += count - 1;
    rows.push(row);
    summary.kept[row[1]] += 1;
  }
  if (recognized === 0) throw new CatalogFileError('Keine bekannten Einträge');
  return {
    ...(file.data.fetchedAt ? { fetchedAt: file.data.fetchedAt } : {}),
    rows,
    summary,
  };
}

/** Nährwerte einer kompakten Zeile. */
export function rowNutrients(row: CatalogRow): Nutrients {
  const per100: Nutrients = {};
  NUTRIENTS.forEach((nutrient, i) => {
    const v = row[3 + i];
    if (typeof v === 'number') per100[nutrient] = v;
  });
  return per100;
}
