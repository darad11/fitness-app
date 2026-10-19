import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { searchKey } from '@/shared/lib/normalize';
import { dayKey as toDayKey, localTimeZone } from '@/shared/lib/time';
import { uuidv4 } from '@/shared/lib/uuid';
import { normalizeBarcode } from '../calc/barcode';
import { missingCore, scaleNutrients } from '../calc/nutrients';
import { activeTarget, type TargetValues } from '../calc/targets';
import { foodDef, foodLogDef, listTargets, nutritionTargetDef } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';
import {
  FOOD_NAME_MAX,
  NUTRIENT_LIMITS,
  NUTRIENTS,
  TARGET_LIMITS,
  type Food,
  type FoodBasis,
  type FoodLogEntry,
  type MealSlot,
  type NutritionTarget,
  type Nutrients,
  type TargetInputs,
} from '../model/nutrition';

export interface Clock {
  now?: () => Date;
}

const nowOf = (clock: Clock) => (clock.now ?? (() => new Date()))();

export class InvalidFoodError extends Error {
  override name = 'InvalidFoodError';
  constructor(readonly reason: 'name' | 'core' | 'range' | 'serving' | 'barcode') {
    super(`Ungültiges Lebensmittel: ${reason}`);
  }
}

export class InvalidEntryError extends Error {
  override name = 'InvalidEntryError';
  constructor(readonly reason: 'amount' | 'kcal' | 'range' | 'name') {
    super(`Ungültiger Eintrag: ${reason}`);
  }
}

export class InvalidTargetError extends Error {
  override name = 'InvalidTargetError';
}

// ---------------------------------------------------------------------------------------------
// Eigene Lebensmittel (NU-10)

export interface FoodInput {
  name: string;
  brand?: string;
  basis: FoodBasis;
  per100: Nutrients;
  servings?: readonly { name: string; amount: number }[];
  /** EAN/UPC; leer entfernt den Barcode. */
  barcode?: string;
}

function cleanPer100(per100: Nutrients): Nutrients {
  const result: Nutrients = {};
  for (const nutrient of NUTRIENTS) {
    const value = per100[nutrient];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0 || value > NUTRIENT_LIMITS[nutrient]) {
      throw new InvalidFoodError('range');
    }
    result[nutrient] = value;
  }
  if (missingCore(result).length > 0) throw new InvalidFoodError('core');
  return result;
}

function buildFood(input: FoodInput, previous?: Food) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > FOOD_NAME_MAX) throw new InvalidFoodError('name');
  const brand = input.brand?.trim();
  const servings = (input.servings ?? []).map((serving, i) => {
    const servingName = serving.name.trim();
    if (!servingName || !(serving.amount > 0) || serving.amount > 5000) {
      throw new InvalidFoodError('serving');
    }
    return {
      id: previous?.servings[i]?.id ?? uuidv4(),
      name: servingName.slice(0, 40),
      amount: Math.round(serving.amount * 10) / 10,
    };
  });
  if (servings.length > 10) throw new InvalidFoodError('serving');
  const rawBarcode = input.barcode?.trim();
  const barcode = rawBarcode ? normalizeBarcode(rawBarcode) : undefined;
  if (barcode === null) throw new InvalidFoodError('barcode');
  return {
    name,
    nameNorm: searchKey(name),
    ...(brand ? { brand: brand.slice(0, 60) } : {}),
    ...(barcode ? { barcode } : {}),
    basis: input.basis,
    per100: cleanPer100(input.per100),
    servings,
  };
}

export async function createFood(rt: DbRuntime, input: FoodInput): Promise<Food> {
  return insertDoc(rt, foodDef, {
    ...buildFood(input),
    source: 'custom',
    quality: 'user',
  });
}

/** Produkt aus Open Food Facts als eigenes Lebensmittel speichern (D-266): Quelle und Barcode. */
export async function createFoodFromOff(rt: DbRuntime, input: FoodInput): Promise<Food> {
  const built = buildFood(input);
  return insertDoc(rt, foodDef, {
    ...built,
    source: 'off',
    quality: 'community',
    ...(built.barcode ? { sourceRef: built.barcode } : {}),
  });
}

