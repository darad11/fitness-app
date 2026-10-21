// Öffentliche Schnittstelle des Moduls „shopping“ (Einkaufsliste, D-287). Rechnung und Dienste
// werden erst bei Bedarf geladen, damit die Startansicht klein bleibt.
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
