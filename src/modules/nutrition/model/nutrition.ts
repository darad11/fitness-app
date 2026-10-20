import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { isValidDayKey, isValidTimeZone } from '@/shared/lib/time';

/**
 * Ernährung (data-model.md Abschnitt 4, D-261): eigene Lebensmittel, Protokolleinträge mit
 * eingefrorenen Nährwerten und datierte Ziele. Nährwerte immer je 100 g bzw. 100 ml.
 */
export const NUTRITION_SCHEMA_VERSION = 1;

export const NUTRIENTS = [
  'kcal',
  'protein',
  'carbs',
  'sugar',
  'fat',
  'saturatedFat',
  'fiber',
  'salt',
] as const;
export type Nutrient = (typeof NUTRIENTS)[number];
/** Pflicht für jedes Lebensmittel; der Rest darf fehlen und gilt dann als unvollständig. */
export const CORE_NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat'] as const;

export const NUTRIENT_LIMITS: Record<Nutrient, number> = {
  kcal: 900,
  protein: 100,
  carbs: 100,
  sugar: 100,
  fat: 100,
  saturatedFat: 100,
  fiber: 100,
  salt: 100,
};

const per100Schema = z.strictObject(
  Object.fromEntries(
    NUTRIENTS.map((n) => [n, z.number().min(0).max(NUTRIENT_LIMITS[n]).optional()]),
  ) as Record<Nutrient, z.ZodOptional<z.ZodNumber>>,
);
export type Nutrients = Partial<Record<Nutrient, number>>;

export const FOOD_NAME_MAX = 100;
export const FOOD_SOURCES = ['custom', 'quick', 'bls', 'off', 'import'] as const;
/**
 * Quellen importierter Lebensmitteldaten (D-263): nur die Österreichische Nährwerttabelle; die
 * deutschen BLS-Daten der Recherche übernimmt der Import auf Wunsch des Produktinhabers nicht.
 */
export const CATALOG_SOURCES = ['oenwt'] as const;
export type CatalogSource = (typeof CATALOG_SOURCES)[number];
export const FOOD_QUALITIES = ['verified', 'community', 'user', 'estimated'] as const;
export const FOOD_BASES = ['g', 'ml'] as const;
export type FoodBasis = (typeof FOOD_BASES)[number];

export const servingSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().trim().min(1).max(40),
  /** Gramm bzw. Milliliter je Portion. */
  amount: z.number().positive().max(5000),
});
export type Serving = z.infer<typeof servingSchema>;

export const foodSchema = defineDocSchema('food', {
  name: z.string().trim().min(1).max(FOOD_NAME_MAX),
  nameNorm: z.string().min(1),
  brand: z.string().trim().min(1).max(60).optional(),
  barcode: z
    .string()
    .regex(/^\d{8,14}$/)
    .optional(),
  basis: z.enum(FOOD_BASES),
  per100: per100Schema,
  servings: z.array(servingSchema).max(10),
  source: z.enum(FOOD_SOURCES),
  quality: z.enum(FOOD_QUALITIES),
  /** Herkunft bei Quellen wie BLS oder Open Food Facts, z. B. BLS-Code oder Barcode. */
  sourceRef: z.string().min(1).max(40).optional(),
  favorite: z.boolean().optional(),
  archivedAt: isoDateTimeSchema.optional(),
});
export type Food = z.infer<typeof foodSchema>;
export type FoodData = DocData<Food>;

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

/** 'recipe' seit M7 (D-267): Eintrag aus einem Rezept, Nährwerte wie bei Lebensmitteln eingefroren. */
export const LOG_KINDS = ['food', 'quick', 'recipe'] as const;

/** Protokolleintrag mit eingefrorenen Werten (D-209): spätere Änderungen am Lebensmittel wirken nicht zurück. */
export const foodLogEntrySchema = defineDocSchema('food_log_entry', {
  dayKey: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  tz: z.string().refine(isValidTimeZone, 'Ungültige Zeitzone'),
  slot: z.enum(MEAL_SLOTS),
  loggedAt: isoDateTimeSchema,
  kind: z.enum(LOG_KINDS),
  foodId: z.uuid().optional(),
  nameSnapshot: z.string().trim().min(1).max(FOOD_NAME_MAX),
  /** Marke zum Zeitpunkt des Eintrags (D-278); früher stand sie in Klammern im Namen. */
  brandSnapshot: z.string().trim().min(1).max(60).optional(),
  basisSnapshot: z.enum(FOOD_BASES).optional(),
  /** Gramm bzw. Milliliter; bei Schnelleinträgen leer. */
  amount: z.number().positive().max(10_000).optional(),
  /** Portion, falls über eine Portion erfasst: Name und Anzahl für die Anzeige. */
  servingSnapshot: z
    .strictObject({ name: z.string().min(1).max(40), count: z.number().positive().max(100) })
    .optional(),
  /** Absolute Nährwerte dieses Eintrags; fehlende Werte fehlen (nicht 0). */
  nutrients: z.strictObject(
    Object.fromEntries(
      NUTRIENTS.map((n) => [n, z.number().min(0).max(100_000).optional()]),
    ) as Record<Nutrient, z.ZodOptional<z.ZodNumber>>,
  ),
  isEstimated: z.boolean(),
  notes: z.string().trim().min(1).max(500).optional(),
});
export type FoodLogEntry = z.infer<typeof foodLogEntrySchema>;
export type FoodLogEntryData = DocData<FoodLogEntry>;

export const SEXES = ['female', 'male'] as const;
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export const DIRECTIONS = ['lose', 'maintain', 'gain'] as const;
export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type Direction = (typeof DIRECTIONS)[number];

export const TARGET_LIMITS = {
  kcal: { min: 800, max: 6000 },
  grams: { min: 0, max: 600 },
} as const;

export const targetInputsSchema = z.strictObject({
  sex: z.enum(SEXES),
  birthYear: z.number().int().min(1900).max(2100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activity: z.enum(ACTIVITY_LEVELS),
  direction: z.enum(DIRECTIONS),
});
export type TargetInputs = z.infer<typeof targetInputsSchema>;

/** Tagesziel, datiert wie die übrigen Ziele (AK-SET-01): eine Änderung gilt ab heute. */
export const nutritionTargetSchema = defineDocSchema('nutrition_target', {
  effectiveFrom: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  endedAt: isoDateTimeSchema.optional(),
  kcal: z.number().int().min(TARGET_LIMITS.kcal.min).max(TARGET_LIMITS.kcal.max),
  proteinG: z.number().int().min(0).max(TARGET_LIMITS.grams.max),
  carbsG: z.number().int().min(0).max(TARGET_LIMITS.grams.max),
  fatG: z.number().int().min(0).max(TARGET_LIMITS.grams.max),
  method: z.enum(['manual', 'computed']),
  /** Eingaben der Formel, damit der Vorschlag später nachvollziehbar bleibt. */
  inputsSnapshot: targetInputsSchema.optional(),
});
export type NutritionTarget = z.infer<typeof nutritionTargetSchema>;
export type NutritionTargetData = DocData<NutritionTarget>;
