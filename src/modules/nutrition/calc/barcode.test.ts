import { describe, expect, it } from 'vitest';
import { barcodeVariants, hasValidCheckDigit, normalizeBarcode } from './barcode';
import { parseOffResponse } from './openFoodFacts';

describe('Barcodes (D-266)', () => {
  it('prüft die Prüfziffer von EAN-13, EAN-8 und UPC-A', () => {
    expect(hasValidCheckDigit('4006381333931')).toBe(true);
    expect(hasValidCheckDigit('4006381333932')).toBe(false);
    expect(hasValidCheckDigit('96385074')).toBe(true);
    expect(hasValidCheckDigit('036000291452')).toBe(true);
  });

  it('normalisiert Eingaben und lehnt Ungültiges ab', () => {
    expect(normalizeBarcode(' 4006381 333931 ')).toBe('4006381333931');
    expect(normalizeBarcode('4006381333932')).toBeNull();
    expect(normalizeBarcode('12345')).toBeNull();
    expect(normalizeBarcode('abc')).toBeNull();
  });

  it('findet UPC-A und EAN-13 mit führender Null gleich', () => {
    expect(barcodeVariants('036000291452')).toEqual(['036000291452', '0036000291452']);
    expect(barcodeVariants('0036000291452')).toEqual(['0036000291452', '036000291452']);
    expect(barcodeVariants('4006381333931')).toEqual(['4006381333931']);
  });
});

describe('Open Food Facts übersetzen (D-266)', () => {
  it('übernimmt Name, Marke, Nährwerte je 100 g und die Portion', () => {
    const result = parseOffResponse('9001234567896', {
      status: 1,
      product: {
        product_name: 'Skyr natur',
        product_name_de: 'Skyr Natur',
        brands: 'Ja! Natürlich, Rewe',
        nutrition_data_per: '100g',
        serving_quantity: '150',
        serving_quantity_unit: 'g',
        product_quantity_unit: 'g',
        nutriments: {
          'energy-kcal_100g': 63,
          proteins_100g: 11,
          carbohydrates_100g: '4,0',
          sugars_100g: 4,
          fat_100g: 0.2,
          'saturated-fat_100g': 0.1,
          salt_100g: 0.13,
          fiber_100g: 'nicht angegeben',
        },
      },
    });
    expect(result).toEqual({
      kind: 'found',
      draft: {
        barcode: '9001234567896',
        name: 'Skyr Natur',
        brand: 'Ja! Natürlich',
        basis: 'g',
        per100: {
          kcal: 63,
          protein: 11,
          carbs: 4,
          sugar: 4,
          fat: 0.2,
          saturatedFat: 0.1,
          salt: 0.13,
        },
        servings: [{ name: 'Portion', amount: 150 }],
        missing: [],
      },
    });
  });

  it('rechnet kJ in kcal um, erkennt ml und meldet fehlende Pflichtwerte', () => {
    const result = parseOffResponse('96385074', {
      status: 1,
      product: {
        product_name: 'Orangensaft',
        quantity: '1 l',
        nutriments: { 'energy-kj_100g': 188, carbohydrates_100g: 10, fat_100g: 999 },
      },
    });
    expect(result.kind).toBe('found');
    if (result.kind !== 'found') return;
    expect(result.draft.basis).toBe('ml');
    expect(result.draft.per100).toEqual({ kcal: 45, carbs: 10 });
    expect(result.draft.missing).toEqual(['protein', 'fat']);
    expect(result.draft.servings).toEqual([]);
  });

  it('meldet unbekannte Produkte und kaputte Antworten als nicht gefunden', () => {
    expect(
      parseOffResponse('96385074', { status: 0, status_verbose: 'product not found' }),
    ).toEqual({ kind: 'notFound' });
    expect(parseOffResponse('96385074', 'kaputt')).toEqual({ kind: 'notFound' });
  });
});
