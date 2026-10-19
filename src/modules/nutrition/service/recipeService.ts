import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { searchKey } from '@/shared/lib/normalize';
import { uuidv4 } from '@/shared/lib/uuid';
import { recipeDef } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';
import { FOOD_NAME_MAX } from '../model/nutrition';
import { RECIPE_LIMITS, type Ingredient, type Recipe } from '../model/recipe';
import type { Clock, Quantity } from './nutritionService';

export class InvalidRecipeError extends Error {
  override name = 'InvalidRecipeError';
  constructor(readonly reason: 'name' | 'servings' | 'ingredients' | 'amount' | 'steps') {
    super(`Ungültiges Rezept: ${reason}`);
  }
}

/** Zutat aus einem Lebensmittel mit eingefrorenen Werten je 100 (D-267). Rezepte selbst nicht. */
export function ingredientFrom(food: FoodItem, quantity: Quantity): Ingredient {
  if (food.source === 'recipe') throw new InvalidRecipeError('ingredients');
  let amount: number;
  let servingSnapshot: Ingredient['servingSnapshot'];
  if (quantity.kind === 'amount') {
    amount = quantity.amount;
  } else {
    const serving = food.servings.find((s) => s.id === quantity.servingId);
    if (!serving || !(quantity.count > 0) || quantity.count > 100) {
      throw new InvalidRecipeError('amount');
    }
    amount = serving.amount * quantity.count;
    servingSnapshot = { name: serving.name, count: quantity.count };
  }
  if (!(amount > 0) || amount > RECIPE_LIMITS.amount) throw new InvalidRecipeError('amount');
  const name = food.brand ? `${food.name} (${food.brand})` : food.name;
  return {
    id: uuidv4(),
    foodId: food.id,
    nameSnapshot: name.slice(0, FOOD_NAME_MAX),
    basisSnapshot: food.basis,
    amount: Math.round(amount * 10) / 10,
    ...(servingSnapshot ? { servingSnapshot } : {}),
    per100Snapshot: { ...food.per100 },
  };
}

/** Neue Menge einer Zutat in Gramm bzw. Milliliter; die Portionsangabe entfällt dann. */
export function withAmount(ingredient: Ingredient, amount: number): Ingredient {
  if (!(amount > 0) || amount > RECIPE_LIMITS.amount) throw new InvalidRecipeError('amount');
  const { servingSnapshot: _old, ...rest } = ingredient;
  return { ...rest, amount: Math.round(amount * 10) / 10 };
}

export interface RecipeInput {
  name: string;
  servings: number;
  ingredients: readonly Ingredient[];
  steps?: string;
}

function buildRecipe(input: RecipeInput) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > FOOD_NAME_MAX) throw new InvalidRecipeError('name');
  if (
    !Number.isInteger(input.servings) ||
    input.servings < RECIPE_LIMITS.servings.min ||
    input.servings > RECIPE_LIMITS.servings.max
  ) {
    throw new InvalidRecipeError('servings');
  }
  if (input.ingredients.length === 0 || input.ingredients.length > RECIPE_LIMITS.ingredients) {
    throw new InvalidRecipeError('ingredients');
  }
  const steps = input.steps?.trim();
  if (steps && steps.length > RECIPE_LIMITS.steps) throw new InvalidRecipeError('steps');
  return {
    name,
    nameNorm: searchKey(name),
    servings: input.servings,
    ingredients: [...input.ingredients],
    ...(steps ? { steps } : {}),
  };
}

export async function createRecipe(rt: DbRuntime, input: RecipeInput): Promise<Recipe> {
  return insertDoc(rt, recipeDef, buildRecipe(input));
}

export async function updateRecipe(rt: DbRuntime, id: string, input: RecipeInput): Promise<Recipe> {
  return updateDoc(rt, recipeDef, id, (current) => {
    const { steps: _steps, ...rest } = current;
    return { ...rest, ...buildRecipe(input) };
  });
}

export async function setRecipeFavorite(
  rt: DbRuntime,
  id: string,
  favorite: boolean,
): Promise<Recipe> {
  return updateDoc(rt, recipeDef, id, (current) => {
    const { favorite: _old, ...rest } = current;
    return favorite ? { ...rest, favorite: true } : rest;
  });
}

export async function setRecipeArchived(
  rt: DbRuntime,
  id: string,
  archived: boolean,
  clock: Clock = {},
): Promise<Recipe> {
  const at = (clock.now ?? (() => new Date()))().toISOString();
  return updateDoc(rt, recipeDef, id, (current) => {
    const { archivedAt: _old, ...rest } = current;
    return archived ? { ...rest, archivedAt: at } : rest;
  });
}

/** Löschen mit Löschmarkierung; Protokolleinträge behalten ihre Werte (D-209). */
export async function deleteRecipe(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, recipeDef, id);
}

export async function restoreRecipe(rt: DbRuntime, id: string): Promise<void> {
  await restoreDoc(rt, recipeDef, id);
}
