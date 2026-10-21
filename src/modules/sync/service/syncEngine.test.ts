import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  defineDocSchema,
  insertDoc,
  softDeleteDoc,
  updateDoc,
  type DbRuntime,
  type DocDef,
  type StoredDoc,
} from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { getCursor } from '../data/syncState';
import type { PushDoc, PushResult, RemoteRow } from '../model/sync';
import { AppOutdatedError, conflictName, resetForUser, syncOnce, type Remote } from './syncEngine';

/** Server im Arbeitsspeicher mit denselben Regeln wie `push_documents` (jüngerer HLC gewinnt). */
class FakeServer {
  rows = new Map<string, RemoteRow & { device_id: string }>();
  private rev = 0;
  pushes = 0;

  remote(): Remote {
    return {
      pull: (cursor, limit) =>
        Promise.resolve(
          [...this.rows.values()]
            .filter((r) => r.rev > cursor)
            .sort((a, b) => a.rev - b.rev)
            .slice(0, limit)
            .map((r) => structuredClone(r)),
        ),
      push: (docs: readonly PushDoc[]) => {
        this.pushes += 1;
        const result: PushResult = docs.map((doc) => {
          const existing = this.rows.get(doc.doc_id);
          if (existing && !(existing.hlc < doc.hlc)) {
            return { doc_id: doc.doc_id, status: 'stale', rev: null };
          }
          this.rev += 1;
          this.rows.set(doc.doc_id, {
            doc_id: doc.doc_id,
            doc_table: doc.doc_table,
            doc_type: doc.doc_type,
            hlc: doc.hlc,
            deleted: doc.deleted,
            payload: structuredClone(doc.payload),
            rev: this.rev,
            device_id: doc.device_id,
          });
          return { doc_id: doc.doc_id, status: 'accepted', rev: this.rev };
        });
        return Promise.resolve(result);
      },
    };
  }
}

// Schlanke Dokumentdefinitionen für den Test; der Abgleich behandelt Dokumente generisch.
const weightSchema = defineDocSchema('body_weight', { weightKg: z.number() });
const weightDef: DocDef<z.infer<typeof weightSchema>> = {
  type: 'body_weight',
  schemaVersion: 1,
  schema: weightSchema,
  table: (db) => db.bodyWeights,
};
const programSchema = defineDocSchema('program', { name: z.string(), kind: z.string() });
const programDef: DocDef<z.infer<typeof programSchema>> = {
  type: 'program',
  schemaVersion: 1,
  schema: programSchema,
  table: (db) => db.programs,
};
const sessionSchema = defineDocSchema('session', { status: z.string(), title: z.string() });
const sessionDef: DocDef<z.infer<typeof sessionSchema>> = {
  type: 'session',
  schemaVersion: 1,
  schema: sessionSchema,
  table: (db) => db.sessions,
};

let a: DbRuntime;
let b: DbRuntime;
let server: FakeServer;
beforeEach(async () => {
  a = await createTestRuntime({ deviceId: 'aaaaaaaa' });
  b = await createTestRuntime({ deviceId: 'bbbbbbbb' });
  server = new FakeServer();
});
afterEach(async () => {
  await a.db.delete();
  await b.db.delete();
});

const sync = (rt: DbRuntime, onSessionChanged = vi.fn(() => Promise.resolve())) =>
  syncOnce(rt, server.remote(), { onSessionChanged, now: () => new Date(2026, 9, 19) });

