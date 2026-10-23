// Öffentliche Schnittstelle des Moduls „shopping“ (Einkaufsliste, D-287). Rechnung und Dienste
// werden erst bei Bedarf geladen, damit die Startansicht klein bleibt.
import type { DocDef, RootFields } from '@/shared/db';
import type { DbRuntime } from '@/shared/db';
import type { ShoppingLine } from './service/shoppingService';

export { shoppingRoutes } from './routes';
export { useOpenShoppingCount } from './data/useOpenCount';
export type { ShoppingLine } from './service/shoppingService';

/** Zeilen (z. B. Rezept-Zutaten) auf die Liste, gleiche zusammengerechnet. */
export async function addShoppingLines(
  rt: DbRuntime,
  lines: readonly ShoppingLine[],
): Promise<{ added: number; merged: number }> {
  const { addLines } = await import('./service/shoppingService');
  return addLines(rt, lines);
}

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Einkaufsliste. Erst bei Bedarf
 * geladen, damit die Startansicht nicht wächst.
 */
export async function shoppingDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/shoppingRepository');
  return [m0.shoppingItemDef];
}
