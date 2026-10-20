import { stableId } from '@/shared/lib/uuid';
import type { FoodItem } from '../model/foodItem';

/**
 * Feste Lebensmittel für Tests (Werte wie früher im gebündelten BLS 4.0, der mit D-279 entfällt),
 * damit die erwarteten Zahlen der Tests gleich bleiben.
 */
export const OATS: FoodItem = {
  id: stableId('test:C133000'),
  name: 'Hafer Flocken',
  aliases: [],
  basis: 'g',
  per100: {
    kcal: 348,
    protein: 13.22,
    carbs: 53.3,
    sugar: 0.74,
    fat: 6.65,
    saturatedFat: 1.34,
    fiber: 10.98,
    salt: 0,
  },
  servings: [],
  source: 'import',
  catalog: 'oenwt',
  quality: 'verified',
  sourceRef: 'C133000',
};

export const BANANA: FoodItem = {
  id: stableId('test:F503100'),
  name: 'Banane roh',
  aliases: [],
  basis: 'g',
  per100: {
    kcal: 79,
    protein: 1.32,
    carbs: 15.89,
    sugar: 13.89,
    fat: 0.4,
    saturatedFat: 0.07,
    fiber: 2,
    salt: 0,
  },
  servings: [],
  source: 'import',
  catalog: 'oenwt',
  quality: 'verified',
  sourceRef: 'F503100',
};

export const BREAD: FoodItem = {
  id: stableId('test:B101000'),
  name: 'Vollkornbrot',
  aliases: [],
  basis: 'g',
  per100: {
    kcal: 210,
    protein: 7.16,
    carbs: 38,
    sugar: 0.82,
    fat: 1.01,
    saturatedFat: 0.12,
    fiber: 10.04,
    salt: 1.2,
  },
  servings: [],
  source: 'import',
  catalog: 'oenwt',
  quality: 'verified',
  sourceRef: 'B101000',
};