describe('Abgleich (D-269)', () => {
  it('überträgt neue Dokumente, Änderungen und Löschungen in beide Richtungen', async () => {
    const weight = await insertDoc(a, weightDef, { weightKg: 80 });
    expect(await sync(a)).toEqual({ pulled: 0, pushed: 1, conflicts: 0 });
    expect(await sync(b)).toEqual({ pulled: 1, pushed: 0, conflicts: 0 });
    expect((await b.db.bodyWeights.get(weight.id))?.weightKg).toBe(80);

    await updateDoc(b, weightDef, weight.id, (w) => ({ ...w, weightKg: 79.5 }));
    expect(await sync(b)).toMatchObject({ pushed: 1 });
    expect(await sync(a)).toMatchObject({ pulled: 1, pushed: 0 });
    expect((await a.db.bodyWeights.get(weight.id))?.weightKg).toBe(79.5);

    await softDeleteDoc(a, weightDef, weight.id);
    await sync(a);
    await sync(b);
    expect((await b.db.bodyWeights.get(weight.id))?.deletedAt).not.toBeNull();

    // Nichts geändert: nichts gesendet.
    const before = server.pushes;
    expect(await sync(a)).toEqual({ pulled: 0, pushed: 0, conflicts: 0 });
    expect(server.pushes).toBe(before);
  });

  it('nimmt bei gleichzeitiger Änderung die jüngere Fassung und setzt die Uhr vor', async () => {
    const weight = await insertDoc(a, weightDef, { weightKg: 80 });
    await sync(a);
    await sync(b);
    await updateDoc(a, weightDef, weight.id, (w) => ({ ...w, weightKg: 81 }));
    await new Promise((r) => setTimeout(r, 5));
    await updateDoc(b, weightDef, weight.id, (w) => ({ ...w, weightKg: 82 }));
    await sync(a); // A sendet 81
    await sync(b); // B holt 81, hat aber die jüngere 82 → behält und sendet
    await sync(a); // A holt 82
    expect((await a.db.bodyWeights.get(weight.id))?.weightKg).toBe(82);
    expect((await b.db.bodyWeights.get(weight.id))?.weightKg).toBe(82);
    expect(server.rows.get(weight.id)?.payload.weightKg).toBe(82);
    // Eine neue Änderung auf A ist danach jünger als alles Gesehene.
    const next = await updateDoc(a, weightDef, weight.id, (w) => ({ ...w, weightKg: 83 }));
    expect(next.hlc > (server.rows.get(weight.id)?.hlc ?? '')).toBe(true);
  });

  it('legt bei Programmen eine Konfliktkopie an statt zu überschreiben (D-208)', async () => {
    const program = await insertDoc(a, programDef, { name: 'Push A', kind: 'own' });
    await sync(a);
    await sync(b);
    await updateDoc(a, programDef, program.id, (p) => ({ ...p, name: 'Push A schwer' }));
    await updateDoc(b, programDef, program.id, (p) => ({ ...p, name: 'Push A leicht' }));
    await sync(a);
    expect(await sync(b)).toMatchObject({ conflicts: 1 });
    await sync(a);
    const names = async (rt: DbRuntime) =>
      (await rt.db.programs.toArray()).map((p: StoredDoc) => p.name).sort();
    expect(await names(b)).toEqual(['Push A leicht (Konflikt 19.10.2026)', 'Push A schwer']);
    expect(await names(a)).toEqual(await names(b));
  });

  it('lässt eine abgeschlossene Einheit nie durch eine laufende Kopie ersetzen (K-01)', async () => {
    const session = await insertDoc(a, sessionDef, { status: 'in_progress', title: 'Push' });
    await sync(a);
    await sync(b);
    await updateDoc(a, sessionDef, session.id, (s) => ({ ...s, status: 'completed' }));
    await new Promise((r) => setTimeout(r, 5));
    // B ändert danach noch die laufende Fassung (jüngerer HLC).
    await updateDoc(b, sessionDef, session.id, (s) => ({ ...s, title: 'Push spät' }));
    const onA = vi.fn(() => Promise.resolve());
    await sync(a, onA);
    await sync(b);
    await sync(a, onA);
    expect((await b.db.sessions.get(session.id))?.status).toBe('completed');
    expect((await a.db.sessions.get(session.id))?.status).toBe('completed');
    expect(server.rows.get(session.id)?.payload.status).toBe('completed');

    // Abgeleitete Daten werden für abgeholte Einheiten neu aufgebaut.
    const onB = vi.fn(() => Promise.resolve());
    await updateDoc(a, sessionDef, session.id, (s) => ({ ...s, title: 'Push fertig' }));
    await sync(a);
    await sync(b, onB);
    expect(onB).toHaveBeenCalledWith(b.db, session.id);
  });

  it('löscht beim Verwerfen einer veralteten laufenden Kopie keine abgeschlossene Einheit (K-03)', async () => {
    const session = await insertDoc(a, sessionDef, { status: 'in_progress', title: 'Push' });
    await sync(a);
    await sync(b);
    await updateDoc(a, sessionDef, session.id, (s) => ({ ...s, status: 'completed' }));
    await new Promise((r) => setTimeout(r, 5));
    // B verwirft danach seine laufende Kopie (jüngerer HLC als der Abschluss auf A).
    await softDeleteDoc(b, sessionDef, session.id, 'in_progress');
    await sync(a);
    await sync(b);
    await sync(a);
    const onA = await a.db.sessions.get(session.id);
    const onB = await b.db.sessions.get(session.id);
    expect(onA).toMatchObject({ status: 'completed', deletedAt: null });
    expect(onB).toMatchObject({ status: 'completed', deletedAt: null });
    expect(server.rows.get(session.id)?.payload).toMatchObject({
      status: 'completed',
      deletedAt: null,
    });

    // Umgekehrt: Die Löschmarke erreicht den Server zuerst, A hat lokal abgeschlossen.
    const second = await insertDoc(a, sessionDef, { status: 'in_progress', title: 'Pull' });
    await sync(a);
    await sync(b);
    await updateDoc(a, sessionDef, second.id, (s) => ({ ...s, status: 'completed' }));
    await new Promise((r) => setTimeout(r, 5));
    await softDeleteDoc(b, sessionDef, second.id, 'in_progress');
    await sync(b);
    await sync(a);
    await sync(b);
    expect(await a.db.sessions.get(second.id)).toMatchObject({
      status: 'completed',
      deletedAt: null,
    });
    expect(await b.db.sessions.get(second.id)).toMatchObject({
      status: 'completed',
      deletedAt: null,
    });
    expect(server.rows.get(second.id)?.deleted).toBe(false);
  });

  it('übergeht ungültige Zeilen vom Server und rückt den Cursor darüber hinweg', async () => {
    const weight = await insertDoc(a, weightDef, { weightKg: 80 });
    await sync(a);
    const row = server.rows.get(weight.id);
    if (!row) throw new Error('fehlt');
    server.rows.set('x1', { ...row, doc_id: crypto.randomUUID(), rev: 101 }); // id passt nicht
    expect(await sync(b)).toMatchObject({ pulled: 1 });
    expect(await b.db.bodyWeights.count()).toBe(1);
    expect(await getCursor(b.db)).toBe(101);
  });

  it('hält vor Dokumenten einer neueren App-Version an, statt sie zu überspringen (D-292)', async () => {
    const weight = await insertDoc(a, weightDef, { weightKg: 80 });
    await sync(a);
    const row = server.rows.get(weight.id);
    if (!row) throw new Error('fehlt');
    // Eine neuere Version hat eine unbekannte Tabelle und danach ein weiteres Gewicht geschrieben.
    const futureId = crypto.randomUUID();
    server.rows.set('neu', {
      ...row,
      doc_id: futureId,
      doc_table: 'zukunftTabelle',
      doc_type: 'zukunft',
      payload: { ...row.payload, id: futureId },
      rev: 100,
    });
    const laterId = crypto.randomUUID();
    server.rows.set('danach', {
      ...row,
      doc_id: laterId,
      payload: { ...row.payload, id: laterId, weightKg: 81 },
      rev: 101,
    });
    await insertDoc(b, weightDef, { weightKg: 90 });
    const pushes = server.pushes;
    await expect(sync(b)).rejects.toBeInstanceOf(AppOutdatedError);
    // Bis zur unbekannten Zeile ist abgeglichen; der Cursor steht davor; nichts wurde gesendet.
    expect((await b.db.bodyWeights.get(weight.id))?.weightKg).toBe(80);
    expect(await b.db.bodyWeights.count()).toBe(2);
    expect(await getCursor(b.db)).toBe(row.rev);
    expect(server.pushes).toBe(pushes);
    await expect(sync(b)).rejects.toBeInstanceOf(AppOutdatedError);
    expect(await getCursor(b.db)).toBe(row.rev);

    // Nach dem Update kennt die App die Tabelle: beide Zeilen kommen an, dann wird gesendet.
    const future = server.rows.get('neu');
    if (!future) throw new Error('fehlt');
    server.rows.set('neu', { ...future, doc_table: 'bodyWeights', doc_type: 'body_weight' });
    expect(await sync(b)).toEqual({ pulled: 2, pushed: 1, conflicts: 0 });
    expect(await b.db.bodyWeights.count()).toBe(4);
    expect(await getCursor(b.db)).toBe(101);
    expect(server.pushes).toBe(pushes + 1);
  });

  it('setzt Cursor und Basis bei einem anderen Nutzer zurück, ohne Daten zu löschen', async () => {
    await insertDoc(a, weightDef, { weightKg: 80 });
    await resetForUser(a.db, '11111111-1111-4111-8111-111111111111');
    await sync(a);
    expect(await a.db.syncBase.count()).toBe(1);
    await resetForUser(a.db, '11111111-1111-4111-8111-111111111111');
    expect(await a.db.syncBase.count()).toBe(1);
    await resetForUser(a.db, '22222222-2222-4222-8222-222222222222');
    expect(await a.db.syncBase.count()).toBe(0);
    expect(await a.db.bodyWeights.count()).toBe(1);
  });

  it('benennt Konfliktkopien mit Datum', () => {
    expect(conflictName('Push A', new Date(2026, 9, 19))).toBe('Push A (Konflikt 19.10.2026)');
    expect(conflictName(undefined, new Date(2026, 0, 5))).toBe('Ohne Namen (Konflikt 05.01.2026)');
  });
});
