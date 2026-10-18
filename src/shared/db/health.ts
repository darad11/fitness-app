/**
 * Schutz gegen Verbindungsverlust der IndexedDB in Safari (D-216, architecture.md Abschnitt 5):
 * Lesezugriff bei Rückkehr in den Vordergrund; schlägt er fehl, einmal neu öffnen;
 * gelingt auch das nicht, kontrolliert neu starten, bevor neue Eingaben möglich sind.
 */
import { META_KEYS } from './meta';
import type { AppDb } from './schema';

export type HealthResult = 'ok' | 'reopened' | 'failed';

/** Die Verbindung ist wiederholt verloren gegangen; Anlass für den Wiederherstellungsbildschirm. */
export class ConnectionLostError extends Error {
  override name = 'ConnectionLostError';
}

export const HEALTH_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Zeitüberschreitung'));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('Lesefehler'));
      },
    );
  });
}

async function probe(db: AppDb, timeoutMs: number): Promise<boolean> {
  try {
    await withTimeout(db.meta.get(META_KEYS.deviceId), timeoutMs);
    return true;
  } catch {
    return false;
  }
}

export async function checkDatabaseHealth(
  db: AppDb,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
): Promise<HealthResult> {
  if (await probe(db, timeoutMs)) return 'ok';
  try {
    db.close({ disableAutoOpen: false });
    await withTimeout(db.open(), timeoutMs);
  } catch {
    return 'failed';
  }
  return (await probe(db, timeoutMs)) ? 'reopened' : 'failed';
}

export interface HealthHandlers {
  onFailed: () => void;
  onReopened?: () => void;
}

/** Prüft bei `visibilitychange` (sichtbar) und `pageshow` aus dem Zwischenspeicher. */
export function watchDatabaseHealth(
  db: AppDb,
  handlers: HealthHandlers,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await checkDatabaseHealth(db, timeoutMs);
      if (result === 'failed') handlers.onFailed();
      else if (result === 'reopened') handlers.onReopened?.();
    } finally {
      running = false;
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') void run();
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) void run();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pageshow', onPageShow);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', onPageShow);
  };
}

const RESTART_KEY = 'fitness.restarts';
const RESTART_WINDOW_MS = 60_000;
const MAX_RESTARTS = 2;

export type RestartResult = 'reloading' | 'loop-detected';

/**
 * Lädt die App neu. Wurde in der letzten Minute schon zweimal neu gestartet, unterbleibt das,
 * damit keine Endlosschleife entsteht; dann zeigt die App den Wiederherstellungsbildschirm.
 */
export function controlledRestart(
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
  reload: () => void = () => {
    window.location.reload();
  },
  now: () => number = Date.now,
): RestartResult {
  let recent: number[] = [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(RESTART_KEY) ?? '[]');
    if (Array.isArray(parsed)) {
      recent = parsed.filter(
        (value): value is number => typeof value === 'number' && now() - value < RESTART_WINDOW_MS,
      );
    }
  } catch {
    recent = [];
  }
  if (recent.length >= MAX_RESTARTS) return 'loop-detected';
  try {
    storage.setItem(RESTART_KEY, JSON.stringify([...recent, now()]));
  } catch {
    // Ohne sessionStorage fehlt nur der Schleifenschutz.
  }
  reload();
  return 'reloading';
}
