import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { localTimeZone } from '@/shared/lib/time';
import { uuidv4 } from '@/shared/lib/uuid';
import { foodLogDef, mealTemplateDef } from '../data/nutritionRepository';
import { TEMPLATE_LIMITS, type MealTemplate, type TemplateItem } from '../model/mealTemplate';
import { FOOD_NAME_MAX, type FoodLogEntry, type MealSlot } from '../model/nutrition';
import type { Clock } from './nutritionService';

export class InvalidTemplateError extends Error {
  override name = 'InvalidTemplateError';
  constructor(readonly reason: 'name' | 'items') {
    super(`Ungültige Vorlage: ${reason}`);
  }
}

function cleanName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > TEMPLATE_LIMITS.name) throw new InvalidTemplateError('name');
  return clean;
}

/** Eintrag als Vorlagenposten mit denselben eingefrorenen Werten. */
function toItem(entry: FoodLogEntry): TemplateItem {
  return {
    id: uuidv4(),
    kind: entry.kind,
    ...(entry.foodId ? { foodId: entry.foodId } : {}),
    // Vorlagen kennen kein eigenes Markenfeld (strenges Schema auf älteren Geräten): Die Marke
    // steht dort wie früher in Klammern am Namen (D-278).
    nameSnapshot: (entry.brandSnapshot
      ? `${entry.nameSnapshot} (${entry.brandSnapshot})`
      : entry.nameSnapshot
    ).slice(0, FOOD_NAME_MAX),
    ...(entry.basisSnapshot ? { basisSnapshot: entry.basisSnapshot } : {}),
    ...(entry.amount !== undefined ? { amount: entry.amount } : {}),
    ...(entry.servingSnapshot ? { servingSnapshot: { ...entry.servingSnapshot } } : {}),
    nutrients: { ...entry.nutrients },
    isEstimated: entry.isEstimated,
  };
}

/** Vorlage aus den Einträgen einer Mahlzeit (NU-11, D-268), in ihrer Reihenfolge. */
export async function createTemplateFromEntries(
  rt: DbRuntime,
  name: string,
  entries: readonly FoodLogEntry[],
): Promise<MealTemplate> {
  if (entries.length === 0 || entries.length > TEMPLATE_LIMITS.items) {
    throw new InvalidTemplateError('items');
  }
  return insertDoc(rt, mealTemplateDef, { name: cleanName(name), items: entries.map(toItem) });
}

export async function renameTemplate(
  rt: DbRuntime,
  id: string,
  name: string,
): Promise<MealTemplate> {
  const clean = cleanName(name);
  return updateDoc(rt, mealTemplateDef, id, (current) => ({ ...current, name: clean }));
}

export async function deleteTemplate(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, mealTemplateDef, id);
}

export async function restoreTemplate(rt: DbRuntime, id: string): Promise<void> {
  await restoreDoc(rt, mealTemplateDef, id);
}

/**
 * Trägt alle Posten einer Vorlage in eine Mahlzeit ein, in einer Transaktion: entweder alle oder
 * keiner. Werte und Mengen kommen unverändert aus der Vorlage.
 */
export async function applyTemplate(
  rt: DbRuntime,
  template: MealTemplate,
  target: { slot: MealSlot; dayKey: string },
  clock: Clock = {},
): Promise<FoodLogEntry[]> {
  const now = (clock.now ?? (() => new Date()))();
  const tz = localTimeZone();
  return rt.db.transaction('rw', rt.db.foodLog, rt.db.meta, async () => {
    const created: FoodLogEntry[] = [];
    for (const [index, item] of template.items.entries()) {
      const { id: _id, ...data } = item;
      created.push(
        await insertDoc(rt, foodLogDef, {
          ...data,
          dayKey: target.dayKey,
          tz,
          slot: target.slot,
          // Je Posten eine Millisekunde später, damit die Reihenfolge erhalten bleibt.
          loggedAt: new Date(now.getTime() + index).toISOString(),
        }),
      );
    }
    return created;
  });
}
