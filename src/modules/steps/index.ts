// Öffentliche Schnittstelle des Moduls „steps“ (Schritte aus dem Dashboard, D-277).
import { lazy } from 'react';

export { stepsRoutes } from './routes';
/** Schritte-Karte für „Heute“, erst bei Bedarf geladen. */
export const StepsTodayCard = lazy(async () => ({
  default: (await import('./ui/StepsTodayCard')).StepsTodayCard,
}));
