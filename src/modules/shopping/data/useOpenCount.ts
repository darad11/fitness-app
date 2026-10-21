import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';

/**
 * Anzahl noch offener Artikel (nicht gekauft, nicht entfernt), z. B. für „Meine Küche“. Zählt
 * direkt in der Tabelle, ohne Repository und Schema zu laden: Das hält die Startansicht klein
 * (D-288). Ungültige Zeilen filtert die Liste selbst; für die Zahl reicht der Typ.
 */
export function useOpenShoppingCount(): number | undefined {
  const { db } = useDb();
  return useLiveQuery(
    () =>
      db.shoppingItems
        .filter((row) => {
          const item = row as typeof row & { doneAt?: string; clearedAt?: string };
          return (
            item.type === 'shopping_item' &&
            item.deletedAt === null &&
            item.doneAt === undefined &&
            item.clearedAt === undefined
          );
        })
        .count(),
    [db],
  );
}
