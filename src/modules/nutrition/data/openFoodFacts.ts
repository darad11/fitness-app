import { useLiveQuery } from 'dexie-react-hooks';
import { getMetaValue, setMetaValue, useDb, type AppDb } from '@/shared/db';
import { OFF_FIELDS, parseOffResponse, type OffResult } from '../calc/openFoodFacts';

/**
 * Zugriff auf Open Food Facts (D-302, D-266): nur nach Einwilligung, nur der Barcode, nur die
 * nötigen Felder, kein Bild. Die Einwilligung liegt lokal in `meta` und wird nicht synchronisiert.
 */
export const OFF_HOST = 'https://world.openfoodfacts.org';
const CONSENT_KEY = 'consent.openFoodFacts';
const TIMEOUT_MS = 10_000;

export interface OffConsent {
  grantedAt: string;
}

function parseConsent(value: unknown): OffConsent | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'grantedAt' in value &&
    typeof value.grantedAt === 'string'
  ) {
    return { grantedAt: value.grantedAt };
  }
  return null;
}

export async function getOffConsent(db: AppDb): Promise<OffConsent | null> {
  return parseConsent(await getMetaValue(db, CONSENT_KEY));
}

export async function setOffConsent(db: AppDb, granted: boolean, now = new Date()): Promise<void> {
  await setMetaValue(db, CONSENT_KEY, granted ? { grantedAt: now.toISOString() } : null);
}

/** Einwilligung (reaktiv); `undefined` beim Laden, `null` ohne Einwilligung. */
export function useOffConsent(): OffConsent | null | undefined {
  const { db } = useDb();
  return useLiveQuery(() => getOffConsent(db), [db]);
}

/** Netz fehlt, Dienst antwortet nicht oder mit Fehler. */
export class OffUnavailableError extends Error {
  override name = 'OffUnavailableError';
}

export function offProductUrl(barcode: string): string {
  return `${OFF_HOST}/api/v2/product/${barcode}.json?fields=${OFF_FIELDS.join(',')}`;
}

/** Fragt ein Produkt ab; ohne Einwilligung darf das nicht aufgerufen werden (prüft der Service). */
export async function fetchOffProduct(
  barcode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OffResult> {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    throw new OffUnavailableError('offline');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  try {
    const response = await fetchImpl(offProductUrl(barcode), {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
    });
    // Unbekannte Barcodes beantwortet die API mit 404 und status 0.
    if (response.status === 404) return { kind: 'notFound' };
    if (!response.ok) throw new OffUnavailableError(`HTTP ${String(response.status)}`);
    return parseOffResponse(barcode, await response.json());
  } catch (error) {
    if (error instanceof OffUnavailableError) throw error;
    throw new OffUnavailableError(error instanceof Error ? error.message : 'Netzfehler');
  } finally {
    clearTimeout(timer);
  }
}
