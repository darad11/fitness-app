/**
 * Öffnen der Datenbank beim Start: Snapshot vor einem Upgrade, Geräte-ID, HLC-Zustand.
 */
import { HybridClock, NODE_PATTERN } from '../lib/hlc';
import { META_KEYS, getMetaValue, setMetaValue } from './meta';
import { AppDb, DB_NAME, DB_VERSION } from './schema';
import { snapshotBeforeUpgradeIfNeeded } from './snapshots';

export interface DbRuntime {
  readonly db: AppDb;
  /** Zufällige Kennung dieses Speichers (8 hex). Browser-Tab und installierte App haben je eine eigene. */
  readonly deviceId: string;
  readonly clock: HybridClock;
  /**
   * Nach jedem über das Basis-Repository gespeicherten Dokument, in einer eigenen Aufgabe
   * (außerhalb der Transaktion). Die App fordert damit dauerhaften Speicher an (A-07).
   */
  readonly onDocumentWritten?: () => void;
}

export interface OpenRuntimeOptions {
  name?: string;
  snapshotDbName?: string;
  createDeviceId?: () => string;
  onVersionChange?: () => void;
  onDocumentWritten?: () => void;
}

export function generateDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function openRuntime(options: OpenRuntimeOptions = {}): Promise<DbRuntime> {
  const name = options.name ?? DB_NAME;
  const snapshotOptions = options.snapshotDbName ? { snapshotDbName: options.snapshotDbName } : {};
  await snapshotBeforeUpgradeIfNeeded(name, DB_VERSION, snapshotOptions);

  const db = new AppDb(name);
  if (options.onVersionChange) {
    const notify = options.onVersionChange;
    db.on('versionchange', () => {
      notify();
    });
  }
  await db.open();

  const deviceId = await db.transaction('rw', db.meta, async () => {
    const existing = await getMetaValue(db, META_KEYS.deviceId);
    if (typeof existing === 'string' && NODE_PATTERN.test(existing)) return existing;
    const created = (options.createDeviceId ?? generateDeviceId)();
    if (!NODE_PATTERN.test(created)) throw new Error('Ungültige Geräte-ID');
    await setMetaValue(db, META_KEYS.deviceId, created);
    return created;
  });

  const clock = new HybridClock(deviceId);
  clock.observe(await getMetaValue(db, META_KEYS.hlc));
  return {
    db,
    deviceId,
    clock,
    ...(options.onDocumentWritten ? { onDocumentWritten: options.onDocumentWritten } : {}),
  };
}
