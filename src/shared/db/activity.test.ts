// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestRuntime } from '../testing/db';
import { lastEntryDay } from './activity';
import type { DbRuntime } from './runtime';
import type { StoredDoc } from './schema';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

function doc(id: string, dayKey: string, deleted = false): StoredDoc {
  return {
    id,
    type: 'test',
    schemaVersion: 1,
    createdAt: `${dayKey}T10:00:00.000Z`,
    hlc: '0',
    deletedAt: deleted ? '1' : null,
    deviceId: 'a1b2c3d4',
    dayKey,
  };
}

describe('Letzter Tag mit Eintrag (Rückkehr-Flow, D-319)', () => {
  it('ist ohne Einträge leer', async () => {
    expect(await lastEntryDay(rt.db)).toBeNull();
  });

  it('nimmt den neuesten Tag über Training, Aufgaben, Ernährung, Wasser und Gewicht', async () => {
    await rt.db.sessions.put(doc('s', '2026-09-01'));
    await rt.db.habitLogs.put(doc('h', '2026-09-03'));
    await rt.db.foodLog.put(doc('f', '2026-09-02'));
    await rt.db.bodyWeights.put(doc('b', '2026-08-30'));
    expect(await lastEntryDay(rt.db)).toBe('2026-09-03');
    await rt.db.waterLog.put(doc('w', '2026-09-10'));
    expect(await lastEntryDay(rt.db)).toBe('2026-09-10');
  });

  it('übergeht gelöschte Einträge', async () => {
    await rt.db.waterLog.put(doc('w1', '2026-09-05'));
    await rt.db.waterLog.put(doc('w2', '2026-09-20', true));
    expect(await lastEntryDay(rt.db)).toBe('2026-09-05');
  });
});
