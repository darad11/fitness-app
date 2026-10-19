// Öffentliche Schnittstelle des Moduls „nutrition" (Ernährung, Schritt G).
import { lazy } from 'react';

export { nutritionRoutes } from './routes';
/** Kurzkarte für „Heute“, erst bei Bedarf geladen. */
export const NutritionTodayCard = lazy(async () => ({
  default: (await import('./ui/NutritionPage')).NutritionTodayCard,
}));
