// Öffentliche Schnittstelle des Moduls „habits" (Tagesaufgaben).
import type { DocDef, RootFields } from '@/shared/db';
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

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Tagesaufgaben und ihre Einträge.
 * Erst bei Bedarf geladen, damit die Startansicht nicht wächst.
 */
export async function habitDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/habitRepository');
  return [m0.habitDef, m0.habitLogDef];
}
