// Öffentliche Schnittstelle des Moduls „water“ (Wasser, D-289). Karte, Rechnung und Dienste
// werden erst bei Bedarf geladen, damit die Startansicht klein bleibt.
import type { DocDef, RootFields } from '@/shared/db';
import { lazy } from 'react';
import type { AppDb } from '@/shared/db';
import type { DayKey } from '@/shared/lib/time';

export { waterRoutes } from './routes';

/** Wasser eines Tages mit Schnellmengen (für „Heute“ und die Ernährung). */
export const WaterCard = lazy(async () => ({
  default: (await import('./ui/WaterCard')).WaterCard,
}));

/** Ist das Wasserziel an dem Tag erreicht? Für „mit Wasserziel abhaken“ (Tagesaufgaben). */
export async function loadWaterReached(db: AppDb, day: DayKey): Promise<boolean> {
  const { waterReached } = await import('./service/waterService');
  return waterReached(db, day);
}

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Wasser. Erst bei Bedarf geladen,
 * damit die Startansicht nicht wächst.
 */
export async function waterDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/waterRepository');
  return [m0.waterEntryDef];
}
