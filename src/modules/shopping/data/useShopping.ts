import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { ShoppingItem } from '../model/shoppingItem';
import { listShoppingItems } from './shoppingRepository';

/** Artikel der Einkaufsliste, reaktiv; `undefined` beim Laden. */
export function useShoppingItems(): ShoppingItem[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listShoppingItems(db), [db]);
}
