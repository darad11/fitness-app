/**
 * Fehlerprotokoll ohne Nutzdaten (architecture.md Abschnitt 7): Ringpuffer mit 500 Einträgen.
 * Gespeichert werden Fehlerart, bereinigte Meldung, Hash des Stacks, Route und App-Version.
 * Zahlen und Text in Anführungszeichen werden entfernt, IDs in Routen ersetzt.
 */
import { appInfo } from '../lib/env';
import { fnv1a32 } from '../lib/hash';
import type { AppDb, ErrorLogEntry } from './schema';

export const ERROR_LOG_LIMIT = 500;
const MEMORY_LIMIT = 50;
const MESSAGE_LIMIT = 300;
const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** Text zwischen zwei beliebigen Anführungszeichen, auch gemischt („…", "…", ‚…‘, «…»). */
const QUOTED_TEXT = /["'`„“”‚‘’«»][^"'`„“”‚‘’«»]*["'`„“”‚‘’«»]/g;

export function sanitizeMessage(message: string): string {
  return message
    .replace(UUID_IN_TEXT, ':id')
    .replace(QUOTED_TEXT, '"…"')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MESSAGE_LIMIT);
}

export function sanitizeRoute(route: string): string {
  const path = route.split(/[?#]/)[0] ?? '';
  return path.replace(UUID_IN_TEXT, ':id').replace(/\d+/g, '#');
}

export interface ErrorDescription {
  name: string;
  message: string;
  stackHash?: string;
}

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeMessage(`${error.name}: ${error.message}`),
      ...(error.stack ? { stackHash: fnv1a32(error.stack) } : {}),
    };
  }
  // Andere geworfene Werte könnten Nutzdaten enthalten; protokolliert wird nur ihre Art.
  return { name: 'Unbekannt', message: `Kein Error-Objekt (${typeof error})` };
}

export interface LogInput {
  level?: ErrorLogEntry['level'];
  area: string;
  error: unknown;
  route?: string;
}

const memoryLog: ErrorLogEntry[] = [];

/** Letzte Einträge im Arbeitsspeicher, z. B. wenn sich die Datenbank nicht öffnen lässt. */
export function recentErrors(): readonly ErrorLogEntry[] {
  return memoryLog;
}

export function buildEntry(input: LogInput, now: Date = new Date()): ErrorLogEntry {
  const description = describeError(input.error);
  return {
    at: now.toISOString(),
    level: input.level ?? 'error',
    area: input.area,
    message: description.message,
    ...(description.stackHash ? { stackHash: description.stackHash } : {}),
    ...(input.route ? { route: sanitizeRoute(input.route) } : {}),
    appVersion: appInfo.version,
  };
}

/** Schreibt einen Eintrag. Protokollieren darf nie selbst einen Fehler auslösen. */
export async function logError(
  db: AppDb | null,
  input: LogInput,
  limit: number = ERROR_LOG_LIMIT,
): Promise<void> {
  const entry = buildEntry(input);
  memoryLog.push(entry);
  if (memoryLog.length > MEMORY_LIMIT) memoryLog.splice(0, memoryLog.length - MEMORY_LIMIT);
  if (!db) return;
  try {
    await db.transaction('rw', db.errorLog, async () => {
      await db.errorLog.add(entry);
      const count = await db.errorLog.count();
      if (count > limit) {
        const oldest = await db.errorLog
          .toCollection()
          .limit(count - limit)
          .primaryKeys();
        await db.errorLog.bulkDelete(oldest);
      }
    });
  } catch {
    // Datenbank nicht verfügbar: Der Eintrag bleibt im Arbeitsspeicher.
  }
}

export async function listErrorLog(db: AppDb): Promise<ErrorLogEntry[]> {
  return db.errorLog.toArray();
}

/** Unbehandelte Fehler und abgelehnte Promises protokollieren. */
export function installGlobalErrorHandlers(getDb: () => AppDb | null): () => void {
  const route = () => window.location.pathname;
  const onError = (event: ErrorEvent) => {
    void logError(getDb(), {
      area: 'window',
      error: event.error ?? new Error(event.message),
      route: route(),
    });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    void logError(getDb(), { area: 'promise', error: event.reason, route: route() });
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
