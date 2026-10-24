/**
 * Wiederherstellen aus dem Export (A-14, D-345): Datei lesen und prüfen, Zusammenfassung zeigen,
 * nach Bestätigung den aktuellen Stand als Datei sichern, einen Snapshot anlegen und alle
 * Dokumente in einer Transaktion ersetzen. Schlägt etwas fehl, bleibt die Datenbank unverändert.
 */
import { hasActiveSession, refreshSessionProjection } from '@/modules/training';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  buildBackup,
  createSnapshot,
  DOCUMENT_TABLES,
  replaceDocuments,
  requestPersistentStorage,
  type AppDb,
  type Backup,
  type DbRuntime,
  type DeliveryResult,
  type DocumentTableName,
  type ReplaceCounts,
  type StoredDoc,
} from '@/shared/db';
import { checkBackup } from '../calc/check';
import { keepLocalSession } from '../calc/keep';
import { summarizeBackup } from '../calc/summary';
import { loadDocKinds } from '../data/kinds';
import type { BackupSummary, CheckedBackup, Rejection } from '../model/backup';

/** Größere Dateien sind für eine Sicherung dieser App nicht plausibel. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type ReadResult =
  | { readonly ok: true; readonly backup: CheckedBackup; readonly summary: BackupSummary }
  | { readonly ok: false; readonly rejection: Rejection };

/** Liest und prüft eine gewählte Datei; ändert nichts an der Datenbank. */
export async function readBackupFile(db: AppDb, file: Blob, now = new Date()): Promise<ReadResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, rejection: { reason: 'tooLarge' } };
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return { ok: false, rejection: { reason: 'notJson' } };
  }
  const result = checkBackup(raw, {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    dbVersion: db.verno,
    kinds: await loadDocKinds(db),
    now,
  });
  return result.ok
    ? { ok: true, backup: result.backup, summary: summarizeBackup(result.backup) }
    : result;
}

/** Während eines Trainings wird nichts ersetzt (es liefe mitten im Satz weiter). */
export class TrainingRunningError extends Error {
  override name = 'TrainingRunningError';
}

/** Die Sicherung des aktuellen Stands wurde abgebrochen; ohne sie ersetzt FORM nichts. */
export class CurrentNotSavedError extends Error {
  override name = 'CurrentNotSavedError';
}

/** Dateiname der Sicherung vor dem Wiederherstellen, z. B. `…-vor-wiederherstellung-2026-10-23-1815.json`. */
export function beforeRestoreFileName(now: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `form-sicherung-vor-wiederherstellung-${String(now.getFullYear())}-${two(now.getMonth() + 1)}-${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}.json`;
}

/** Liegt auf diesem Gerät etwas, das nicht gelöscht ist? Sonst gibt es vorher nichts zu sichern. */
export async function hasLocalData(db: AppDb): Promise<boolean> {
  for (const name of DOCUMENT_TABLES) {
    const live = await db
      .table<StoredDoc, string>(name)
      .filter((doc) => doc.deletedAt === null)
      .first();
    if (live) return true;
  }
  return false;
}

function hasLiveDocs(backup: Backup): boolean {
  return Object.values(backup.data).some((docs) => docs.some((doc) => doc.deletedAt === null));
}

export interface RestoreOptions {
  /** Übergibt die Sicherung des aktuellen Stands (Teilen-Menü oder Download, `deliverBackup`). */
  deliver: (backup: Backup, fileName: string) => Promise<DeliveryResult>;
  now?: () => Date;
  /** Für Tests: Snapshot-Datenbank. */
  snapshotDbName?: string;
}

export interface RestoreResult extends ReplaceCounts {
  /** Wie der aktuelle Stand vorher gesichert wurde; `null`, wenn es nichts zu sichern gab. */
  saved: Exclude<DeliveryResult, 'cancelled'> | null;
}

function toTables(backup: CheckedBackup): Map<DocumentTableName, StoredDoc[]> {
  const tables = new Map<DocumentTableName, StoredDoc[]>();
  for (const name of DOCUMENT_TABLES) {
    tables.set(name, (backup.tables.get(name) ?? []) as StoredDoc[]);
  }
  return tables;
}

async function assertNoTraining(db: AppDb): Promise<void> {
  if (await hasActiveSession(db)) throw new TrainingRunningError();
}

/**
 * Ersetzt alle Daten durch die geprüfte Sicherung. Vorher: kein laufendes Training, der aktuelle
 * Stand als Datei übergeben (wenn es einen gibt), ein Snapshot. Dann eine Transaktion, alles oder
 * nichts; darin noch einmal die Prüfung auf ein laufendes Training.
 */
export async function restoreBackup(
  rt: DbRuntime,
  backup: CheckedBackup,
  options: RestoreOptions,
): Promise<RestoreResult> {
  await assertNoTraining(rt.db);
  const now = (options.now ?? (() => new Date()))();
  const current = await buildBackup(rt.db, rt.deviceId, { now: () => now });
  let saved: RestoreResult['saved'] = null;
  if (hasLiveDocs(current)) {
    const result = await options.deliver(current, beforeRestoreFileName(now));
    if (result === 'cancelled') throw new CurrentNotSavedError();
    saved = result;
  }
  await createSnapshot(rt.db, 'import', {
    now: () => now,
    ...(options.snapshotDbName ? { snapshotDbName: options.snapshotDbName } : {}),
  });
  const counts = await replaceDocuments(rt, toTables(backup), {
    guard: assertNoTraining,
    keep: (table, local, incoming) => table === 'sessions' && keepLocalSession(local, incoming),
    onSessionChanged: refreshSessionProjection,
  });
  // Die Daten der Sicherung liegen jetzt auf diesem Gerät (AK-PWA-05, A-07).
  void requestPersistentStorage();
  return { ...counts, saved };
}
