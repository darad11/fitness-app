/**
 * Snapshots in einer eigenen Datenbank (D-217, data-model.md Abschnitt 5):
 * vollständige Kopie aller Tabellen, gzip-komprimiert über `CompressionStream`,
 * vor Schema-Upgrade, Import und „Alle Daten löschen". Die letzten fünf bleiben erhalten.
 *
 * Wiederherstellen folgt mit M1 bzw. M4 (AK-DAT-06, AK-DAT-08); hier liegt das Gerüst.
 */
import Dexie, { type Table } from 'dexie';
import { appInfo } from '../lib/env';
import { isPrivateMetaKey } from './meta';

export const SNAPSHOT_DB_NAME = 'fitness-snapshots';
export const SNAPSHOT_KEEP = 5;

export type SnapshotReason = 'schema-upgrade' | 'import' | 'delete-all';

export interface SnapshotInfo {
  id: number;
  createdAt: string;
  reason: SnapshotReason;
  appVersion: string;
  sourceDb: string;
  sourceVersion: number;
  encoding: 'gzip' | 'json';
  bytes: number;
  counts: Record<string, number>;
}

interface SnapshotRow extends Omit<SnapshotInfo, 'id'> {
  id?: number;
  payload: Uint8Array<ArrayBuffer>;
}

export interface SnapshotPayload {
  format: 'fitness-snapshot';
  formatVersion: 1;
  sourceDb: string;
  sourceVersion: number;
  createdAt: string;
  tables: Record<string, unknown[]>;
}

export interface SnapshotOptions {
  snapshotDbName?: string;
  keep?: number;
  now?: () => Date;
}

class SnapshotDb extends Dexie {
  declare snapshots: Table<SnapshotRow, number>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ snapshots: '++id, createdAt' });
  }
}

async function withSnapshotDb<T>(name: string, fn: (db: SnapshotDb) => Promise<T>): Promise<T> {
  const db = new SnapshotDb(name);
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

/**
 * Fügt ein; ist der Speicher voll (E-03), löscht `dropOldest` den ältesten Snapshot, und es folgt
 * ein zweiter Versuch. Vorher brach der Snapshot ab, und vor einem Schema-Upgrade blieb die App im
 * Wiederherstellungsbildschirm. Scheitert auch der zweite Versuch, bleibt es beim Fehler.
 */
export async function withQuotaRetry<T>(
  insert: () => Promise<T>,
  dropOldest: () => Promise<boolean>,
): Promise<T> {
  try {
    return await insert();
  } catch (error) {
    if (!isQuotaError(error) || !(await dropOldest())) throw error;
    return insert();
  }
}

/** Voller Speicher, auch verpackt in einem Fehler von Dexie (`inner`). */
function isQuotaError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth += 1) {
    if ((current as { name?: unknown }).name === 'QuotaExceededError') return true;
    current = (current as { inner?: unknown }).inner;
  }
  return false;
}

async function pipe(data: Uint8Array<ArrayBuffer>, transform: GenericTransformStream) {
  const stream = new Blob([data]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function encode(json: Uint8Array<ArrayBuffer>) {
  if (typeof CompressionStream === 'function') {
    return { encoding: 'gzip' as const, payload: await pipe(json, new CompressionStream('gzip')) };
  }
  return { encoding: 'json' as const, payload: json };
}

async function decode(row: SnapshotRow): Promise<SnapshotPayload> {
  const raw =
    row.encoding === 'gzip'
      ? await pipe(row.payload, new DecompressionStream('gzip'))
      : row.payload;
  return JSON.parse(new TextDecoder().decode(raw)) as SnapshotPayload;
}

function toInfo(row: SnapshotRow): SnapshotInfo {
  const { payload: _payload, id, ...info } = row;
  return { ...info, id: id ?? 0 };
}

/**
 * Liest alle Tabellen der Quelle in einer Lesetransaktion und legt den Snapshot ab.
 * Hinweis für R4: Binärdaten (Fotos) brauchen eine eigene Behandlung, JSON genügt dafür nicht.
 */
export async function createSnapshot(
  source: Dexie,
  reason: SnapshotReason,
  options: SnapshotOptions = {},
): Promise<SnapshotInfo> {
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  await source.transaction('r', source.tables, async () => {
    for (const table of source.tables) {
      const all = await table.toArray();
      // Zugänge bleiben draußen (D-02).
      const rows =
        table.name === 'meta'
          ? all.filter((row) => !isPrivateMetaKey((row as { key?: unknown }).key))
          : all;
      tables[table.name] = rows;
      counts[table.name] = rows.length;
    }
  });
  const createdAt = (options.now?.() ?? new Date()).toISOString();
  const content: SnapshotPayload = {
    format: 'fitness-snapshot',
    formatVersion: 1,
    sourceDb: source.name,
    sourceVersion: source.verno,
    createdAt,
    tables,
  };
  const { encoding, payload } = await encode(new TextEncoder().encode(JSON.stringify(content)));
  const row: SnapshotRow = {
    createdAt,
    reason,
    appVersion: appInfo.version,
    sourceDb: source.name,
    sourceVersion: source.verno,
    encoding,
    bytes: payload.byteLength,
    counts,
    payload,
  };
  const keep = options.keep ?? SNAPSHOT_KEEP;
  return withSnapshotDb(options.snapshotDbName ?? SNAPSHOT_DB_NAME, async (db) => {
    // Zuerst kürzen, dann einfügen: Der neue Snapshot braucht so keinen Platz neben dem ältesten.
    const insert = () =>
      db.transaction('rw', db.snapshots, async () => {
        const ids = await db.snapshots.toCollection().primaryKeys();
        const excess = ids.length - (keep - 1);
        if (excess > 0) await db.snapshots.bulkDelete(ids.slice(0, excess));
        return db.snapshots.add(row);
      });
    const id = await withQuotaRetry(insert, async () => {
      const first = (await db.snapshots.toCollection().primaryKeys())[0];
      if (first === undefined) return false;
      await db.snapshots.delete(first);
      return true;
    });
    return toInfo({ ...row, id });
  });
}

export async function listSnapshots(options: SnapshotOptions = {}): Promise<SnapshotInfo[]> {
  return withSnapshotDb(options.snapshotDbName ?? SNAPSHOT_DB_NAME, async (db) => {
    const rows = await db.snapshots.toArray();
    return rows.map(toInfo).reverse();
  });
}

export async function readSnapshot(
  id: number,
  options: SnapshotOptions = {},
): Promise<SnapshotPayload | undefined> {
  return withSnapshotDb(options.snapshotDbName ?? SNAPSHOT_DB_NAME, async (db) => {
    const row = await db.snapshots.get(id);
    return row ? decode(row) : undefined;
  });
}

export type UpgradeSnapshotResult = 'no-database' | 'current' | 'created';

/**
 * Vor dem Öffnen mit einer höheren Schemaversion: bestehende Datenbank in ihrer aktuellen
 * Version öffnen und sichern. Schlägt der Snapshot fehl, wird das Upgrade nicht ausgeführt.
 */
export async function snapshotBeforeUpgradeIfNeeded(
  dbName: string,
  targetVersion: number,
  options: SnapshotOptions = {},
): Promise<UpgradeSnapshotResult> {
  if (!(await Dexie.exists(dbName))) return 'no-database';
  const probe = new Dexie(dbName);
  try {
    await probe.open();
    if (probe.verno >= targetVersion) return 'current';
    await createSnapshot(probe, 'schema-upgrade', options);
    return 'created';
  } finally {
    probe.close();
  }
}
