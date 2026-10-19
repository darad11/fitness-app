import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listFoods } from '../data/nutritionRepository';
import { getOffConsent, offProductUrl, setOffConsent } from '../data/openFoodFacts';
import { lookupBarcode } from './barcodeService';
import { createFood } from './nutritionService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const SKYR = {
  status: 1,
  product: {
    product_name: 'Skyr Natur',
    brands: 'Spar',
    serving_quantity: 150,
    nutriments: {
      'energy-kcal_100g': 63,
      proteins_100g: 11,
      carbohydrates_100g: 4,
      fat_100g: 0.2,
      salt_100g: 0.1,
    },
  },
};

const respond = (status: number, body: unknown) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('Barcode nachschlagen (NU-07, D-266)', () => {
  it('sendet ohne Einwilligung nichts und fragt erst danach', async () => {
    const fetchImpl = respond(200, SKYR);
    expect(await lookupBarcode(rt, '9001234567896', { fetchImpl })).toEqual({
      kind: 'needsConsent',
      barcode: '9001234567896',
    });
    expect(fetchImpl).not.toHaveBeenCalled();

    await setOffConsent(rt.db, true, new Date('2026-10-19T12:00:00.000Z'));
    expect(await getOffConsent(rt.db)).toEqual({ grantedAt: '2026-10-19T12:00:00.000Z' });
    const saved = await lookupBarcode(rt, '9001234567896', { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(offProductUrl('9001234567896'));
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' });
    expect(saved.kind).toBe('saved');
    const [food] = await listFoods(rt.db);
    expect(food).toMatchObject({
      name: 'Skyr Natur',
      brand: 'Spar',
      barcode: '9001234567896',
      source: 'off',
      quality: 'community',
      per100: { kcal: 63, protein: 11, carbs: 4, fat: 0.2, salt: 0.1 },
      servings: [{ name: 'Portion', amount: 150 }],
    });

    // Der zweite Scan findet das Produkt lokal, ohne Anfrage.
    const again = await lookupBarcode(rt, '9001234567896', { fetchImpl });
    expect(again).toMatchObject({ kind: 'local', food: { id: food?.id } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Zurückgezogen: wieder keine Anfrage.
    await setOffConsent(rt.db, false);
    expect(await lookupBarcode(rt, '96385074', { fetchImpl })).toMatchObject({
      kind: 'needsConsent',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('findet eigene Lebensmittel mit Barcode ohne Einwilligung und Netz', async () => {
    await createFood(rt, {
      name: 'Kernöl',
      basis: 'ml',
      per100: { kcal: 828, protein: 0, carbs: 0, fat: 92 },
      barcode: '036000291452',
    });
    const fetchImpl = respond(200, SKYR);
    expect(await lookupBarcode(rt, '0036000291452', { fetchImpl })).toMatchObject({
      kind: 'local',
      food: { name: 'Kernöl' },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('meldet ungültige, unbekannte, unvollständige und nicht erreichbare Fälle', async () => {
    await setOffConsent(rt.db, true);
    expect(await lookupBarcode(rt, '4006381333932')).toEqual({ kind: 'invalid' });
    expect(
      await lookupBarcode(rt, '4006381333931', { fetchImpl: respond(404, { status: 0 }) }),
    ).toEqual({ kind: 'notFound', barcode: '4006381333931' });
    expect(
      await lookupBarcode(rt, '4006381333931', {
        fetchImpl: vi.fn<typeof fetch>(() => Promise.reject(new TypeError('Failed to fetch'))),
      }),
    ).toEqual({ kind: 'unavailable', barcode: '4006381333931' });
    expect(await lookupBarcode(rt, '4006381333931', { fetchImpl: respond(503, {}) })).toEqual({
      kind: 'unavailable',
      barcode: '4006381333931',
    });
    const incomplete = await lookupBarcode(rt, '4006381333931', {
      fetchImpl: respond(200, {
        status: 1,
        product: { product_name: 'Müsli', nutriments: { 'energy-kcal_100g': 380 } },
      }),
    });
    expect(incomplete).toMatchObject({
      kind: 'incomplete',
      draft: { name: 'Müsli', missing: ['protein', 'carbs', 'fat'] },
    });
    expect(await listFoods(rt.db)).toHaveLength(0);
  });
});