/** Ändert ein eigenes Lebensmittel; bestehende Protokolleinträge behalten ihre Werte (D-209). */
export async function updateFood(rt: DbRuntime, id: string, input: FoodInput): Promise<Food> {
  return updateDoc(rt, foodDef, id, (current) => {
    const { brand: _brand, barcode: _barcode, ...rest } = current;
    return { ...rest, ...buildFood(input, current) };
  });
}

export async function setFoodFavorite(rt: DbRuntime, id: string, favorite: boolean): Promise<Food> {
  return updateDoc(rt, foodDef, id, (current) => {
    const { favorite: _old, ...rest } = current;
    return favorite ? { ...rest, favorite: true } : rest;
  });
}

export async function setFoodArchived(
  rt: DbRuntime,
  id: string,
  archived: boolean,
  clock: Clock = {},
): Promise<Food> {
  const at = nowOf(clock).toISOString();
  return updateDoc(rt, foodDef, id, (current) => {
    const { archivedAt: _old, ...rest } = current;
    return archived ? { ...rest, archivedAt: at } : rest;
  });
}

// ---------------------------------------------------------------------------------------------
// Protokoll (NU-05, NU-09, NU-15, NU-20)

export type Quantity =
  { kind: 'amount'; amount: number } | { kind: 'serving'; servingId: string; count: number };

export interface LogFoodInput {
  food: FoodItem;
  slot: MealSlot;
  dayKey: string;
  quantity: Quantity;
}

function resolveAmount(food: FoodItem, quantity: Quantity) {
  if (quantity.kind === 'amount') {
    if (!(quantity.amount > 0) || quantity.amount > 10_000) throw new InvalidEntryError('amount');
    return { amount: Math.round(quantity.amount * 10) / 10 };
  }
  const serving = food.servings.find((s) => s.id === quantity.servingId);
  if (!serving || !(quantity.count > 0) || quantity.count > 100) {
    throw new InvalidEntryError('amount');
  }
  const amount = Math.round(serving.amount * quantity.count * 10) / 10;
  if (amount > 10_000) throw new InvalidEntryError('amount');
  return { amount, servingSnapshot: { name: serving.name, count: quantity.count } };
}

/** Protokolliert ein Lebensmittel mit eingefrorenen Werten (D-209). */
export async function logFood(
  rt: DbRuntime,
  input: LogFoodInput,
  clock: Clock = {},
): Promise<FoodLogEntry> {
  const { amount, servingSnapshot } = resolveAmount(input.food, input.quantity);
  const name = input.food.brand ? `${input.food.name} (${input.food.brand})` : input.food.name;
  return insertDoc(rt, foodLogDef, {
    dayKey: input.dayKey,
    tz: localTimeZone(),
    slot: input.slot,
    loggedAt: nowOf(clock).toISOString(),
    kind: input.food.source === 'recipe' ? 'recipe' : 'food',
    foodId: input.food.id,
    nameSnapshot: name.slice(0, FOOD_NAME_MAX),
    basisSnapshot: input.food.basis,
    amount,
    ...(servingSnapshot ? { servingSnapshot } : {}),
    nutrients: scaleNutrients(input.food.per100, amount),
    isEstimated: input.food.quality === 'estimated',
  });
}

