import { afterEach, beforeEach, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { uuidv4 } from '@/shared/lib/uuid';
import { createTestRuntime } from '@/shared/testing/db';
import { startSession } from '../service/sessionService';
import { findActiveSession } from './sessionRepository';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  await rt.db.delete();
});

it('übergeht ein ungültiges laufendes Training und findet das gültige (B-04)', async () => {
  const valid = await startSession(rt, { source: 'free', title: 'Frei', exercises: [] });
  const stored = await rt.db.sessions.get(valid.id);
  // Jünger als das gültige, aber nicht lesbar (etwa von einer neueren App-Version).
  await rt.db.sessions.put({
    ...stored!,
    id: uuidv4(),
    startedAt: new Date(Date.now() + 60_000).toISOString(),
    dayKey: 'kein Tag',
  });
  expect((await findActiveSession(rt.db))?.id).toBe(valid.id);
});
