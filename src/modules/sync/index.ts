// Öffentliche Schnittstelle des Moduls „sync“ (Synchronisierung mit Supabase, D-269).
import { lazy } from 'react';

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
