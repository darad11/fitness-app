/**
 * JSON-Export aller Nutzdaten (AK-DAT-01, data-model.md Abschnitt 11): Dokumente aller
 * Aggregattabellen inklusive Löschmarkierungen, ohne Projektionen (die werden neu aufgebaut).
 * Auf iOS geht die Datei über das Teilen-Menü („In Dateien sichern“), sonst als Download.
 */
import { appInfo } from '../lib/env';
import { META_KEYS, setMetaValue } from './meta';
import { DOCUMENT_TABLES, type AppDb, type DocumentTableName, type StoredDoc } from './schema';

export const BACKUP_FORMAT = 'fitness-app-backup';
export const BACKUP_FORMAT_VERSION = 1;

/** Versionen der gebündelten Stammdaten; `export.test.ts` prüft sie gegen die Datendateien. */
export const BUNDLE_VERSIONS = { coreExercises: 1, sampleTemplates: 1 } as const;

/** Dokumenttypen des Exports je Tabelle; Singletons werden nach ihrem `type` aufgeteilt. */
export const EXPORT_TYPES: Record<DocumentTableName, readonly string[]> = {
  sessions: ['session'],
  programs: ['program'],
  exercises: ['exercise'],
  exercisePrefs: ['exercise_pref'],
  bodyWeights: ['body_weight'],
  goals: ['goal'],
  singletons: ['settings', 'profile', 'training_state'],
  habits: ['habit'],
  habitLogs: ['habit_log'],
};

export interface Backup {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  appVersion: string;
  schemaVersion: number;
  bundleVersions: typeof BUNDLE_VERSIONS;
  exportedAt: string;
  deviceId: string;
  data: Record<string, StoredDoc[]>;
}

export interface BuildBackupOptions {
  now?: () => Date;
  appVersion?: string;
}

/** Liest alle Dokumente in einer Lesetransaktion; Typen ohne Dokumente erscheinen als leere Liste. */
export async function buildBackup(
  db: AppDb,
  deviceId: string,
  options: BuildBackupOptions = {},
): Promise<Backup> {
  const data: Record<string, StoredDoc[]> = {};
  for (const types of Object.values(EXPORT_TYPES)) for (const type of types) data[type] = [];
  await db.transaction(
    'r',
    DOCUMENT_TABLES.map((name) => db.table(name)),
    async () => {
      for (const name of DOCUMENT_TABLES) {
        const rows = (await db.table(name).toArray()) as StoredDoc[];
        for (const row of rows) {
          const type = typeof row.type === 'string' ? row.type : name;
          (data[type] ??= []).push(row);
        }
      }
    },
  );
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: options.appVersion ?? appInfo.version,
    schemaVersion: db.verno,
    bundleVersions: BUNDLE_VERSIONS,
    exportedAt: (options.now?.() ?? new Date()).toISOString(),
    deviceId,
    data,
  };
}

/** Dateiname mit lokalem Datum und Uhrzeit, z. B. `fitness-sicherung-2026-10-18-1615.json`. */
export function backupFileName(now: Date = new Date()): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `fitness-sicherung-${String(now.getFullYear())}-${two(now.getMonth() + 1)}-${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}.json`;
}

export type DeliveryResult = 'shared' | 'downloaded' | 'cancelled';

export interface DeliveryOptions {
  /** Für Tests; Standard ist der Browser. */
  share?: (file: File) => Promise<boolean | null>;
  download?: (blob: Blob, fileName: string) => void;
}

interface ShareCapable {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

function canShareFile(file: File): boolean {
  const nav: ShareCapable = navigator;
  return typeof nav.share === 'function' && nav.canShare?.({ files: [file] }) === true;
}

/** Teilen-Menü, wenn der Browser Dateien teilen kann (iOS); sonst Download. `null` = nicht möglich. */
async function shareWithBrowser(file: File): Promise<boolean | null> {
  if (!canShareFile(file)) return null;
  try {
    await navigator.share({ files: [file], title: file.name });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    return null;
  }
}

function downloadWithBrowser(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}

/** Übergibt die Datei an Teilen oder Download und merkt den Zeitpunkt des Exports (AK-DAT-12). */
export async function deliverBackup(
  db: AppDb,
  backup: Backup,
  fileName: string,
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });
  const shared = await (options.share ?? shareWithBrowser)(file);
  let result: DeliveryResult;
  if (shared === true) result = 'shared';
  else if (shared === false) result = 'cancelled';
  else {
    (options.download ?? downloadWithBrowser)(blob, fileName);
    result = 'downloaded';
  }
  if (result !== 'cancelled') await setMetaValue(db, META_KEYS.lastExportAt, backup.exportedAt);
  return result;
}
