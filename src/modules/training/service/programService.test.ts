import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { createTestRuntime } from '@/shared/testing/db';
import { loadTrainingState, TRAINING_STATE_ID } from '../data/trainingStateRepository';
import { activateProgram, deactivateProgram } from './programService';

let rt: DbRuntime;
const A = stableId('sample-template:compound_ab_4');
const B = stableId('sample-template:ppl_rotation_4');
const at = (iso: string) => ({ now: () => new Date(iso) });

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

describe('Aktives Programm (AK-PRG-07, TP-19, D-249)', () => {
  it('beginnt ohne aktives Programm', async () => {
    expect(await loadTrainingState(rt.db)).toEqual({ history: [] });
  });

  it('aktiviert ein Programm als Singleton in der Tabelle singletons', async () => {
    const state = await activateProgram(rt, A, at('2026-10-18T10:00:00.000Z'));
    expect(state).toEqual({
      activeProgramId: A,
      activeSince: '2026-10-18T10:00:00.000Z',
      history: [{ programId: A, from: '2026-10-18T10:00:00.000Z' }],
    });
    const stored = await rt.db.singletons.get(TRAINING_STATE_ID);
    expect(stored).toMatchObject({ type: 'training_state', schemaVersion: 1, deletedAt: null });
    expect(await loadTrainingState(rt.db)).toEqual(state);
  });

  it('ändert nichts, wenn dasselbe Programm schon aktiv ist', async () => {
    await activateProgram(rt, A, at('2026-10-18T10:00:00.000Z'));
    const again = await activateProgram(rt, A, at('2026-10-19T10:00:00.000Z'));
    expect(again.activeSince).toBe('2026-10-18T10:00:00.000Z');
    expect(again.history).toHaveLength(1);
  });

  it('beendet beim Wechsel das bisherige Programm und führt die Folge weiter', async () => {
    await activateProgram(rt, A, at('2026-10-18T10:00:00.000Z'));
    const state = await activateProgram(rt, B, at('2026-11-01T10:00:00.000Z'));
    expect(state).toEqual({
      activeProgramId: B,
      activeSince: '2026-11-01T10:00:00.000Z',
      history: [
        { programId: A, from: '2026-10-18T10:00:00.000Z', to: '2026-11-01T10:00:00.000Z' },
        { programId: B, from: '2026-11-01T10:00:00.000Z' },
      ],
    });
  });

  it('beendet das aktive Programm und behält die Folge', async () => {
    await activateProgram(rt, A, at('2026-10-18T10:00:00.000Z'));
    const state = await deactivateProgram(rt, at('2026-10-20T10:00:00.000Z'));
    expect(state).toEqual({
      history: [{ programId: A, from: '2026-10-18T10:00:00.000Z', to: '2026-10-20T10:00:00.000Z' }],
    });
    expect(await deactivateProgram(rt)).toEqual(state);
    const stored = await rt.db.singletons.get(TRAINING_STATE_ID);
    expect(stored).not.toHaveProperty('activeProgramId');
  });

  it('lehnt eine ungültige Programm-ID ab, ohne etwas zu speichern', async () => {
    await expect(activateProgram(rt, 'keine-uuid')).rejects.toThrow();
    expect(await rt.db.singletons.get(TRAINING_STATE_ID)).toBeUndefined();
  });
});
