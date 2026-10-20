import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';

/**
 * Einkaufsliste (D-287): ein Dokument je Artikel, damit zwei Geräte gleichzeitig abhaken können.
 * Nur Planung: Artikel zählen nie als gegessen (kein Bezug zum Ernährungstagebuch).
 */
export const SHOPPING_SCHEMA_VERSION = 1;
export const SHOPPING_NAME_MAX = 80;
export const SHOPPING_NOTE_MAX = 200;

export const SHOPPING_CATEGORIES = [
  'produce',
  'meat',
  'dairy',
  'grains',
  'frozen',
  'drinks',
  'supplements',
  'household',
  'other',
] as const;
export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export const SHOPPING_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'Stück',
  'Packung',
  'Flasche',
  'Dose',
] as const;

export const shoppingItemSchema = defineDocSchema('shopping_item', {
  name: z.string().trim().min(1).max(SHOPPING_NAME_MAX),
  quantity: z.number().positive().max(100_000).optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  category: z.enum(SHOPPING_CATEGORIES).optional(),
  note: z.string().trim().max(SHOPPING_NOTE_MAX).optional(),
  /** Gekauft seit; fehlt, solange der Artikel offen ist. */
  doneAt: isoDateTimeSchema.optional(),
  /** „Gekaufte entfernen“: nicht mehr auf der Liste, bleibt für „Zuletzt gekauft“. */
  clearedAt: isoDateTimeSchema.optional(),
  position: z.number().int().min(0),
});

export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type ShoppingItemData = DocData<ShoppingItem>;
