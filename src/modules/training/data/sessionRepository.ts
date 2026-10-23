import Dexie from 'dexie';
import { getDoc, type AppDb, type DocDef } from '@/shared/db';
import { buildHistoryRows } from '../calc/history';
import { historyRowSchema, type HistoryRow } from '../model/history';
import { SESSION_SCHEMA_VERSION, sessionSchema, type Session } from '../model/session';

export const sessionDef: DocDef<Session> = {
  type: 'session',
  schemaVersion: SESSION_SCHEMA_VERSION,
  schema: sessionSchema,
  table: (db) => db.sessions,
};

export function getSession(db: AppDb, id: string): Promise<Session | undefined> {
  return getDoc(db, sessionDef, id);
}

/** Die laufende Einheit dieses Geräts, falls es eine gibt (AK-TRN-22). */
export async function findActiveSession(db: AppDb): Promise<Session | undefined> {
  const rows = await db.sessions.where('status').equals('in_progress').toArray();
  const live = rows.filter((row) => row.type === 'session' && row.deletedAt === null);
  live.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  const first = live[0];
  return first ? getSession(db, first.id) : undefined;
}

/**
 * Läuft gerade ein Training? Leichte Abfrage über den Index ohne Schemaprüfung, damit sie auch bei
 * einem ungültigen Dokument antwortet (Schutz vor automatischem Neuladen, E-16, D-343).
 */
export async function hasActiveSession(db: AppDb): Promise<boolean> {
  const rows = await db.sessions.where('status').equals('in_progress').toArray();
  return rows.some((row) => row.type === 'session' && row.deletedAt === null);
}

/** Abgeschlossene Einheiten, neueste zuerst (AK-HIS-01); ungültige Dokumente werden übergangen. */
export async function listCompletedSessions(db: AppDb): Promise<Session[]> {
  const rows = await db.sessions.where('status').equals('completed').toArray();
  const live = rows.filter((row) => row.type === 'session' && row.deletedAt === null);
  live.sort((a, b) =>
    String(b.endedAt ?? b.startedAt).localeCompare(String(a.endedAt ?? a.startedAt)),
  );
  return live.flatMap((row) => {
    const parsed = sessionSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Schreibt die Projektion einer Einheit neu; Aufruf innerhalb der Transaktion des Abschlusses. */
export async function writeHistory(db: AppDb, session: Session): Promise<void> {
  await db.exerciseHistory.where('sessionId').equals(session.id).delete();
  const rows = session.deletedAt === null ? buildHistoryRows(session) : [];
  if (rows.length > 0) await db.exerciseHistory.bulkPut(rows);
}

/**
 * Projektion einer Einheit nach einer Änderung von außen (Synchronisierung, D-269) neu aufbauen:
 * nur abgeschlossene, nicht gelöschte Einheiten haben Zeilen. Aufruf innerhalb einer
 * Transaktion mit `sessions` und `exerciseHistory`.
 */
export async function refreshSessionProjection(db: AppDb, sessionId: string): Promise<void> {
  const parsed = sessionSchema.safeParse(await db.sessions.get(sessionId));
  if (parsed.success && parsed.data.status === 'completed' && parsed.data.deletedAt === null) {
    await writeHistory(db, parsed.data);
  } else {
    await db.exerciseHistory.where('sessionId').equals(sessionId).delete();
  }
}

/**
 * Letzte abgeschlossene Einheit mit dieser Übung (AK-TRN-05), optional ohne eine bestimmte
 * Einheit (die laufende). Zeilen einer anderen Projektionsversion werden übergangen.
 */
export async function latestHistory(
  db: AppDb,
  exerciseId: string,
  excludeSessionId?: string,
): Promise<HistoryRow | undefined> {
  const rows = await db.exerciseHistory
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .reverse()
    .toArray();
  for (const row of rows) {
    if (row.sessionId === excludeSessionId) continue;
    const parsed = historyRowSchema.safeParse(row);
    if (parsed.success) return parsed.data;
  }
  return undefined;
}

/** Alle Zeilen der Projektion, neueste zuerst (Fortschritt, Bestleistungen). */
export async function listHistoryRows(db: AppDb): Promise<HistoryRow[]> {
  const rows = await db.exerciseHistory.toArray();
  const parsed = rows.flatMap((row) => {
    const result = historyRowSchema.safeParse(row);
    return result.success ? [result.data] : [];
  });
  parsed.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return parsed;
}
