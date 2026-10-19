import Dexie from 'dexie';
import { useEffect } from 'react';
import { DOCUMENT_TABLES, useDb } from '@/shared/db';
import { useSyncView } from '../data/syncState';
import { isSyncing, syncNow } from '../service/syncService';

const DEBOUNCE_MS = 3000;
const INTERVAL_MS = 5 * 60_000;

/**
 * Automatischer Abgleich im Hintergrund (D-269), nur wenn angemeldet: beim Start, wenn das Netz
 * zurückkommt, beim Zurückkehren in die App, 3 s nach lokalen Änderungen und alle 5 Minuten.
 * Fehler landen im Status; der nächste Anlass versucht es erneut.
 */
export function SyncRunner() {
  const rt = useDb();
  const view = useSyncView();
  const signedIn = Boolean(view?.auth);

  useEffect(() => {
    if (!signedIn) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      if (!navigator.onLine) return;
      syncNow(rt).catch(() => undefined);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    const prefix = `idb://${rt.db.name}/`;
    const onMutated = (parts: Record<string, unknown>) => {
      // Eigene Schreibvorgänge des Abgleichs und lokale Tabellen lösen keinen neuen Abgleich aus.
      if (isSyncing()) return;
      const touched = Object.keys(parts).some((key) =>
        DOCUMENT_TABLES.some((table) => key.startsWith(`${prefix}${table}/`)),
      );
      if (touched) schedule();
    };
    run();
    window.addEventListener('online', run);
    document.addEventListener('visibilitychange', onVisible);
    Dexie.on('storagemutated', onMutated);
    const interval = setInterval(run, INTERVAL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('online', run);
      document.removeEventListener('visibilitychange', onVisible);
      Dexie.on('storagemutated').unsubscribe(onMutated);
    };
  }, [signedIn, rt]);

  return null;
}
