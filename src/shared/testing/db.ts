/**
 * Testhilfe: eigene Datenbank je Test (fake-indexeddb aus src/test-setup.ts),
 * damit Tests unabhängig voneinander laufen.
 */
import { openRuntime, type DbRuntime } from '../db/runtime';

let counter = 0;

export interface TestRuntimeOptions {
  deviceId?: string;
  name?: string;
}

export function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(counter)}-${crypto.randomUUID()}`;
}

export async function createTestRuntime(options: TestRuntimeOptions = {}): Promise<DbRuntime> {
  const { deviceId } = options;
  return openRuntime({
    name: options.name ?? uniqueName('test-db'),
    snapshotDbName: uniqueName('test-snapshots'),
    ...(deviceId ? { createDeviceId: () => deviceId } : {}),
  });
}
