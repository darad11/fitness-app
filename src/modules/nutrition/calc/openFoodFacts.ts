import { z } from 'zod';
import {
  CORE_NUTRIENTS,
  FOOD_NAME_MAX,
  NUTRIENT_LIMITS,
  type FoodBasis,
  type Nutrient,
  type Nutrients,
} from '../model/nutrition';
import { kjToKcal } from './nutrients';

/**
 * Open Food Facts (D-302, D-266): Antwort der Produktabfrage in ein Lebensmittel übersetzen. Reine
 * Funktionen; die Abfrage selbst liegt in `data/openFoodFacts.ts`.
 */

/** Nur diese Felder werden abgefragt; Bilder und alles andere nicht. */
export const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_de',
  'brands',
  'nutriments',
  'nutrition_data_per',
  'serving_quantity',
  'serving_quantity_unit',
  'product_quantity_unit',
  'quantity',
] as const;

const number = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : v),
  z.number().nonnegative(),
);
const optionalNumber = number.optional().catch(undefined);

const productSchema = z.object({
  product_name: z.string().optional().catch(undefined),
  product_name_de: z.string().optional().catch(undefined),
  brands: z.string().optional().catch(undefined),
  nutrition_data_per: z.string().optional().catch(undefined),
  serving_quantity: optionalNumber,
  serving_quantity_unit: z.string().optional().catch(undefined),
  product_quantity_unit: z.string().optional().catch(undefined),
  quantity: z.string().optional().catch(undefined),
  nutriments: z.record(z.string(), z.unknown()).optional().catch(undefined),
});

const responseSchema = z.object({
  status: z.union([z.literal(0), z.literal(1)]).or(z.string()),
  product: z.unknown().optional(),
});

/** Felder der Nährwerte bei Open Food Facts je 100 g bzw. 100 ml. */
const OFF_KEYS: Record<Exclude<Nutrient, 'kcal'>, string> = {
  protein: 'proteins_100g',
  carbs: 'carbohydrates_100g',
  sugar: 'sugars_100g',
  fat: 'fat_100g',
  saturatedFat: 'saturated-fat_100g',
  fiber: 'fiber_100g',
  salt: 'salt_100g',
};

export interface OffDraft {
  barcode: string;
  name: string;
  brand?: string;
  basis: FoodBasis;
  per100: Nutrients;
  servings: { name: string; amount: number }[];
  /** Pflichtwerte, die bei Open Food Facts fehlen; dann muss die Nutzerin bzw. der Nutzer ergänzen. */
  missing: Nutrient[];
}

export type OffResult = { kind: 'found'; draft: OffDraft } | { kind: 'notFound' };

function round(value: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function readNutriments(raw: Record<string, unknown> | undefined): Nutrients {
  const per100: Nutrients = {};
  if (!raw) return per100;
  const read = (key: string) => optionalNumber.parse(raw[key]);
  const kcal = read('energy-kcal_100g');
  const kj = read('energy-kj_100g') ?? read('energy_100g');
  const energy = kcal ?? (kj !== undefined ? kjToKcal(kj) : undefined);
  if (energy !== undefined && energy <= NUTRIENT_LIMITS.kcal * 1.02) {
    per100.kcal = round(Math.min(energy, NUTRIENT_LIMITS.kcal), 1);
  }
  for (const [nutrient, key] of Object.entries(OFF_KEYS) as [Exclude<Nutrient, 'kcal'>, string][]) {
    const value = read(key);
    if (value !== undefined && value <= NUTRIENT_LIMITS[nutrient]) {
      per100[nutrient] = round(value, 2);
    }
  }
  return per100;
}

/** Liest die JSON-Antwort von `/api/v2/product/<code>.json`. */
export function parseOffResponse(barcode: string, json: unknown): OffResult {
  const response = responseSchema.safeParse(json);
  if (!response.success || response.data.status !== 1) return { kind: 'notFound' };
  const product = productSchema.safeParse(response.data.product);
  if (!product.success) return { kind: 'notFound' };
  const p = product.data;
  const name = (
    [p.product_name_de, p.product_name].map((n) => n?.trim()).find(Boolean) ?? ''
  ).replace(/\s+/g, ' ');
  const brand = p.brands?.split(',')[0]?.trim();
  const unit = (p.product_quantity_unit ?? p.quantity ?? '').toLowerCase();
  const basis: FoodBasis = /\bml\b|\bl\b|\bcl\b/.test(unit) ? 'ml' : 'g';
  const per100 = readNutriments(p.nutriments);
  const servingUnit = p.serving_quantity_unit?.toLowerCase();
  const servings =
    p.serving_quantity !== undefined &&
    p.serving_quantity > 0 &&
    p.serving_quantity <= 5000 &&
    (servingUnit === undefined || servingUnit === basis)
      ? [{ name: 'Portion', amount: round(p.serving_quantity, 1) }]
      : [];
  return {
    kind: 'found',
    draft: {
      barcode,
      name: name.slice(0, FOOD_NAME_MAX),
      ...(brand ? { brand: brand.slice(0, 60) } : {}),
      basis,
      per100,
      servings,
      missing: CORE_NUTRIENTS.filter((n) => per100[n] === undefined),
    },
  };
}
