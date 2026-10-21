// Öffentliche Schnittstelle des Moduls „nutrition" (Ernährung, Schritt G).
import { lazy } from 'react';
import type { AppDb } from '@/shared/db';

export { nutritionRoutes } from './routes';
/** Kurzkarte für „Heute“, erst bei Bedarf geladen. */
export const NutritionTodayCard = lazy(async () => ({
  default: (await import('./ui/NutritionPage')).NutritionTodayCard,
}));

/**
 * Namen eigener, nicht archivierter Lebensmittel als Vorschläge für die Einkaufsliste (D-287).
 * Lädt das Repository erst bei Bedarf, damit die Startansicht nicht wächst.
 */
export async function loadOwnFoodNames(db: AppDb): Promise<string[]> {
  const { listFoods } = await import('./data/nutritionRepository');
  const foods = await listFoods(db);
  return [...new Set(foods.filter((food) => !food.archivedAt).map((food) => food.name))];
}
