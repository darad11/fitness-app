// Öffentliche Schnittstelle des Moduls „habits" (Tagesaufgaben).
import { lazy } from 'react';

export { habitsRoutes } from './routes';
/** Karte „Tagesaufgaben“ für „Heute“, erst bei Bedarf geladen (Platz in der Startansicht). */
export const TasksCard = lazy(async () => ({
  default: (await import('./ui/TasksCard')).TasksCard,
}));
