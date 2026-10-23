import {
  DOCUMENT_TABLES,
  EXPORT_TYPES,
  META_KEYS,
  rootFieldsSchema,
  setMetaValue,
  type AppDb,
  type DbRuntime,
  type DocumentTableName,
  type StoredDoc,
} from '@/shared/db';
import { NODE_PATTERN } from '@/shared/lib/hlc';
import { searchKey } from '@/shared/lib/normalize';
import { uuidv4 } from '@/shared/lib/uuid';
import { decide } from '../calc/merge';
import { getCursor, SYNC_KEYS } from '../data/syncState';
import type { PushDoc, PushResult, RemoteRow, SyncResult } from '../model/sync';

/** Server, wie ihn der Abgleich braucht; in Tests durch einen Speicher im Arbeitsspeicher ersetzt. */
export interface Remote {
  pull(cursor: number, limit: number): Promise<RemoteRow[]>;
  push(docs: readonly PushDoc[]): Promise<PushResult>;
}

export interface SyncOptions {
  /** Abgeleitete Daten nach einer Änderung an einer Trainingseinheit neu aufbauen. */
  onSessionChanged?: (db: AppDb, sessionId: string) => Promise<void>;
  now?: () => Date;
}

const PULL_PAGE = 500;
const PUSH_CHUNK = 200;
const tables = new Set<string>(DOCUMENT_TABLES);

function isTable(name: string): name is DocumentTableName {
  return tables.has(name);
}

/**
 * Höchstlänge eines Namens in den Tabellen mit Konfliktkopie: Programme 80 Zeichen
 * (`PLAN_LIMITS.nameLength`), Rezepte 100 (`FOOD_NAME_MAX`). Die Kopie hält die kleinere ein (A-04).
 */
export const CONFLICT_NAME_MAX = 80;

/**
 * Name einer Konfliktkopie, z. B. „Push A (Konflikt 19.10.2026)“ (D-208). Ein langer Name wird so
 * gekürzt, dass die Kopie gültig bleibt; vorher war sie ab 59 Zeichen ungültig und unsichtbar (A-04).
 */
