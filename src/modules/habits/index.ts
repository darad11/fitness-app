// Öffentliche Schnittstelle des Moduls „habits" (Tagesaufgaben).
import { lazy } from 'react';
import type { DbRuntime } from '@/shared/db';
import type { DayKey } from '@/shared/lib/time';

export { habitsRoutes } from './routes';
/** Karte „Tagesaufgaben“ für „Heute“, erst bei Bedarf geladen (Platz in der Startansicht). */
export const TasksCard = lazy(async () => ({
  default: (await import('./ui/TasksCard')).TasksCard,
}));

/** Wasserziel heute erreicht: Aufgaben „mit Wasserziel abhaken“ abhaken (D-289); lädt bei Bedarf. */
export async function applyWaterAutoDone(rt: DbRuntime, today: DayKey): Promise<number> {
  const { applyWaterAutoDoneToday } = await import('./service/habitService');
  return applyWaterAutoDoneToday(rt, today);
}
