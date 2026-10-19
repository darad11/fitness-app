import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, type AppDb, type DocDef } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { recipeTotals } from '../calc/recipe';
import type { FoodItem } from '../model/foodItem';
import { recipeSchema, type Recipe } from '../model/recipe';
import {
  foodLogEntrySchema,
  foodSchema,
  NUTRITION_SCHEMA_VERSION,
  nutritionTargetSchema,
  type Food,
  type FoodLogEntry,
  type NutritionTarget,
} from '../model/nutrition';

export const foodDef: DocDef<Food> = {
  type: 'food',
  schemaVersion: NUTRITION_SCHEMA_VERSION,
  schema: foodSchema,
  table: (db) => db.foods,
};

export const foodLogDef: DocDef<FoodLogEntry> = {
  type: 'food_log_entry',
  schemaVersion: NUTRITION_SCHEMA_VERSION,
  schema: foodLogEntrySchema,
  table: (db) => db.foodLog,
};

export const recipeDef: DocDef<Recipe> = {
  type: 'recipe',
  schemaVersion: NUTRITION_SCHEMA_VERSION,
  schema: recipeSchema,
  table: (db) => db.recipes,
};

export const nutritionTargetDef: DocDef<NutritionTarget> = {
  type: 'nutrition_target',
  schemaVersion: NUTRITION_SCHEMA_VERSION,
  schema: nutritionTargetSchema,
  table: (db) => db.nutritionTargets,
};

function parseRows<T>(
  rows: readonly Record<string, unknown>[],
  type: string,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
): T[] {
  return rows.flatMap((row) => {
    if (row.type !== type || row.deletedAt !== null) return [];
    const parsed = schema.safeParse(row);
    return parsed.success && parsed.data !== undefined ? [parsed.data] : [];
  });
}

export function toFoodItem(food: Food): FoodItem {
  return {
    id: food.id,
    name: food.name,
    ...(food.brand ? { brand: food.brand } : {}),
    aliases: [],
    basis: food.basis,
    per100: food.per100,
    servings: food.servings,
    source: food.source,
    quality: food.quality,
    ...(food.favorite ? { favorite: true } : {}),
    ...(food.archivedAt ? { archivedAt: food.archivedAt } : {}),
    ...(food.sourceRef ? { sourceRef: food.sourceRef } : {}),
    ...(food.barcode ? { barcode: food.barcode } : {}),
  };
}

/** Eigene Lebensmittel (auch archivierte), alphabetisch. */
export async function listFoods(db: AppDb): Promise<Food[]> {
  const foods = parseRows<Food>(await db.foods.toArray(), 'food', foodSchema);
  return foods.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Eigenes Lebensmittel mit diesem Barcode (auch archiviert), sonst `undefined`. */
export async function findFoodByBarcode(
  db: AppDb,
  barcodes: readonly string[],
): Promise<Food | undefined> {
  const rows = await db.foods
    .where('barcode')
    .anyOf([...barcodes])
    .toArray();
  return parseRows<Food>(rows, 'food', foodSchema).sort(
    (a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)),
  )[0];
}

export async function listDayEntries(db: AppDb, dayKey: string): Promise<FoodLogEntry[]> {
  const rows = await db.foodLog.where('dayKey').equals(dayKey).toArray();
  return parseRows<FoodLogEntry>(rows, 'food_log_entry', foodLogEntrySchema).sort((a, b) =>
    a.loggedAt.localeCompare(b.loggedAt),
  );
}

/** Einträge ab einem Tag (einschließlich), z. B. für „Zuletzt verwendet“ und den Verlauf. */
export async function listEntriesSince(db: AppDb, fromDayKey: string): Promise<FoodLogEntry[]> {
  const rows = await db.foodLog.where('dayKey').aboveOrEqual(fromDayKey).toArray();
  return parseRows<FoodLogEntry>(rows, 'food_log_entry', foodLogEntrySchema);
}

export async function listTargets(db: AppDb): Promise<NutritionTarget[]> {
  return parseRows<NutritionTarget>(
    await db.nutritionTargets.toArray(),
    'nutrition_target',
    nutritionTargetSchema,
  );
}

export function useFoods(): Food[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listFoods(db), [db]);
}

export function useDayEntries(dayKey: string): FoodLogEntry[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listDayEntries(db, dayKey), [db, dayKey]);
}

export function useEntriesSince(fromDayKey: string): FoodLogEntry[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listEntriesSince(db, fromDayKey), [db, fromDayKey]);
}

export function useTargets(): NutritionTarget[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listTargets(db), [db]);
}

/** Rezepte (auch archivierte), alphabetisch. */
export async function listRecipes(db: AppDb): Promise<Recipe[]> {
  const recipes = parseRows<Recipe>(await db.recipes.toArray(), 'recipe', recipeSchema);
  return recipes.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export function useRecipes(): Recipe[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listRecipes(db), [db]);
}

/**
 * Rezept als Lebensmittel zum Eintragen (D-267): Nährwerte je 100 g des ganzen Rezepts und eine
 * Portion „Portion“ (Gesamtmenge geteilt durch die Portionen).
 */
export function toRecipeItem(recipe: Recipe): FoodItem {
  const totals = recipeTotals(recipe.ingredients, recipe.servings);
  const portion = Math.round((totals.grams / recipe.servings) * 10) / 10;
  return {
    id: recipe.id,
    name: recipe.name,
    aliases: [],
    basis: 'g',
    per100: totals.per100,
    servings:
      portion > 0 && portion <= 5000
        ? [{ id: stableId(`recipe-portion:${recipe.id}`), name: 'Portion', amount: portion }]
        : [],
    source: 'recipe',
    quality: 'user',
    ...(recipe.favorite ? { favorite: true } : {}),
    ...(recipe.archivedAt ? { archivedAt: recipe.archivedAt } : {}),
  };
}
