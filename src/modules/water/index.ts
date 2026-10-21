// Öffentliche Schnittstelle des Moduls „water“ (Wasser, D-289). Karte, Rechnung und Dienste
// werden erst bei Bedarf geladen, damit die Startansicht klein bleibt.
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
