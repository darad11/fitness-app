import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBodyWeight, listBodyWeights } from '@/modules/body';
import { loadCoreExercises } from '@/modules/exercises';
import { loadSettings, saveSettings } from '@/modules/settings';
import { finishSession, startSession } from '@/modules/training';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  buildBackup,
  EXPORT_TYPES,
  getMetaValue,
  listSnapshots,
  META_KEYS,
  type Backup,
  type DbRuntime,
  type DeliveryResult,
} from '@/shared/db';
import { createTestRuntime, uniqueName } from '@/shared/testing/db';
import { checkBackup, type CheckContext } from './calc/check';
import { keepLocalSession } from './calc/keep';
import { migrateDoc, migrateEnvelope } from './calc/migrate';
import { summarizeBackup } from './calc/summary';
import { loadDocKinds } from './data/kinds';
import type { CheckedBackup } from './model/backup';
import {
  beforeRestoreFileName,
  CurrentNotSavedError,
  hasLocalData,
  readBackupFile,
  restoreBackup,
  TrainingRunningError,
} from './service/restoreService';

let rt: DbRuntime;
let snapshotDbName: string;
const NOW = new Date('2026-10-23T16:15:00.000Z');

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  snapshotDbName = uniqueName('restore-snapshots');
});

afterEach(() => {
  rt.db.close();
});

function file(content: unknown): Blob {
  return new Blob([typeof content === 'string' ? content : JSON.stringify(content)], {
    type: 'application/json',
  });
}

