import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { FOOD_BASES, FOOD_NAME_MAX, LOG_KINDS, NUTRIENTS, type Nutrient } from './nutrition';

/**
 * Mahlzeit-Vorlage (NU-11, D-268): mehrere Einträge mit eingefrorenen Werten, die sich mit einem
 * Tipp in eine Mahlzeit eintragen lassen. Spätere Änderungen an Lebensmitteln oder Rezepten
 * wirken nicht in die Vorlage (D-209).
 */
export const TEMPLATE_LIMITS = { items: 30, name: 60 } as const;

export const templateItemSchema = z.strictObject({
  id: z.uuid(),
  kind: z.enum(LOG_KINDS),
  foodId: z.uuid().optional(),
  nameSnapshot: z.string().trim().min(1).max(FOOD_NAME_MAX),
  basisSnapshot: z.enum(FOOD_BASES).optional(),
  amount: z.number().positive().max(10_000).optional(),
  servingSnapshot: z
    .strictObject({ name: z.string().min(1).max(40), count: z.number().positive().max(100) })
    .optional(),
  nutrients: z.strictObject(
    Object.fromEntries(
      NUTRIENTS.map((n) => [n, z.number().min(0).max(100_000).optional()]),
    ) as Record<Nutrient, z.ZodOptional<z.ZodNumber>>,
  ),
  isEstimated: z.boolean(),
});
export type TemplateItem = z.infer<typeof templateItemSchema>;

export const mealTemplateSchema = defineDocSchema('meal_template', {
  name: z.string().trim().min(1).max(TEMPLATE_LIMITS.name),
  items: z.array(templateItemSchema).min(1).max(TEMPLATE_LIMITS.items),
  archivedAt: isoDateTimeSchema.optional(),
});
export type MealTemplate = z.infer<typeof mealTemplateSchema>;
export type MealTemplateData = DocData<MealTemplate>;
