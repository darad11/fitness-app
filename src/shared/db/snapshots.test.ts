import Dexie from 'dexie';
import { describe, expect, it, vi } from 'vitest';
import { createTestRuntime, uniqueName } from '../testing/db';
import { AppDb } from './schema';
import {
  createSnapshot,
  listSnapshots,
  readSnapshot,
  SNAPSHOT_KEEP,
  snapshotBeforeUpgradeIfNeeded,
  withQuotaRetry,
} from './snapshots';
import { isPrivateMetaKey } from './meta';

describe('Snapshots', () => {
  it('sichert alle Tabellen komprimiert und liest sie wieder', async () => {
    const rt = await createTestRuntime();
    await rt.db.meta.put({ key: 'probe', value: { n: 1 } });
    const snapshotDbName = uniqueName('snap');

    const info = await createSnapshot(rt.db, 'import', { snapshotDbName });
    expect(info).toMatchObject({ reason: 'import', encoding: 'gzip', sourceVersion: 8 });
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

    expect(await snapshotBeforeUpgradeIfNeeded(name, 8, { snapshotDbName })).toBe('current');
    expect(await snapshotBeforeUpgradeIfNeeded(name, 9, { snapshotDbName })).toBe('created');

    const [snapshot] = await listSnapshots({ snapshotDbName });
    expect(snapshot).toMatchObject({ reason: 'schema-upgrade', sourceVersion: 8 });
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

describe('Zugänge und voller Speicher (D-02, E-03)', () => {
  it('lässt Zugänge der Synchronisierung und der Schritte aus dem Snapshot heraus', async () => {
    const rt = await createTestRuntime();
    const snapshotDbName = uniqueName('snap');
    await rt.db.meta.bulkPut([
      { key: 'sync.auth', value: { refreshToken: 'geheim' } },
      { key: 'sync.cursor', value: 42 },
      { key: 'steps.dashboardAuth', value: { refreshToken: 'geheim' } },
      { key: 'steps.cache', value: { entries: {} } },
    ]);
    const info = await createSnapshot(rt.db, 'import', { snapshotDbName });
    const payload = await readSnapshot(info.id, { snapshotDbName });
    const keys = (payload?.tables.meta ?? []).map((row) => (row as { key: string }).key).sort();
    expect(keys).toEqual(['deviceId', 'sync.cursor']);
    expect(info.counts.meta).toBe(2);
    expect(JSON.stringify(payload)).not.toContain('geheim');
    await rt.db.delete();
  });

  it('erkennt private Schlüssel', () => {
    expect(isPrivateMetaKey('sync.auth')).toBe(true);
    expect(isPrivateMetaKey('steps.dashboardAuth')).toBe(true);
    expect(isPrivateMetaKey('sync.cursor')).toBe(false);
    expect(isPrivateMetaKey('hlc')).toBe(false);
    expect(isPrivateMetaKey(undefined)).toBe(false);
  });

  it('löscht bei vollem Speicher den ältesten Snapshot und versucht es einmal neu', async () => {
    const quota = Object.assign(new Error('voll'), { name: 'QuotaExceededError' });
    const insert = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(quota)
      .mockResolvedValueOnce(7);
    const dropOldest = vi.fn(() => Promise.resolve(true));
    await expect(withQuotaRetry(insert, dropOldest)).resolves.toBe(7);
    expect(dropOldest).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('erkennt den vollen Speicher auch in einem Fehler von Dexie', async () => {
    const wrapped = Object.assign(new Error('Abbruch'), {
      name: 'AbortError',
      inner: Object.assign(new Error('voll'), { name: 'QuotaExceededError' }),
    });
    const insert = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(wrapped)
      .mockResolvedValueOnce(1);
    await expect(withQuotaRetry(insert, () => Promise.resolve(true))).resolves.toBe(1);
  });

  it('wiederholt andere Fehler nicht und gibt auf, wenn nichts zu löschen ist', async () => {
    const other = new Error('kaputt');
    const dropOldest = vi.fn(() => Promise.resolve(true));
    await expect(withQuotaRetry(() => Promise.reject(other), dropOldest)).rejects.toBe(other);
    expect(dropOldest).not.toHaveBeenCalled();
    const quota = Object.assign(new Error('voll'), { name: 'QuotaExceededError' });
    await expect(
      withQuotaRetry(
        () => Promise.reject(quota),
        () => Promise.resolve(false),
      ),
    ).rejects.toBe(quota);
  });
});
