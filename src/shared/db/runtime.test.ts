import { describe, expect, it } from 'vitest';
import { uniqueName } from '../testing/db';
import { META_KEYS } from './meta';
import { generateDeviceId, openRuntime } from './runtime';
import { listSnapshots } from './snapshots';

describe('openRuntime', () => {
  it('legt beim ersten Start eine Geräte-ID an und behält sie', async () => {
    const name = uniqueName('rt');
    const first = await openRuntime({ name });
    expect(first.deviceId).toMatch(/^[0-9a-f]{8}$/);
    expect((await first.db.meta.get(META_KEYS.deviceId))?.value).toBe(first.deviceId);
    first.db.close();

    const second = await openRuntime({ name });
    expect(second.deviceId).toBe(first.deviceId);
    await second.db.delete();
  });

  it('nutzt eine vorgegebene Geräte-ID und lehnt ungültige ab', async () => {
    const ok = await openRuntime({ name: uniqueName('rt'), createDeviceId: () => '0badc0de' });
    expect(ok.deviceId).toBe('0badc0de');
    await ok.db.delete();
    await expect(
      openRuntime({ name: uniqueName('rt'), createDeviceId: () => 'XYZ' }),
    ).rejects.toThrow();
  });

  it('erzeugt zufällige Geräte-IDs mit 8 Hex-Zeichen', () => {
    const ids = new Set(Array.from({ length: 50 }, generateDeviceId));
    expect([...ids].every((id) => /^[0-9a-f]{8}$/.test(id))).toBe(true);
    expect(ids.size).toBeGreaterThan(45);
  });

  it('legt beim ersten Öffnen keinen Snapshot an', async () => {
    const snapshotDbName = uniqueName('snap');
    const rt = await openRuntime({ name: uniqueName('rt'), snapshotDbName });
    expect(await listSnapshots({ snapshotDbName })).toEqual([]);
    await rt.db.delete();
  });
});
