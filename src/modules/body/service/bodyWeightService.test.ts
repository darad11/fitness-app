import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listBodyWeights } from '../data/bodyWeightRepository';
import {
  addBodyWeight,
  deleteBodyWeight,
  FutureDateError,
  InvalidWeightError,
  restoreBodyWeight,
  updateBodyWeight,
} from './bodyWeightService';

let rt: DbRuntime;
const NOW = { now: () => new Date('2026-10-18T12:00:00.000Z') };
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

describe('Körpergewicht erfassen, ändern, löschen (AK-BW-01, AK-BW-04)', () => {
  it('speichert mit einer Nachkommastelle, Tag und Zeitzone', async () => {
    const saved = await addBodyWeight(
      rt,
      { weightKg: 80.26, measuredAt: new Date('2026-10-18T06:30:00.000Z'), note: '  nüchtern ' },
      NOW,
    );
    expect(saved).toMatchObject({
      type: 'body_weight',
      weightKg: 80.3,
      measuredAt: '2026-10-18T06:30:00.000Z',
      note: 'nüchtern',
      source: 'manual',
    });
    expect(saved.dayKey).toMatch(/^2026-10-1[78]$/);
    expect((await listBodyWeights(rt.db)).map((e) => e.id)).toEqual([saved.id]);
  });

  it('lehnt Werte außerhalb von 20 bis 400 kg und Zeitpunkte über einen Tag in der Zukunft ab', async () => {
    await expect(
      addBodyWeight(rt, { weightKg: 19.9, measuredAt: new Date('2026-10-18T06:30:00.000Z') }, NOW),
    ).rejects.toBeInstanceOf(InvalidWeightError);
    await expect(
      addBodyWeight(rt, { weightKg: 80, measuredAt: new Date('2026-10-20T06:30:00.000Z') }, NOW),
    ).rejects.toBeInstanceOf(FutureDateError);
    await expect(
      addBodyWeight(rt, { weightKg: 80, measuredAt: new Date('2026-10-19T11:00:00.000Z') }, NOW),
    ).resolves.toBeDefined();
    expect(await listBodyWeights(rt.db)).toHaveLength(1);
  });

  it('ändert einen Eintrag und entfernt eine geleerte Notiz', async () => {
    const saved = await addBodyWeight(
      rt,
      { weightKg: 80, measuredAt: new Date('2026-10-18T06:30:00.000Z'), note: 'alt' },
      NOW,
    );
    const changed = await updateBodyWeight(
      rt,
      saved.id,
      { weightKg: 79.4, measuredAt: new Date('2026-10-17T06:30:00.000Z'), note: '' },
      NOW,
    );
    expect(changed).toMatchObject({
      id: saved.id,
      weightKg: 79.4,
      measuredAt: '2026-10-17T06:30:00.000Z',
    });
    expect(changed).not.toHaveProperty('note');
    expect(changed.hlc > saved.hlc).toBe(true);
  });

  it('löscht weich und stellt wieder her', async () => {
    const a = await addBodyWeight(
      rt,
      { weightKg: 80, measuredAt: new Date('2026-10-18T06:30:00.000Z') },
      NOW,
    );
    const b = await addBodyWeight(
      rt,
      { weightKg: 81, measuredAt: new Date('2026-10-17T06:30:00.000Z') },
      NOW,
    );
    await deleteBodyWeight(rt, a.id);
    expect((await listBodyWeights(rt.db)).map((e) => e.id)).toEqual([b.id]);
    expect((await rt.db.bodyWeights.get(a.id))?.deletedAt).not.toBeNull();
    await restoreBodyWeight(rt, a.id);
    expect((await listBodyWeights(rt.db)).map((e) => e.id)).toEqual([a.id, b.id]);
  });
});
