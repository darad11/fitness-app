/**
 * Migrationstests (AK-DAT-07, data-model.md Abschnitt 13): Für jede Schemaversion liegt eine
 * Datenbank der Vorversion als Fixture vor; das Öffnen mit der aktuellen Version muss alle
 * Dokumente erhalten. v1 → v2 (Schritt F) fügt die Tabellen `habits` und `habitLogs` hinzu;
 * vor dem Upgrade entsteht ein Snapshot (AK-DAT-06).
 */
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { seedLegacyDatabase } from '../testing/legacyDb';
import { AppDb, DB_VERSION, STORES_V1 } from './schema';
import { listSnapshots, snapshotBeforeUpgradeIfNeeded } from './snapshots';

const DB = 'fitness-migration-test';
const SNAPSHOTS = 'fitness-migration-test-snapshots';

const V1_ROWS = {
  sessions: [
    {
      id: '2fbd2e1c-8f6d-4f3e-9a8e-1f2a3b4c5d6e',
      type: 'session',
      schemaVersion: 1,
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T10:30:00.000Z',
      hlc: '00000000000000000000:00000000:a1b2c3d4',
      deletedAt: null,
      kind: 'strength',
      source: 'free',
      status: 'completed',
      title: 'Alt',
      dayKey: '2026-10-18',
      tz: 'Europe/Vienna',
      startedAt: '2026-10-18T10:00:00.000Z',
      endedAt: '2026-10-18T10:30:00.000Z',
      durationSec: 1800,
      pauses: [],
      exerciseIds: [],
      exercises: [],
    },
  ],
  meta: [{ key: 'deviceId', value: 'a1b2c3d4' }],
};

afterEach(async () => {
  await Dexie.delete(DB);
  await Dexie.delete(SNAPSHOTS);
});

describe('Migration auf Schemaversion ' + String(DB_VERSION), () => {
  it('sichert eine v1-Datenbank und öffnet sie als v2 verlustfrei', async () => {
    await seedLegacyDatabase(DB, 1, STORES_V1, V1_ROWS);
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'created',
    );
    expect((await listSnapshots({ snapshotDbName: SNAPSHOTS }))[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 1,
    });
    const db = new AppDb(DB);
    await db.open();
    try {
      expect(db.verno).toBe(DB_VERSION);
      expect(await db.habits.count()).toBe(0);
      expect(await db.habitLogs.count()).toBe(0);
      expect(await db.sessions.count()).toBe(1);
      expect((await db.sessions.get(V1_ROWS.sessions[0]!.id))?.title).toBe('Alt');
      expect((await db.meta.get('deviceId'))?.value).toBe('a1b2c3d4');
    } finally {
      db.close();
    }
  });

  it('erstellt bei aktueller Version keinen Snapshot', async () => {
    const db = new AppDb(DB);
    await db.open();
    db.close();
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'current',
    );
    expect(await listSnapshots({ snapshotDbName: SNAPSHOTS })).toHaveLength(0);
  });

  it('sichert vor einem Upgrade auf eine höhere Version einen Snapshot', async () => {
    await seedLegacyDatabase(DB, 1, STORES_V1, V1_ROWS);
    expect(
      await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION + 1, { snapshotDbName: SNAPSHOTS }),
    ).toBe('created');
    const snapshots = await listSnapshots({ snapshotDbName: SNAPSHOTS });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 1,
      counts: { sessions: 1, meta: 1 },
    });
  });
});