/** Fachliche Felder je Art, ohne Stempel, Gerät und Löschzeit: Das ist „derselbe Stand“. */
function liveState(backup: Backup) {
  const state: Record<string, unknown[]> = {};
  for (const [type, docs] of Object.entries(backup.data)) {
    state[type] = docs
      .filter((doc) => doc.deletedAt === null)
      .map(({ hlc: _h, deviceId: _d, deletedAt: _x, ...rest }) => rest)
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  return state;
}

async function readOk(blob: Blob): Promise<CheckedBackup> {
  const result = await readBackupFile(rt.db, blob, NOW);
  if (!result.ok) throw new Error(`abgelehnt: ${result.rejection.reason}`);
  return result.backup;
}

const delivered = (result: DeliveryResult = 'downloaded') =>
  vi.fn((_backup: Backup, _name: string) => Promise.resolve(result));

/** Ein abgeschlossenes Training mit einer Übung; die Projektion bekommt dafür eine Zeile. */
async function training(title: string) {
  const [exercise] = await loadCoreExercises();
  if (!exercise) throw new Error('Keine Übung');
  const session = await startSession(rt, {
    source: 'free',
    title,
    exercises: [
      {
        exerciseId: exercise.id,
        name: exercise.name,
        trackingMode: exercise.trackingMode,
        sets: [{ type: 'working' }],
      },
    ],
  });
  await finishSession(rt, session.id, { skipOpen: true });
  return session;
}

/** Etwas von allem, was sich einfach anlegen lässt: Gewicht, Einstellungen, ein Training. */
async function someData() {
  await addBodyWeight(rt, { weightKg: 80.4, measuredAt: new Date('2026-10-20T07:00:00Z') });
  await addBodyWeight(rt, { weightKg: 80.1, measuredAt: new Date('2026-10-21T07:00:00Z') });
  await saveSettings(rt, { restDefaultSec: 120 });
  return training('Frei');
}

describe('Dokumentarten', () => {
  it('entsprechen genau den Arten und Tabellen des Exports', async () => {
    const kinds = await loadDocKinds(rt.db);
    const expected = Object.entries(EXPORT_TYPES).flatMap(([table, types]) =>
      types.map((type) => `${type}@${table}`),
    );
    expect([...kinds.values()].map((k) => `${k.type}@${k.table}`).sort()).toEqual(expected.sort());
  });
});

describe('Prüfen (D-345)', () => {
  async function context(): Promise<CheckContext> {
    return {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      dbVersion: rt.db.verno,
      kinds: await loadDocKinds(rt.db),
      now: NOW,
    };
  }

  it('nimmt einen Export an und zählt nur, was nicht gelöscht ist', async () => {
    const session = await someData();
    const backup = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const result = checkBackup(JSON.parse(JSON.stringify(backup)), await context());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const summary = summarizeBackup(result.backup);
    expect(summary).toMatchObject({
      trainings: 1,
      foodEntries: 0,
      tasks: 0,
      appVersion: backup.appVersion,
    });
    expect(summary.from).toBe('2026-10-20');
    expect(summary.to).toBe(session.dayKey > '2026-10-21' ? session.dayKey : '2026-10-21');
  });

  it('nimmt eine ältere Sicherung ohne neuere Arten an (fehlende Arten gelten als leer)', async () => {
    await someData();
    const backup = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const older = { ...backup, schemaVersion: 5, data: { ...backup.data } };
    delete older.data.water_entry;
    delete older.data.shopping_item;
    const result = checkBackup(JSON.parse(JSON.stringify(older)), await context());
    expect(result.ok).toBe(true);
  });

  it.each([
    ['keine Sicherung', { hallo: 'welt' }, 'foreign'],
    ['fremdes Format', { format: 'andere-app', formatVersion: 1 }, 'foreign'],
    ['Liste statt Objekt', [1, 2, 3], 'foreign'],
  ])('lehnt ab: %s', async (_name, raw, reason) => {
    expect(checkBackup(raw, await context())).toEqual({ ok: false, rejection: { reason } });
  });

  it('lehnt beschädigte, neuere und ungültige Sicherungen mit Grund ab', async () => {
    await someData();
    const backup = JSON.parse(
      JSON.stringify(await buildBackup(rt.db, rt.deviceId, { now: () => NOW })),
    ) as Backup;
    const ctx = await context();
    const reason = (raw: unknown) => {
      const result = checkBackup(raw, ctx);
      return result.ok
        ? 'ok'
        : `${result.rejection.reason}${result.rejection.type ? `:${result.rejection.type}` : ''}`;
    };
    const { data: _data, ...withoutData } = backup;
    expect(reason(withoutData)).toBe('damaged');
    expect(reason({ ...backup, exportedAt: 'gestern' })).toBe('damaged');
    expect(reason({ ...backup, exportedAt: '2026-10-25T16:15:00.000Z' })).toBe('damaged');
    expect(reason({ ...backup, formatVersion: BACKUP_FORMAT_VERSION + 1 })).toBe('newer');
    expect(reason({ ...backup, schemaVersion: rt.db.verno + 1 })).toBe('newer');
    expect(reason({ ...backup, data: { ...backup.data, photo: [] } })).toBe('newer');
    const weight = backup.data.body_weight![0]!;
    const withWeights = (docs: unknown[]) => ({
      ...backup,
      data: { ...backup.data, body_weight: docs },
    });
    expect(reason(withWeights([{ ...weight, weightKg: -5 }]))).toBe('invalid:body_weight');
    expect(reason(withWeights([{ ...weight, type: 'goal' }]))).toBe('invalid:body_weight');
    expect(reason(withWeights([weight, weight]))).toBe('invalid:body_weight');
    expect(reason(withWeights([{ ...weight, id: 'keine-uuid' }]))).toBe('invalid:body_weight');
    expect(reason(withWeights([{ ...weight, schemaVersion: 2 }]))).toBe('newer');
    expect(reason(withWeights(['text']))).toBe('invalid:body_weight');
    expect(
      checkBackup(withWeights([weight, { ...weight, id: crypto.randomUUID() }]), {
        ...ctx,
        maxDocs: 2,
      }),
    ).toEqual({ ok: false, rejection: { reason: 'damaged' } });
  });
});

describe('Migration älterer Fassungen', () => {
  const step = (doc: Record<string, unknown>) => ({ ...doc, renamed: doc.old, schemaVersion: 2 });

  it('hebt Dokumente Schritt für Schritt auf die aktuelle Fassung', () => {
    const doc = { type: 'demo', schemaVersion: 1, old: 'x' };
    expect(migrateDoc('demo', doc, 2, { demo: { 1: step } })).toEqual({
      type: 'demo',
      schemaVersion: 2,
      old: 'x',
      renamed: 'x',
    });
    expect(migrateDoc('demo', doc, 1, {})).toBe(doc);
  });

  it('ohne passenden Schritt wird abgelehnt statt geraten', () => {
    expect(() => migrateDoc('demo', { schemaVersion: 1 }, 2, {})).toThrow();
    expect(() =>
      migrateEnvelope(
        {
          format: 'f',
          formatVersion: 1,
          schemaVersion: 1,
          exportedAt: NOW.toISOString(),
          data: {},
        },
        2,
        {},
      ),
    ).toThrow();
  });
});

describe('Lesen der Datei', () => {
  it('lehnt keine JSON-Datei und zu große Dateien ab', async () => {
    expect(await readBackupFile(rt.db, file('{kaputt'), NOW)).toEqual({
      ok: false,
      rejection: { reason: 'notJson' },
    });
    const huge = { size: 60 * 1024 * 1024, text: () => Promise.resolve('{}') } as unknown as Blob;
    expect(await readBackupFile(rt.db, huge, NOW)).toEqual({
      ok: false,
      rejection: { reason: 'tooLarge' },
    });
  });

  it('beschädigte und fremde Dateien ändern nichts', async () => {
    await someData();
    const before = liveState(await buildBackup(rt.db, rt.deviceId));
    const clock = await getMetaValue(rt.db, META_KEYS.hlc);
    for (const content of ['{kaputt', '[]', { format: 'x' }, { format: BACKUP_FORMAT }]) {
      expect((await readBackupFile(rt.db, file(content), NOW)).ok).toBe(false);
    }
    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(before);
    expect(await getMetaValue(rt.db, META_KEYS.hlc)).toEqual(clock);
  });
});

describe('Wiederherstellen (D-345)', () => {
  it('Export, dann Import: derselbe Stand; was nur lokal lag, ist gelöscht markiert', async () => {
    const session = await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const blob = file(exported);

    // Danach ändert sich einiges: ein neues Gewicht, andere Einstellungen, ein weiteres Training.
    await addBodyWeight(rt, { weightKg: 79, measuredAt: new Date('2026-10-22T07:00:00Z') });
    await saveSettings(rt, { restDefaultSec: 60 });
    const later = await training('Später');
    expect(await rt.db.exerciseHistory.where('sessionId').equals(later.id).count()).toBe(1);

    const backup = await readOk(blob);
    const deliver = delivered();
    const before = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const result = await restoreBackup(rt, backup, { deliver, now: () => NOW, snapshotDbName });

    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(liveState(exported));
    expect(result).toMatchObject({ removed: 2, kept: 0, saved: 'downloaded' }); // Gewicht, Training
    expect((await listBodyWeights(rt.db)).map((w) => w.weightKg).sort()).toEqual([80.1, 80.4]);
    expect((await loadSettings(rt.db)).restDefaultSec).toBe(120);
    // Vorher gesichert, mit eigenem Namen, und ein Snapshot liegt vor.
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver.mock.calls[0]![1]).toBe(beforeRestoreFileName(NOW));
    expect(liveState(deliver.mock.calls[0]![0])).toEqual(liveState(before));
    const snapshots = await listSnapshots({ snapshotDbName });
    expect(snapshots.map((s) => s.reason)).toEqual(['import']);
    // Projektion: das spätere Training hat keine Zeilen mehr, das eingespielte seine.
    expect(await rt.db.exerciseHistory.where('sessionId').equals(later.id).count()).toBe(0);
    const tombstone = (await rt.db.sessions.get(later.id))!;
    expect(tombstone.deletedAt).not.toBeNull();
    expect(tombstone.deletedFrom).toBe('completed');
    expect((await rt.db.sessions.get(session.id))?.deletedAt).toBeNull();
    expect(await rt.db.exerciseHistory.where('sessionId').equals(session.id).count()).toBe(1);
    // Jedes eingespielte Dokument trägt einen neuen Stempel dieses Geräts (für die Synchronisierung).
    const restored = await rt.db.bodyWeights.toArray();
    for (const doc of restored) {
      expect(doc.deviceId).toBe(rt.deviceId);
      expect(doc.hlc > exported.data.body_weight![0]!.hlc).toBe(true);
    }
  });

  it('in eine leere Datenbank: danach alle Daten gleich, vorher nichts zu sichern (AK-DAT-02)', async () => {
    await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const empty = await createTestRuntime({ deviceId: 'e5e5e5e5' });
    try {
      expect(await hasLocalData(empty.db)).toBe(false);
      const deliver = delivered();
      const read = await readBackupFile(empty.db, file(exported), NOW);
      if (!read.ok) throw new Error(read.rejection.reason);
      const result = await restoreBackup(empty, read.backup, { deliver, snapshotDbName });
      expect(result.saved).toBeNull();
      expect(deliver).not.toHaveBeenCalled();
      expect(liveState(await buildBackup(empty.db, empty.deviceId))).toEqual(liveState(exported));
      expect(await hasLocalData(empty.db)).toBe(true);
      // Die Projektion entsteht neu: Verlauf und Vorwerte stimmen sofort.
      expect(await empty.db.exerciseHistory.count()).toBe(1);
    } finally {
      empty.db.close();
    }
  });

  it('ein zweites Mal eingespielt ändert sich am Stand nichts', async () => {
    await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    for (let i = 0; i < 2; i += 1) {
      await restoreBackup(rt, await readOk(file(exported)), {
        deliver: delivered(),
        snapshotDbName,
      });
    }
    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(liveState(exported));
  });

  it('während eines Trainings: nichts gesichert, nichts ersetzt', async () => {
    await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    await startSession(rt, { source: 'free', title: 'Läuft', exercises: [] });
    const before = liveState(await buildBackup(rt.db, rt.deviceId));
    const deliver = delivered();
    await expect(
      restoreBackup(rt, await readOk(file(exported)), { deliver, snapshotDbName }),
    ).rejects.toBeInstanceOf(TrainingRunningError);
    expect(deliver).not.toHaveBeenCalled();
    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(before);
    expect(await listSnapshots({ snapshotDbName })).toEqual([]);
  });

  it('bricht die Sicherung des aktuellen Stands ab, ersetzt es nichts', async () => {
    await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    await addBodyWeight(rt, { weightKg: 79, measuredAt: new Date('2026-10-22T07:00:00Z') });
    const before = liveState(await buildBackup(rt.db, rt.deviceId));
    await expect(
      restoreBackup(rt, await readOk(file(exported)), {
        deliver: delivered('cancelled'),
        snapshotDbName,
      }),
    ).rejects.toBeInstanceOf(CurrentNotSavedError);
    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(before);
    expect(await listSnapshots({ snapshotDbName })).toEqual([]);
  });

  it('alles oder nichts: scheitert ein Schritt mitten im Ersetzen, bleibt alles wie vorher', async () => {
    await someData();
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    await addBodyWeight(rt, { weightKg: 79, measuredAt: new Date('2026-10-22T07:00:00Z') });
    const before = liveState(await buildBackup(rt.db, rt.deviceId));
    const clock = await getMetaValue(rt.db, META_KEYS.hlc);
    // Die Uhr wird als Letztes in derselben Transaktion gespeichert; scheitert das, ist alles
    // davor ebenfalls zurückgenommen.
    const spy = vi.spyOn(rt.db.meta, 'put').mockRejectedValueOnce(new Error('Speicher voll'));
    await expect(
      restoreBackup(rt, await readOk(file(exported)), { deliver: delivered(), snapshotDbName }),
    ).rejects.toThrow('Speicher voll');
    spy.mockRestore();
    expect(liveState(await buildBackup(rt.db, rt.deviceId))).toEqual(before);
    expect(await getMetaValue(rt.db, META_KEYS.hlc)).toEqual(clock);
  });

  it('ein abgeschlossenes Training ersetzt keine laufende oder verworfene Fassung der Datei (K-01, K-03)', async () => {
    const running = await startSession(rt, { source: 'free', title: 'Frei', exercises: [] });
    const exported = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    await finishSession(rt, running.id, { skipOpen: true });
    const completed = (await rt.db.sessions.get(running.id))!;
    const result = await restoreBackup(rt, await readOk(file(exported)), {
      deliver: delivered(),
      snapshotDbName,
    });
    expect(result.kept).toBe(1);
    const after = (await rt.db.sessions.get(running.id))!;
    expect(after.status).toBe('completed');
    expect(after.deletedAt).toBeNull();
    expect(after.hlc).toBe(completed.hlc);
  });
});

describe('K-01 und K-03 beim Wiederherstellen', () => {
  const completed = { status: 'completed', deletedAt: null };
  it.each([
    ['laufende Fassung', { status: 'in_progress', deletedAt: null }, true],
    ['verworfene laufende Fassung', { deletedAt: 'x', deletedFrom: 'in_progress' }, true],
    ['abgeschlossene Fassung', { status: 'completed', deletedAt: null }, false],
    ['im Verlauf gelöscht (K-04)', { deletedAt: 'x', deletedFrom: 'completed' }, false],
  ])('abgeschlossen lokal gegen %s in der Datei', (_name, incoming, keep) => {
    expect(keepLocalSession(completed, incoming)).toBe(keep);
  });

  it('gilt nur für ein abgeschlossenes, nicht gelöschtes Training dieses Geräts', () => {
    const running = { status: 'in_progress', deletedAt: null };
    expect(keepLocalSession(running, running)).toBe(false);
    expect(keepLocalSession({ ...completed, deletedAt: 'x' }, running)).toBe(false);
  });
});
