// Öffentliche Schnittstelle des Moduls „steps“ (Schritte aus dem Dashboard, D-277).
import { lazy } from 'react';
import type { AppDb } from '@/shared/db';

export { stepsRoutes } from './routes';
/** Schritte-Karte für „Heute“, erst bei Bedarf geladen. */
export const StepsTodayCard = lazy(async () => ({
  default: (await import('./ui/StepsTodayCard')).StepsTodayCard,
}));

/**
 * Letzter Tag mit Schritten im Zwischenspeicher aus dem Dashboard (Rückkehr-Flow, D-319). Lädt
 * den Zwischenspeicher erst bei Bedarf, damit die Startansicht klein bleibt.
 */
export async function lastStepsDay(db: AppDb): Promise<string | null> {
  const { getStepsCache } = await import('./data/stepsState');
  const cache = await getStepsCache(db);
  let latest: string | null = null;
  for (const [day, steps] of Object.entries(cache?.entries ?? {})) {
    if (steps > 0 && (latest === null || day > latest)) latest = day;
  }
  return latest;
}
