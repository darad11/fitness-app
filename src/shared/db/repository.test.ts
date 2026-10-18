import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { HLC_PATTERN, parseHlc } from '../lib/hlc';
import { createTestRuntime } from '../testing/db';
import { defineDocSchema, rootFieldsSchema } from './documents';
import { META_KEYS } from './meta';
import {
  DocExistsError,
  DocNotFoundError,
  getDoc,
  getDocIncludingDeleted,
  insertDoc,
  listDocs,
  restoreDoc,
  softDeleteDoc,
  updateDoc,
  upsertDoc,
  type DocDef,
} from './repository';
import { openRuntime, type DbRuntime } from './runtime';

const noteSchema = defineDocSchema('test_note', {
  text: z.string().min(1),
  count: z.number().int().min(0),
});
type Note = z.infer<typeof noteSchema>;

const noteDef: DocDef<Note> = {
  type: 'test_note',
  schemaVersion: 1,
  schema: noteSchema,
  table: (db) => db.bodyWeights,
};

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});

afterEach(async () => {
  vi.useRealTimers();
  await rt.db.delete();
});

describe('Basis-Repository', () => {
  it('setzt alle Basisfelder beim Anlegen (AK-DAT-11)', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'Hallo', count: 1 });
    expect(rootFieldsSchema.safeParse(doc).success).toBe(true);
    expect(doc).toMatchObject({
      type: 'test_note',
      schemaVersion: 1,
      deletedAt: null,
      deviceId: 'a1b2c3d4',
      text: 'Hallo',
    });
    expect(doc.id[14]).toBe('4');
    expect(HLC_PATTERN.test(doc.hlc)).toBe(true);
    expect(parseHlc(doc.hlc).node).toBe('a1b2c3d4');
    expect(await rt.db.bodyWeights.get(doc.id)).toEqual(doc);
  });

  it('lehnt eine bereits vergebene ID ab', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    await expect(insertDoc(rt, noteDef, { text: 'B', count: 0 }, doc.id)).rejects.toThrow(
      DocExistsError,
    );
  });

  it('ändert ein Dokument und behält ID und Erstellzeit', async () => {
    const created = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    const updated = await updateDoc(rt, noteDef, created.id, (current) => ({
      ...current,
      count: current.count + 1,
    }));
    expect(updated).toMatchObject({ id: created.id, createdAt: created.createdAt, count: 1 });
    expect(updated.hlc > created.hlc).toBe(true);
    await expect(updateDoc(rt, noteDef, crypto.randomUUID(), (c) => c)).rejects.toThrow(
      DocNotFoundError,
    );
  });

  it('schreibt bei ungültigen Werten nichts, auch nicht den Uhrzustand', async () => {
    const created = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    const clockBefore = (await rt.db.meta.get(META_KEYS.hlc))?.value;
    await expect(
      updateDoc(rt, noteDef, created.id, (current) => ({ ...current, count: -1 })),
    ).rejects.toThrow(ZodError);
    expect(await rt.db.bodyWeights.get(created.id)).toEqual(created);
    expect((await rt.db.meta.get(META_KEYS.hlc))?.value).toEqual(clockBefore);
  });

  it('löscht nur weich und filtert Tombstones', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    await softDeleteDoc(rt, noteDef, doc.id, 'in_progress');
    expect(await getDoc(rt.db, noteDef, doc.id)).toBeUndefined();
    expect(await listDocs(rt.db, noteDef)).toEqual([]);
    const tombstone = await getDocIncludingDeleted(rt.db, noteDef, doc.id);
    expect(tombstone?.deletedAt).toBe(tombstone?.hlc);
    expect(tombstone?.deletedFrom).toBe('in_progress');
    expect(await rt.db.bodyWeights.count()).toBe(1);
  });

  it('stellt ein gelöschtes Dokument wieder her', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    await softDeleteDoc(rt, noteDef, doc.id, 'completed');
    const restored = await restoreDoc(rt, noteDef, doc.id);
    expect(restored.deletedAt).toBeNull();
    expect(restored.deletedFrom).toBeUndefined();
    expect(restored.createdAt).toBe(doc.createdAt);
    expect(await listDocs(rt.db, noteDef)).toHaveLength(1);
  });

  it('legt über upsert an und behandelt Gelöschtes als fehlend', async () => {
    const id = crypto.randomUUID();
    const seen: (Note | undefined)[] = [];
    await upsertDoc(rt, noteDef, id, (current) => {
      seen.push(current);
      return { text: 'neu', count: 0 };
    });
    await softDeleteDoc(rt, noteDef, id);
    const revived = await upsertDoc(rt, noteDef, id, (current) => {
      seen.push(current);
      return { text: 'wieder da', count: 2 };
    });
    expect(seen).toEqual([undefined, undefined]);
    expect(revived).toMatchObject({ id, text: 'wieder da', deletedAt: null });
  });

  it('erhält Felder, die das Schema nicht kennt (neuere App-Version)', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    await rt.db.bodyWeights.put({ ...doc, futureField: { a: 1 } });
    const updated = await updateDoc(rt, noteDef, doc.id, (current) => ({ ...current, count: 5 }));
    expect(updated).toMatchObject({ count: 5, futureField: { a: 1 } });
    expect(await rt.db.bodyWeights.get(doc.id)).toMatchObject({ futureField: { a: 1 } });
  });

  it('meldet einen falschen Dokumenttyp unter der ID', async () => {
    const doc = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    await rt.db.bodyWeights.put({ ...doc, type: 'other' });
    await expect(getDoc(rt.db, noteDef, doc.id)).rejects.toThrow(/Dokumenttyp/);
    expect(await listDocs(rt.db, noteDef)).toEqual([]);
  });
});

describe('Änderungsstempel', () => {
  it('speichert den Uhrzustand und bleibt nach einem Neustart monoton', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T10:00:00.000Z'));
    const first = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    const name = rt.db.name;
    rt.db.close();

    // Geräteuhr springt zurück; ein neuer Start liest den gespeicherten Zustand.
    vi.setSystemTime(new Date('2026-10-18T09:00:00.000Z'));
    rt = await openRuntime({ name });
    const second = await insertDoc(rt, noteDef, { text: 'B', count: 0 });
    expect(second.hlc > first.hlc).toBe(true);
    expect(parseHlc(second.hlc).wallMs).toBe(Date.parse('2026-10-18T10:00:00.000Z'));
  });

  it('berücksichtigt Stempel eines zweiten Tabs mit derselben Datenbank', async () => {
    const otherTab = await openRuntime({ name: rt.db.name });
    const fromOther = await insertDoc(otherTab, noteDef, { text: 'B', count: 0 });
    // Die Uhr dieses Tabs liegt künstlich zurück; der gespeicherte Zustand gewinnt.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(parseHlc(fromOther.hlc).wallMs - 60_000));
    const mine = await insertDoc(rt, noteDef, { text: 'A', count: 0 });
    expect(mine.hlc > fromOther.hlc).toBe(true);
    otherTab.db.close();
  });
});
