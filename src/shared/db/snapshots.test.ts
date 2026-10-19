import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { createTestRuntime, uniqueName } from '../testing/db';
import { AppDb } from './schema';
import {
  createSnapshot,
  listSnapshots,
  readSnapshot,
  SNAPSHOT_KEEP,
  snapshotBeforeUpgradeIfNeeded,
} from './snapshots';

describe('Snapshots', () => {
  it('sichert alle Tabellen komprimiert und liest sie wieder', async () => {
    const rt = await createTestRuntime();
    await rt.db.meta.put({ key: 'probe', value: { n: 1 } });
    const snapshotDbName = uniqueName('snap');

    const info = await createSnapshot(rt.db, 'import', { snapshotDbName });
    expect(info).toMatchObject({ reason: 'import', encoding: 'gzip', sourceVersion: 6 });
    expect(info.bytes).toBeGreaterThan(0);
    expect(info.counts.meta).toBe(2); // deviceId und probe

    const payload = await readSnapshot(info.id, { snapshotDbName });
    expect(payload?.format).toBe('fitness-snapshot');
    expect(Object.keys(payload?.tables ?? {}).sort()).toEqual(
      rt.db.tables.map((t) => t.name).sort(),
    );
    expect(payload?.tables.meta).toContainEqual({ key: 'probe', value: { n: 1 } });
    await rt.db.delete();
  });

  it(`behält nur die letzten ${String(SNAPSHOT_KEEP)}`, async () => {
    const rt = await createTestRuntime();
    const snapshotDbName = uniqueName('snap');
    const created = [];
    for (let i = 0; i < SNAPSHOT_KEEP + 2; i++) {
      created.push(await createSnapshot(rt.db, 'delete-all', { snapshotDbName }));
    }
    const listed = await listSnapshots({ snapshotDbName });
    expect(listed).toHaveLength(SNAPSHOT_KEEP);
    expect(listed.map((s) => s.id)).toEqual(
      created
        .slice(-SNAPSHOT_KEEP)
        .map((s) => s.id)
        .reverse(),
    );
    await rt.db.delete();
  });

  it('sichert vor einem Schema-Upgrade nur, wenn eine ältere Version vorliegt', async () => {
    const snapshotDbName = uniqueName('snap');
    expect(await snapshotBeforeUpgradeIfNeeded(uniqueName('fehlt'), 1, { snapshotDbName })).toBe(
      'no-database',
    );

    const name = uniqueName('upgrade');
    const db = new AppDb(name);
    await db.open();
    await db.meta.put({ key: 'deviceId', value: 'a1b2c3d4' });
    db.close();

    expect(await snapshotBeforeUpgradeIfNeeded(name, 6, { snapshotDbName })).toBe('current');
    expect(await snapshotBeforeUpgradeIfNeeded(name, 7, { snapshotDbName })).toBe('created');

    const [snapshot] = await listSnapshots({ snapshotDbName });
    expect(snapshot).toMatchObject({ reason: 'schema-upgrade', sourceVersion: 6 });
    const payload = await readSnapshot(snapshot!.id, { snapshotDbName });
    expect(payload?.tables.meta).toContainEqual({ key: 'deviceId', value: 'a1b2c3d4' });

    // Die Prüfverbindung ist wieder geschlossen; die App kann normal öffnen.
    const reopened = new AppDb(name);
    await reopened.open();
    expect(reopened.isOpen()).toBe(true);
    await reopened.delete();
    expect(await Dexie.exists(name)).toBe(false);
  });
});
