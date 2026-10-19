// Öffentliche Schnittstelle des Moduls „sync“ (Synchronisierung mit Supabase, D-269).
import { lazy } from 'react';

export { syncRoutes } from './routes';
/** Hintergrund-Abgleich; erst bei Bedarf geladen, arbeitet nur nach Anmeldung. */
export const SyncRunner = lazy(async () => ({
  default: (await import('./ui/SyncRunner')).SyncRunner,
}));
