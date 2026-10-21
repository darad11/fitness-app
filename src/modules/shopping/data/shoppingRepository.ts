import { type AppDb, type DocDef } from '@/shared/db';
import {
  SHOPPING_SCHEMA_VERSION,
  shoppingItemSchema,
  type ShoppingItem,
} from '../model/shoppingItem';

export const shoppingItemDef: DocDef<ShoppingItem> = {
  type: 'shopping_item',
  schemaVersion: SHOPPING_SCHEMA_VERSION,
  schema: shoppingItemSchema,
  table: (db) => db.shoppingItems,
};

/** Alle nicht gelöschten Artikel nach Position, auch entfernte (für „Zuletzt gekauft“). */
export async function listShoppingItems(db: AppDb): Promise<ShoppingItem[]> {
  const rows = await db.shoppingItems.toArray();
  const items = rows.flatMap((row) => {
    if (row.type !== 'shopping_item' || row.deletedAt !== null) return [];
    const parsed = shoppingItemSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  items.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  return items;
}