export interface QuickInput {
  name?: string;
  slot: MealSlot;
  dayKey: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/** Schnelleintrag nur mit kcal und optional Makros; immer als Schätzung markiert (NU-20). */
export async function logQuick(
  rt: DbRuntime,
  input: QuickInput,
  clock: Clock = {},
): Promise<FoodLogEntry> {
  if (!(input.kcal >= 0) || input.kcal > 10_000) throw new InvalidEntryError('kcal');
  const nutrients: Nutrients = { kcal: Math.round(input.kcal) };
  for (const key of ['protein', 'carbs', 'fat'] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (!(value >= 0) || value > 1000) throw new InvalidEntryError('range');
    nutrients[key] = Math.round(value * 10) / 10;
  }
  const name = input.name?.trim();
  if (name && name.length > FOOD_NAME_MAX) throw new InvalidEntryError('name');
  return insertDoc(rt, foodLogDef, {
    dayKey: input.dayKey,
    tz: localTimeZone(),
    slot: input.slot,
    loggedAt: nowOf(clock).toISOString(),
    kind: 'quick',
    nameSnapshot: name === undefined || name === '' ? 'Schnelleintrag' : name,
    nutrients,
    isEstimated: true,
  });
}

/**
 * Neue Menge für einen Eintrag (NU-15): Nährwerte werden anteilig neu berechnet, weil sie linear
 * von der Menge abhängen; das Lebensmittel selbst wird nicht erneut gelesen.
 */
export async function changeEntry(
  rt: DbRuntime,
  id: string,
  change: { amount?: number; servingCount?: number; slot?: MealSlot },
): Promise<FoodLogEntry> {
  return updateDoc(rt, foodLogDef, id, (current) => {
    const next = { ...current };
    if (change.slot) next.slot = change.slot;
    let amount = current.amount;
    if (change.servingCount !== undefined && current.servingSnapshot && current.amount) {
      if (!(change.servingCount > 0) || change.servingCount > 100) {
        throw new InvalidEntryError('amount');
      }
      amount = (current.amount / current.servingSnapshot.count) * change.servingCount;
      next.servingSnapshot = { ...current.servingSnapshot, count: change.servingCount };
    } else if (change.amount !== undefined) {
      if (!(change.amount > 0) || change.amount > 10_000) throw new InvalidEntryError('amount');
      amount = change.amount;
      delete next.servingSnapshot;
    }
    if (amount !== undefined && current.amount && amount !== current.amount) {
      const factor = amount / current.amount;
      const nutrients: Nutrients = {};
      for (const nutrient of NUTRIENTS) {
        const value = current.nutrients[nutrient];
        if (value !== undefined) {
          nutrients[nutrient] = Math.round(value * factor * 100) / 100;
        }
      }
      next.nutrients = nutrients;
      next.amount = Math.round(amount * 10) / 10;
    }
    return next;
  });
}

export async function deleteEntry(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, foodLogDef, id);
}

export async function restoreEntry(rt: DbRuntime, id: string): Promise<void> {
  await restoreDoc(rt, foodLogDef, id);
}

// ---------------------------------------------------------------------------------------------
// Ziele (NU-01, NU-17)

function checkTarget(values: TargetValues): TargetValues {
  const rounded = {
    kcal: Math.round(values.kcal),
    proteinG: Math.round(values.proteinG),
    carbsG: Math.round(values.carbsG),
    fatG: Math.round(values.fatG),
  };
  if (rounded.kcal < TARGET_LIMITS.kcal.min || rounded.kcal > TARGET_LIMITS.kcal.max) {
    throw new InvalidTargetError('kcal');
  }
  for (const g of [rounded.proteinG, rounded.carbsG, rounded.fatG]) {
    if (!(g >= 0) || g > TARGET_LIMITS.grams.max) throw new InvalidTargetError('grams');
  }
  return rounded;
}

/**
 * Setzt das Tagesziel ab heute (wie die übrigen Ziele, AK-SET-01): Das bisherige endet, die
 * Historie bleibt. Gleiche Werte und Methode ändern nichts.
 */
export async function setNutritionTarget(
  rt: DbRuntime,
  values: TargetValues,
  options: { method: 'manual' | 'computed'; inputs?: TargetInputs },
  clock: Clock = {},
): Promise<NutritionTarget> {
  const checked = checkTarget(values);
  const now = nowOf(clock);
  const today = toDayKey(now, localTimeZone());
  return rt.db.transaction('rw', rt.db.nutritionTargets, rt.db.meta, async () => {
    const current = activeTarget(await listTargets(rt.db));
    if (
      current?.kcal === checked.kcal &&
      current.proteinG === checked.proteinG &&
      current.carbsG === checked.carbsG &&
      current.fatG === checked.fatG &&
      current.method === options.method &&
      JSON.stringify(current.inputsSnapshot) === JSON.stringify(options.inputs)
    ) {
      return current;
    }
    if (current) {
      await updateDoc(rt, nutritionTargetDef, current.id, (t) => ({
        ...t,
        endedAt: now.toISOString(),
      }));
    }
    return insertDoc(rt, nutritionTargetDef, {
      effectiveFrom: today,
      ...checked,
      method: options.method,
      ...(options.inputs ? { inputsSnapshot: options.inputs } : {}),
    });
  });
}

/** Für Tests und Anzeige: Tag eines Datums in lokaler Zeit. */
export function localDayKey(date: Date): string {
  return toDayKey(date, localTimeZone());
}
