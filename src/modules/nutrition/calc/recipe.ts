import { NUTRIENTS, type Nutrient, type Nutrients } from '../model/nutrition';
import type { Ingredient } from '../model/recipe';
import { scaleNutrients } from './nutrients';

export interface RecipeTotals {
  /** Summe der Zutatenmengen in Gramm (Milliliter zählen wie Gramm, D-267). */
  grams: number;
  /** Nährwerte des ganzen Rezepts. */
  total: Nutrients;
  perServing: Nutrients;
  /** Je 100 g Rezept, damit sich ein Rezept wie ein Lebensmittel eintragen lässt. */
  per100: Nutrients;
  /** Werte, die mindestens einer Zutat fehlen; sie fehlen dann auch in der Summe. */
  missing: Nutrient[];
}

const round = (value: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

/**
 * Nährwerte eines Rezepts aus den eingefrorenen Werten der Zutaten. Fehlt einer Zutat ein Wert,
 * fehlt er in der Summe (statt zu niedrig angezeigt zu werden), wie in der Tagesübersicht (NU-22).
 */
export function recipeTotals(ingredients: readonly Ingredient[], servings: number): RecipeTotals {
  const grams = ingredients.reduce((sum, i) => sum + i.amount, 0);
  const sums: Partial<Record<Nutrient, number>> = {};
  const missing = new Set<Nutrient>();
  for (const ingredient of ingredients) {
    const scaled = scaleNutrients(ingredient.per100Snapshot, ingredient.amount);
    for (const nutrient of NUTRIENTS) {
      const value = scaled[nutrient];
      if (value === undefined) missing.add(nutrient);
      else sums[nutrient] = (sums[nutrient] ?? 0) + value;
    }
  }
  const total: Nutrients = {};
  const perServing: Nutrients = {};
  const per100: Nutrients = {};
  for (const nutrient of NUTRIENTS) {
    const value = sums[nutrient];
    if (value === undefined || missing.has(nutrient)) continue;
    total[nutrient] = round(value, 1);
    perServing[nutrient] = round(value / servings, 1);
    if (grams > 0) per100[nutrient] = round((value / grams) * 100, 2);
  }
  return {
    grams: round(grams, 1),
    total,
    perServing,
    per100,
    missing: NUTRIENTS.filter((n) => missing.has(n)),
  };
}
