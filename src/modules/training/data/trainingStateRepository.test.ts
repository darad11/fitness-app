import { afterEach, beforeEach, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { changeTrainingState, TRAINING_STATE_ID } from './trainingStateRepository';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  await rt.db.delete();
});

it('Trainingszustand behält Felder einer neueren App-Version beim Speichern (A-03)', async () => {
  await changeTrainingState(rt, (state) => ({
    ...state,
    activeProgramId: 'f3f1c2a0-1b2c-4d3e-8f4a-5b6c7d8e9f01',
    activeSince: '2026-10-20T07:00:00.000Z',
  }));
  // Ein neueres Gerät hat ein Feld ergänzt, das diese Version nicht kennt.
  const stored = await rt.db.singletons.get(TRAINING_STATE_ID);
  await rt.db.singletons.put({ ...stored!, zukunft: [1, 2] });
  // Ein bekanntes Feld entfernen: Es bleibt entfernt, das unbekannte bleibt.
  await changeTrainingState(rt, ({ activeProgramId: _id, activeSince: _since, ...rest }) => rest);
  const after = await rt.db.singletons.get(TRAINING_STATE_ID);
  expect(after).toMatchObject({ zukunft: [1, 2] });
  expect(after).not.toHaveProperty('activeProgramId');
});
