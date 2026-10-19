// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRuntime } from '../testing/db';
import {
  BUNDLE_VERSIONS,
  backupFileName,
  buildBackup,
  deliverBackup,
  EXPORT_TYPES,
} from './export';
import { getMetaValue, META_KEYS } from './meta';
import { DOCUMENT_TABLES } from './schema';
import type { DbRuntime } from './runtime';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const NOW = new Date('2026-10-18T16:15:30.000Z');

describe('JSON-Export (AK-DAT-01, data-model.md Abschnitt 11)', () => {
  it('deckt alle Aggregattabellen ab und nennt die gebündelten Versionen', () => {
    expect(Object.keys(EXPORT_TYPES).sort()).toEqual([...DOCUMENT_TABLES].sort());
    expect(Object.keys(BUNDLE_VERSIONS).sort()).toEqual(['coreExercises', 'sampleTemplates']);
  });

  it('enthält Dokumente aller Typen inklusive Löschmarkierungen, aber keine Projektionen', async () => {
    const { startSession, discardSession } =
      await import('@/modules/training/service/sessionService');
    const { saveSettings } = await import('@/modules/settings');
    const kept = await startSession(rt, { source: 'free', title: 'Bleibt', exercises: [] });
    const { finishSession } = await import('@/modules/training/service/sessionService');
    await finishSession(rt, kept.id, { skipOpen: true });
    const gone = await startSession(rt, { source: 'free', title: 'Weg', exercises: [] });
    await discardSession(rt, gone.id);
    await saveSettings(rt, { restDefaultSec: 75 });

    const backup = await buildBackup(rt.db, rt.deviceId, { now: () => NOW, appVersion: '1.2.3' });
    expect(backup).toMatchObject({
      format: 'fitness-app-backup',
      formatVersion: 1,
      appVersion: '1.2.3',
      schemaVersion: 3,
      exportedAt: NOW.toISOString(),
      deviceId: 'a1b2c3d4',
    });
    expect(Object.keys(backup.data).sort()).toEqual([
      'body_weight',
      'exercise',
      'exercise_pref',
      'food',
      'food_log_entry',
      'goal',
      'habit',
      'habit_log',
      'nutrition_target',
      'profile',
      'program',
      'session',
      'settings',
      'training_state',
    ]);
    expect(
      backup.data.session
        ?.map((doc) => [String(doc.title), doc.deletedAt !== null] as const)
        .sort((a, b) => a[0].localeCompare(b[0])),
    ).toEqual([
      ['Bleibt', false],
      ['Weg', true],
    ]);
    expect(backup.data.settings).toHaveLength(1);
    expect(backup.data.settings?.[0]).toMatchObject({ type: 'settings', restDefaultSec: 75 });
    expect('exerciseHistory' in backup.data).toBe(false);
  });

  it('benennt die Datei nach lokalem Datum und Uhrzeit', () => {
    expect(backupFileName(new Date(2026, 9, 18, 16, 5))).toBe(
      'fitness-sicherung-2026-10-18-1605.json',
    );
  });

  it('teilt auf Geräten mit Teilen-Menü, lädt sonst herunter und merkt den Zeitpunkt', async () => {
    const backup = await buildBackup(rt.db, rt.deviceId, { now: () => NOW });
    const download = vi.fn();
    expect(
      await deliverBackup(rt.db, backup, 'a.json', {
        share: () => Promise.resolve(true),
        download,
      }),
    ).toBe('shared');
    expect(download).not.toHaveBeenCalled();
    expect(await getMetaValue(rt.db, META_KEYS.lastExportAt)).toBe(NOW.toISOString());

    expect(
      await deliverBackup(rt.db, backup, 'b.json', {
        share: () => Promise.resolve(null),
        download,
      }),
    ).toBe('downloaded');
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'b.json');
    const blob = download.mock.calls[0]?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toMatchObject({ format: 'fitness-app-backup' });

    await rt.db.meta.delete(META_KEYS.lastExportAt);
    expect(
      await deliverBackup(rt.db, backup, 'c.json', {
        share: () => Promise.resolve(false),
        download,
      }),
    ).toBe('cancelled');
    expect(await getMetaValue(rt.db, META_KEYS.lastExportAt)).toBeUndefined();
  });
});
