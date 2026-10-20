import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { guessCategory, isOpen, type ParsedEntry } from '../calc/entry';
import { listShoppingItems, shoppingItemDef } from '../data/shoppingRepository';
import {
  SHOPPING_NAME_MAX,
  SHOPPING_NOTE_MAX,
  type ShoppingCategory,
  type ShoppingItem,
} from '../model/shoppingItem';

export interface Clock {
  now?: () => Date;
}
const nowIso = (clock: Clock) => (clock.now ?? (() => new Date()))().toISOString();

export class InvalidItemError extends Error {
  override name = 'InvalidItemError';
}

export interface ItemInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  /** `null` heißt „ohne Kategorie“; fehlt das Feld beim Anlegen, wird geraten. */
  category?: ShoppingCategory | null;
  note?: string | null;
}

function clean(input: ItemInput) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (name.length === 0 || name.length > SHOPPING_NAME_MAX) {
    throw new InvalidItemError('Name fehlt oder ist zu lang');
  }
  const quantity =
    input.quantity !== undefined && input.quantity !== null && Number.isFinite(input.quantity)
      ? input.quantity
      : undefined;
  if (quantity !== undefined && (quantity <= 0 || quantity > 100_000)) {
    throw new InvalidItemError('Menge ungültig');
  }
  const unitText = input.unit?.trim() ?? '';
  const unit = unitText.length > 0 ? unitText : undefined;
  const noteText = input.note?.trim().slice(0, SHOPPING_NOTE_MAX) ?? '';
  const note = noteText.length > 0 ? noteText : undefined;
  return { name, quantity, unit, note };
}

/** Legt einen Artikel am Ende der offenen Liste an; Kategorie wird geraten, wenn keine kommt. */
export async function addItem(rt: DbRuntime, input: ItemInput): Promise<ShoppingItem> {
  const { name, quantity, unit, note } = clean(input);
  const category =
    input.category === undefined ? guessCategory(name) : (input.category ?? undefined);
  const existing = await listShoppingItems(rt.db);
  const position = Math.max(-1, ...existing.map((item) => item.position)) + 1;
  return insertDoc(rt, shoppingItemDef, {
    name,
    position,
    ...(quantity !== undefined ? { quantity } : {}),
    ...(unit ? { unit } : {}),
    ...(category ? { category } : {}),
    ...(note ? { note } : {}),
  });
}

export function addParsed(rt: DbRuntime, entry: ParsedEntry): Promise<ShoppingItem> {
  return addItem(rt, entry);
}

/** Ändert Name, Menge, Einheit, Kategorie und Notiz; leere Werte entfernen das Feld. */
export function updateItem(rt: DbRuntime, id: string, input: ItemInput): Promise<ShoppingItem> {
  const { name, quantity, unit, note } = clean(input);
  return updateDoc(rt, shoppingItemDef, id, (current) => {
    const { quantity: _q, unit: _u, note: _n, category: currentCategory, ...rest } = current;
    const category = input.category === undefined ? currentCategory : (input.category ?? undefined);
    return {
      ...rest,
      name,
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit ? { unit } : {}),
      ...(category ? { category } : {}),
      ...(note ? { note } : {}),
    };
  });
}

/** Menge zu einem offenen Artikel gleicher Einheit addieren (Doppelte zusammenführen). */
export function mergeQuantity(rt: DbRuntime, id: string, quantity: number): Promise<ShoppingItem> {
  return updateDoc(rt, shoppingItemDef, id, (current) => ({
    ...current,
    quantity: Math.round(((current.quantity ?? 0) + quantity) * 1000) / 1000,
  }));
}

/** Abhaken oder wieder öffnen. */
export function setItemDone(
  rt: DbRuntime,
  id: string,
  done: boolean,
  clock: Clock = {},
): Promise<ShoppingItem> {
  const at = nowIso(clock);
  return updateDoc(rt, shoppingItemDef, id, (current) => {
    const { doneAt: _d, clearedAt: _c, ...rest } = current;
    return done ? { ...rest, doneAt: current.doneAt ?? at } : rest;
  });
}

/** Einzelnen Artikel löschen (Löschmarkierung, „Rückgängig“ über `restoreItem`). */
export async function deleteItem(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, shoppingItemDef, id, 'active');
}

export function restoreItem(rt: DbRuntime, id: string): Promise<ShoppingItem> {
  return restoreDoc(rt, shoppingItemDef, id);
}

/**
 * „Gekaufte entfernen“: nur gekaufte, offene bleiben unberührt. Die Artikel verschwinden von der
 * Liste, bleiben aber für „Zuletzt gekauft“. Gibt die IDs für „Rückgängig“ zurück.
 */
export async function clearDone(rt: DbRuntime, clock: Clock = {}): Promise<string[]> {
  const at = nowIso(clock);
  const items = await listShoppingItems(rt.db);
  const done = items.filter((item) => item.doneAt !== undefined && item.clearedAt === undefined);
  await rt.db.transaction('rw', rt.db.shoppingItems, rt.db.meta, async () => {
    for (const item of done) {
      await updateDoc(rt, shoppingItemDef, item.id, (current) => ({ ...current, clearedAt: at }));
    }
  });
  return done.map((item) => item.id);
}

export async function undoClear(rt: DbRuntime, ids: readonly string[]): Promise<void> {
  await rt.db.transaction('rw', rt.db.shoppingItems, rt.db.meta, async () => {
    for (const id of ids) {
      await updateDoc(rt, shoppingItemDef, id, (current) => {
        const { clearedAt: _c, ...rest } = current;
        return rest;
      });
    }
  });
}

/** Offene Artikel zählen, z. B. für „Meine Küche“. */
export function openCount(items: readonly ShoppingItem[]): number {
  return items.filter(isOpen).length;
}
