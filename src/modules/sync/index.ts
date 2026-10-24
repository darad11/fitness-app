// Öffentliche Schnittstelle des Moduls „sync“ (Synchronisierung mit Supabase, D-269).
import { lazy } from 'react';
import type { AppDb } from '@/shared/db';

export { syncRoutes } from './routes';
/**
 * Hintergrund-Abgleich; erst bei Bedarf geladen, arbeitet nur nach Anmeldung. Scheitert das Laden
 * (offline, Seitenwechsel während des Ladens), bleibt die App bedienbar: ohne Abgleich bis zum
 * nächsten Start statt Fehleranzeige.
 */
export const SyncRunner = lazy(() =>
  import('./ui/SyncRunner').then(
    (module) => ({ default: module.SyncRunner }),
    () => ({ default: () => null }),
  ),
);

/**
 * Ist dieses Gerät mit der Synchronisierung angemeldet? Für den Hinweis beim Wiederherstellen aus
 * dem Export (D-345); lädt den Zustand erst bei Bedarf.
 */
export async function loadSyncSignedIn(db: AppDb): Promise<boolean> {
  const { getAuth } = await import('./data/syncState');
  return (await getAuth(db)) !== null;
}