export function conflictName(name: unknown, now: Date): string {
  const day = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getFullYear())}`;
  const suffix = ` (Konflikt ${day})`;
  const base = typeof name === 'string' && name.trim() ? name.trim() : 'Ohne Namen';
  return `${base.slice(0, CONFLICT_NAME_MAX - suffix.length).trimEnd()}${suffix}`;
}

/**
 * Der Server enthält Dokumente, deren Tabelle oder Art diese App-Version nicht kennt. Sie stammen
 * von einer neueren Version; der Abgleich wartet vor ihnen auf das Update (D-292).
 */
export class AppOutdatedError extends Error {
  override name = 'AppOutdatedError';
}

/** Kennt diese App-Version Tabelle und Art der Zeile? */
function knownKind(row: RemoteRow): boolean {
  return isTable(row.doc_table) && EXPORT_TYPES[row.doc_table].includes(row.doc_type);
}

function validRemote(row: RemoteRow): StoredDoc | null {
  const root = rootFieldsSchema.safeParse(row.payload);
  if (!root.success) return null;
  const doc = row.payload as StoredDoc;
  if (doc.id !== row.doc_id || doc.hlc !== row.hlc || doc.type !== row.doc_type) return null;
  return doc;
}

async function persistClock(rt: DbRuntime) {
  await setMetaValue(rt.db, META_KEYS.hlc, rt.clock.snapshot);
}

/**
 * Holt alle Änderungen seit dem Cursor ab und führt sie mit den lokalen Fassungen zusammen.
 * Vor der ersten Zeile einer neueren App-Version bleibt der Cursor stehen, und der Abgleich endet
 * mit `AppOutdatedError`; nach dem Update geht es genau dort weiter (D-292).
 */
async function pull(rt: DbRuntime, remote: Remote, options: SyncOptions) {
  const { db } = rt;
  let pulled = 0;
  let conflicts = 0;
  let cursor = await getCursor(db);
  const now = (options.now ?? (() => new Date()))();
  for (;;) {
    const rows = await remote.pull(cursor, PULL_PAGE);
    if (rows.length === 0) break;
    // Ergebnis der Seite: steht eine Zeile einer neueren App-Version darin?
    const outdated = await db.transaction(
      'rw',
      [...DOCUMENT_TABLES.map((t) => db.table(t)), db.syncBase, db.meta, db.exerciseHistory],
      async () => {
        let maxHlc: string | undefined;
        /** `rev` der letzten verarbeiteten Zeile; der Cursor rückt nur bis hierher. */
        let seen: number | undefined;
        let stop = false;
        for (const row of rows) {
          if (!knownKind(row)) {
            stop = true;
            break;
          }
          seen = row.rev;
          const doc = validRemote(row);
          if (!doc || !isTable(row.doc_table)) continue;
          const table = db.table<StoredDoc, string>(row.doc_table);
          const local = await table.get(doc.id);
          const base = await db.syncBase.get(doc.id);
          const decision = decide(row.doc_table, local, doc, base?.hlc);
          if (!maxHlc || doc.hlc > maxHlc) maxHlc = doc.hlc;
          switch (decision.kind) {
            case 'same':
            case 'keep':
              // Basis ist jetzt die Serverfassung; eine jüngere lokale Fassung wird gesendet.
              await db.syncBase.put({ id: doc.id, hlc: doc.hlc });
              break;
            case 'restamp': {
              if (!local) break;
              const hlc = rt.clock.receive(doc.hlc);
              await table.put({ ...local, hlc, deviceId: rt.deviceId });
              await db.syncBase.put({ id: doc.id, hlc: doc.hlc });
              break;
            }
            case 'conflict': {
              if (local) {
                const copy: StoredDoc = {
                  ...local,
                  id: uuidv4(),
                  hlc: rt.clock.tick(),
                  deviceId: rt.deviceId,
                  name: conflictName(local.name, now),
                };
                if (typeof copy.nameNorm === 'string') copy.nameNorm = searchKey(String(copy.name));
                await table.put(copy);
                conflicts += 1;
              }
              await table.put(doc);
              await db.syncBase.put({ id: doc.id, hlc: doc.hlc });
              pulled += 1;
              if (row.doc_table === 'sessions') await options.onSessionChanged?.(db, doc.id);
              break;
            }
            case 'take':
              await table.put(doc);
              await db.syncBase.put({ id: doc.id, hlc: doc.hlc });
              pulled += 1;
              if (row.doc_table === 'sessions') await options.onSessionChanged?.(db, doc.id);
              break;
          }
        }
        // Die Uhr läuft danach vor allen gesehenen Stempeln, damit lokale Änderungen jünger sind.
        if (maxHlc) rt.clock.receive(maxHlc);
        await persistClock(rt);
        if (seen !== undefined) {
          cursor = seen;
          await setMetaValue(db, SYNC_KEYS.cursor, cursor);
        }
        return stop;
      },
    );
    if (outdated) throw new AppOutdatedError('Dokumente einer neueren App-Version auf dem Server');
    if (rows.length < PULL_PAGE) break;
  }
  return { pulled, conflicts };
}

/** Sendet alle Dokumente, deren HLC von der Basis abweicht. */
async function push(rt: DbRuntime, remote: Remote) {
  const { db } = rt;
  const base = new Map((await db.syncBase.toArray()).map((row) => [row.id, row.hlc]));
  const pending: PushDoc[] = [];
  const tableOf = new Map<string, DocumentTableName>();
  for (const name of DOCUMENT_TABLES) {
    for (const row of await db.table<StoredDoc, string>(name).toArray()) {
      if (base.get(row.id) === row.hlc) continue;
      tableOf.set(row.id, name);
      pending.push({
        doc_id: row.id,
        doc_table: name,
        doc_type: row.type,
        hlc: row.hlc,
        deleted: row.deletedAt !== null,
        schema_version: row.schemaVersion,
        payload: row,
        device_id:
          typeof row.deviceId === 'string' && NODE_PATTERN.test(row.deviceId)
            ? row.deviceId
            : rt.deviceId,
      });
    }
  }
  let pushed = 0;
  for (let i = 0; i < pending.length; i += PUSH_CHUNK) {
    const chunk = pending.slice(i, i + PUSH_CHUNK);
    const results = await remote.push(chunk);
    const sent = new Map(chunk.map((doc) => [doc.doc_id, doc.hlc]));
    await db.transaction(
      'rw',
      [...DOCUMENT_TABLES.map((t) => db.table(t)), db.syncBase],
      async () => {
        for (const result of results) {
          if (result.status !== 'accepted') continue;
          const name = tableOf.get(result.doc_id);
          const hlc = sent.get(result.doc_id);
          if (!name || !hlc) continue;
          // Nur wenn sich das Dokument seit dem Senden nicht geändert hat.
          const current = await db.table<StoredDoc, string>(name).get(result.doc_id);
          if (current?.hlc === hlc) await db.syncBase.put({ id: result.doc_id, hlc });
          pushed += 1;
        }
      },
    );
  }
  return { pushed };
}

/**
 * Ein Abgleich (D-269): erst abholen und zusammenführen, dann senden. Abholen zuerst, damit
 * Konflikte erkannt werden, bevor eine lokale Fassung den Server erreicht. Bricht das Abholen
 * wegen einer neueren App-Version ab, wird in diesem Lauf auch nichts gesendet (D-292).
 */
export async function syncOnce(
  rt: DbRuntime,
  remote: Remote,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { pulled, conflicts } = await pull(rt, remote, options);
  const { pushed } = await push(rt, remote);
  return { pulled, pushed, conflicts };
}

/** Anderer Nutzer als beim letzten Abgleich: Cursor und Basis zurücksetzen (Daten bleiben). */
export async function resetForUser(db: AppDb, userId: string): Promise<void> {
  await db.transaction('rw', db.syncBase, db.meta, async () => {
    const previous = (await db.meta.get(SYNC_KEYS.user))?.value;
    if (previous === userId) return;
    await db.syncBase.clear();
    await setMetaValue(db, SYNC_KEYS.cursor, 0);
    await setMetaValue(db, SYNC_KEYS.user, userId);
  });
}
