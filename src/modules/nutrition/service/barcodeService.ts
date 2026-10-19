import type { DbRuntime } from '@/shared/db';
import { barcodeVariants, normalizeBarcode } from '../calc/barcode';
import type { OffDraft } from '../calc/openFoodFacts';
import { findFoodByBarcode } from '../data/nutritionRepository';
import { fetchOffProduct, getOffConsent, OffUnavailableError } from '../data/openFoodFacts';
import type { Food } from '../model/nutrition';
import { createFoodFromOff, InvalidFoodError } from './nutritionService';

export type BarcodeLookup =
  | { kind: 'invalid' }
  /** Schon unter „Meine Lebensmittel“; ohne Netz und ohne Anfrage. */
  | { kind: 'local'; food: Food }
  /** Noch keine Einwilligung: Es wurde nichts gesendet. */
  | { kind: 'needsConsent'; barcode: string }
  /** Bei Open Food Facts gefunden und als eigenes Lebensmittel gespeichert. */
  | { kind: 'saved'; food: Food }
  /** Gefunden, aber Pflichtwerte fehlen: Formular mit Vorbelegung öffnen. */
  | { kind: 'incomplete'; draft: OffDraft }
  | { kind: 'notFound'; barcode: string }
  | { kind: 'unavailable'; barcode: string };

/**
 * Barcode nachschlagen (NU-07, D-266): zuerst in den eigenen Lebensmitteln, dann – nur mit
 * Einwilligung – bei Open Food Facts. Vollständige Treffer werden gleich gespeichert, damit der
 * nächste Scan ohne Netz funktioniert.
 */
export async function lookupBarcode(
  rt: DbRuntime,
  raw: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<BarcodeLookup> {
  const barcode = normalizeBarcode(raw);
  if (!barcode) return { kind: 'invalid' };
  const local = await findFoodByBarcode(rt.db, barcodeVariants(barcode));
  if (local) return { kind: 'local', food: local };
  if (!(await getOffConsent(rt.db))) return { kind: 'needsConsent', barcode };
  let result;
  try {
    result = await fetchOffProduct(barcode, options.fetchImpl);
  } catch (error) {
    if (error instanceof OffUnavailableError) return { kind: 'unavailable', barcode };
    throw error;
  }
  if (result.kind === 'notFound') return { kind: 'notFound', barcode };
  const { draft } = result;
  if (draft.missing.length > 0 || !draft.name) return { kind: 'incomplete', draft };
  // Während der Abfrage könnte derselbe Code schon gespeichert worden sein (zweiter Scan).
  const again = await findFoodByBarcode(rt.db, barcodeVariants(barcode));
  if (again) return { kind: 'local', food: again };
  try {
    const food = await createFoodFromOff(rt, {
      name: draft.name,
      ...(draft.brand ? { brand: draft.brand } : {}),
      basis: draft.basis,
      per100: draft.per100,
      servings: draft.servings,
      barcode,
    });
    return { kind: 'saved', food };
  } catch (error) {
    if (error instanceof InvalidFoodError) return { kind: 'incomplete', draft };
    throw error;
  }
}
