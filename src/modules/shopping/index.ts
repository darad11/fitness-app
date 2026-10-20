// Öffentliche Schnittstelle des Moduls „shopping“ (Einkaufsliste, D-287). Rechnung und Dienste
// werden erst bei Bedarf geladen, damit die Startansicht klein bleibt.
import type { DbRuntime } from '@/shared/db';
import type { ShoppingItem } from './model/shoppingItem';
import type { ShoppingLine } from './service/shoppingService';

export { shoppingRoutes } from './routes';
export { useShoppingItems } from './data/useShopping';
export type { ShoppingLine } from './service/shoppingService';

/** Noch zu kaufen (nicht gekauft, nicht entfernt). */
export function isShoppingItemOpen(item: ShoppingItem): boolean {
  return item.doneAt === undefined && item.clearedAt === undefined;
}

/** Zeilen (z. B. Rezept-Zutaten) auf die Liste, gleiche zusammengerechnet. */
export async function addShoppingLines(
  rt: DbRuntime,
  lines: readonly ShoppingLine[],
): Promise<{ added: number; merged: number }> {
  const { addLines } = await import('./service/shoppingService');
  return addLines(rt, lines);
}
