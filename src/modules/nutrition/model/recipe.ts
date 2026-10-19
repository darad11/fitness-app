import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { FOOD_BASES, FOOD_NAME_MAX, NUTRIENT_LIMITS, NUTRIENTS, type Nutrient } from './nutrition';

/**
 * Rezept (M7, D-267): Zutaten mit eingefrorenen Nährwerten je 100 (wie Protokolleinträge, D-209),
 * Anzahl Portionen und optional eine Zubereitung. Spätere Änderungen an einem Lebensmittel wirken
 * nicht in das Rezept; das Rezept selbst lässt sich bearbeiten.
 */
export const RECIPE_LIMITS = {
  ingredients: 40,
  servings: { min: 1, max: 50 },
  amount: 5000,
  steps: 5000,
} as const;

const per100Schema = z.strictObject(
  Object.fromEntries(
    NUTRIENTS.map((n) => [n, z.number().min(0).max(NUTRIENT_LIMITS[n]).optional()]),
  ) as Record<Nutrient, z.ZodOptional<z.ZodNumber>>,
);

export const ingredientSchema = z.strictObject({
  id: z.uuid(),
  /** Herkunft (eigenes, gescanntes, BLS- oder importiertes Lebensmittel); nur zur Information. */
  foodId: z.uuid().optional(),
  nameSnapshot: z.string().trim().min(1).max(FOOD_NAME_MAX),
  basisSnapshot: z.enum(FOOD_BASES),
  /** Gramm bzw. Milliliter in der Zutatenmenge des ganzen Rezepts. */
  amount: z.number().positive().max(RECIPE_LIMITS.amount),
  /** Portion des Lebensmittels, falls so erfasst, nur für die Anzeige. */
  servingSnapshot: z
    .strictObject({ name: z.string().min(1).max(40), count: z.number().positive().max(100) })
    .optional(),
  per100Snapshot: per100Schema,
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const recipeSchema = defineDocSchema('recipe', {
  name: z.string().trim().min(1).max(FOOD_NAME_MAX),
  nameNorm: z.string().min(1),
  servings: z.number().int().min(RECIPE_LIMITS.servings.min).max(RECIPE_LIMITS.servings.max),
  ingredients: z.array(ingredientSchema).min(1).max(RECIPE_LIMITS.ingredients),
  steps: z.string().trim().min(1).max(RECIPE_LIMITS.steps).optional(),
  favorite: z.boolean().optional(),
  archivedAt: isoDateTimeSchema.optional(),
});
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeData = DocData<Recipe>;
