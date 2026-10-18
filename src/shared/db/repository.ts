/**
 * Basis-Repository für Dokumente (architecture.md Abschnitt 5, AK-DAT-11).
 *
 * Jede Änderung ist eine Transaktion „lesen, ändern, validieren, schreiben". Dabei setzt das
 * Repository ID, Typ, Schemaversion, Erstellzeit, HLC-Stempel und Geräte-ID und speichert den
 * Zustand der Uhr in derselben Transaktion. Gelöscht wird nur weich (Tombstone).
 *
 * Felder, die das Schema nicht kennt (z. B. von einer neueren App-Version), bleiben erhalten:
 * Gelesen und geschrieben wird „gespeicherte Felder, überschrieben durch das geprüfte Ergebnis".
 * Hinweis für spätere inhaltliche Migrationen: Umbenannte Felder müssen dort ausdrücklich
 * entfernt werden.
 */
import type { Table } from 'dexie';
import type { z } from 'zod';
import type { Hlc } from '../lib/hlc';
import { uuidv4 } from '../lib/uuid';
import type { DocData, RootFields } from './documents';
import { META_KEYS } from './meta';
import type { DbRuntime } from './runtime';
import type { AppDb, StoredDoc } from './schema';

export interface DocDef<T extends RootFields> {
  readonly type: T['type'];
  readonly schemaVersion: number;
  readonly schema: z.ZodType<T>;
  readonly table: (db: AppDb) => Table<StoredDoc, string>;
}

export type { DocData } from './documents';

export class DocNotFoundError extends Error {
  override name = 'DocNotFoundError';
}

export class DocExistsError extends Error {
  override name = 'DocExistsError';
}

/** Nächster Stempel; berücksichtigt den gespeicherten Zustand (Neustart, zweiter Tab). */
async function nextStamp(rt: DbRuntime): Promise<Hlc> {
  const stored = await rt.db.meta.get(META_KEYS.hlc);
  rt.clock.observe(stored?.value);
  const hlc = rt.clock.tick();
  await rt.db.meta.put({ key: META_KEYS.hlc, value: rt.clock.snapshot });
  return hlc;
}

function buildDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  id: string,
  data: DocData<T>,
  hlc: Hlc,
  createdAt: string,
): T {
  const candidate: Record<string, unknown> = {
    ...data,
    id,
    type: def.type,
    schemaVersion: def.schemaVersion,
    createdAt,
    hlc,
    deletedAt: null,
    deviceId: rt.deviceId,
  };
  delete candidate.deletedFrom;
  return validated(def, candidate);
}

/** Prüft mit dem Schema und behält unbekannte Felder. */
function validated<T extends RootFields>(def: DocDef<T>, candidate: Record<string, unknown>): T {
  return { ...candidate, ...def.schema.parse(candidate) };
}

function parseStored<T extends RootFields>(
  def: DocDef<T>,
  row: StoredDoc | undefined,
): T | undefined {
  if (!row) return undefined;
  if (row.type !== def.type) throw new Error(`Dokumenttyp ${row.type} statt ${def.type}`);
  return validated(def, row);
}

/** Legt ein neues Dokument an. Ohne `id` entsteht eine UUID v4. */
export async function insertDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  data: DocData<T>,
  id: string = uuidv4(),
): Promise<T> {
  const table = def.table(rt.db);
  return rt.db.transaction('rw', table, rt.db.meta, async () => {
    if (await table.get(id)) throw new DocExistsError('Dokument existiert bereits');
    const hlc = await nextStamp(rt);
    const doc = buildDoc(rt, def, id, data, hlc, new Date().toISOString());
    await table.add(doc);
    return doc;
  });
}

/**
 * Legt an oder ändert, z. B. für Singletons und deterministische IDs.
 * `mutate` erhält das aktive Dokument oder `undefined`, wenn es fehlt oder gelöscht ist.
 */
export async function upsertDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  id: string,
  mutate: (current: T | undefined) => DocData<T>,
): Promise<T> {
  const table = def.table(rt.db);
  return rt.db.transaction('rw', table, rt.db.meta, async () => {
    const stored = parseStored(def, await table.get(id));
    const active = stored && stored.deletedAt === null ? stored : undefined;
    const data = mutate(active);
    const hlc = await nextStamp(rt);
    const doc = buildDoc(rt, def, id, data, hlc, active?.createdAt ?? new Date().toISOString());
    await table.put(doc);
    return doc;
  });
}

/** Ändert ein bestehendes, nicht gelöschtes Dokument. */
export async function updateDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  id: string,
  mutate: (current: T) => DocData<T>,
): Promise<T> {
  return upsertDoc(rt, def, id, (current) => {
    if (!current) throw new DocNotFoundError('Dokument nicht gefunden');
    return mutate(current);
  });
}

/** Weiches Löschen: `deletedAt` erhält den HLC der Löschung, `deletedFrom` den Status davor. */
export async function softDeleteDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  id: string,
  deletedFrom?: string,
): Promise<void> {
  const table = def.table(rt.db);
  await rt.db.transaction('rw', table, rt.db.meta, async () => {
    const stored = parseStored(def, await table.get(id));
    if (!stored) throw new DocNotFoundError('Dokument nicht gefunden');
    if (stored.deletedAt !== null) return;
    const hlc = await nextStamp(rt);
    const candidate: Record<string, unknown> = {
      ...stored,
      hlc,
      deletedAt: hlc,
      deviceId: rt.deviceId,
    };
    if (deletedFrom) candidate.deletedFrom = deletedFrom;
    else delete candidate.deletedFrom;
    await table.put(validated(def, candidate));
  });
}

/** Hebt eine Löschung auf (z. B. „Rückgängig"). */
export async function restoreDoc<T extends RootFields>(
  rt: DbRuntime,
  def: DocDef<T>,
  id: string,
): Promise<T> {
  const table = def.table(rt.db);
  return rt.db.transaction('rw', table, rt.db.meta, async () => {
    const stored = parseStored(def, await table.get(id));
    if (!stored) throw new DocNotFoundError('Dokument nicht gefunden');
    if (stored.deletedAt === null) return stored;
    const hlc = await nextStamp(rt);
    const doc = buildDoc(rt, def, id, stored, hlc, stored.createdAt);
    await table.put(doc);
    return doc;
  });
}

/** Aktives Dokument oder `undefined` (gelöschte werden gefiltert). */
export async function getDoc<T extends RootFields>(
  db: AppDb,
  def: DocDef<T>,
  id: string,
): Promise<T | undefined> {
  const doc = parseStored(def, await def.table(db).get(id));
  return doc && doc.deletedAt === null ? doc : undefined;
}

/** Dokument einschließlich Tombstone, z. B. für Import und Export. */
export async function getDocIncludingDeleted<T extends RootFields>(
  db: AppDb,
  def: DocDef<T>,
  id: string,
): Promise<T | undefined> {
  return parseStored(def, await def.table(db).get(id));
}

/** Alle aktiven Dokumente des Typs. */
export async function listDocs<T extends RootFields>(db: AppDb, def: DocDef<T>): Promise<T[]> {
  const rows = await def
    .table(db)
    .filter((row) => row.type === def.type && row.deletedAt === null)
    .toArray();
  return rows.map((row) => validated(def, row));
}
