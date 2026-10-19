import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { estimateCalories } from '../calc/calories';
import { summarizeSession } from '../calc/history';
import { latestHistory, listCompletedSessions } from '../data/sessionRepository';
import { InvalidLogError, logActivity, logStrength } from './logService';

let rt: DbRuntime;
let exercises: readonly Exercise[];
const NOW = { now: () => new Date('2026-10-18T12:00:00.000Z') };
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  exercises = await loadCoreExercises();
});
afterEach(async () => {
  await rt.db.delete();
});
const byKey = (key: string) => exercises.find((e) => e.key === key)!;

describe('Nachtragen (AK-TRN-23)', () => {
  it('trägt eine Aktivität mit Dauer und Distanz ein, ohne Kalorienschätzung', async () => {
    const session = await logActivity(
      rt,
      {
        type: 'run',
        startedAt: new Date('2026-10-17T07:00:00.000Z'),
        durationSec: 32 * 60,
        distanceM: 5200,
        notes: ' locker ',
      },
      'Laufen',
      NOW,
    );
    expect(session).toMatchObject({
      kind: 'activity',
      source: 'manual',
      status: 'completed',
      title: 'Laufen',
      durationSec: 1920,
      endedAt: '2026-10-17T07:32:00.000Z',
      notes: 'locker',
      activity: { type: 'run', durationSec: 1920, distanceM: 5200 },
      exercises: [],
    });
    expect(session.dayKey).toMatch(/^2026-10-1[67]$/);
    expect((await listCompletedSessions(rt.db)).map((s) => s.id)).toEqual([session.id]);
    expect(estimateCalories(session, 80)).toBeNull();
    expect(summarizeSession(session)).toMatchObject({
      durationSec: 1920,
      exercises: 0,
      doneSets: 0,
    });
  });

  it('lehnt Zukunft, zu kurze Dauer und ungültige Distanz ab', async () => {
    const good = {
      type: 'walk' as const,
      startedAt: new Date('2026-10-18T07:00:00.000Z'),
      durationSec: 600,
    };
    await expect(
      logActivity(rt, { ...good, startedAt: new Date('2026-10-20T07:00:00.000Z') }, 'Gehen', NOW),
    ).rejects.toMatchObject({ name: 'InvalidLogError', reason: 'future' });
    await expect(logActivity(rt, { ...good, durationSec: 30 }, 'Gehen', NOW)).rejects.toMatchObject(
      {
        reason: 'duration',
      },
    );
    await expect(logActivity(rt, { ...good, distanceM: -1 }, 'Gehen', NOW)).rejects.toBeInstanceOf(
      InvalidLogError,
    );
    expect(await listCompletedSessions(rt.db)).toHaveLength(0);
  });

  it('trägt ein Krafttraining mit erledigten Sätzen ein und schreibt die Projektion', async () => {
    const squat = byKey('back_squat_barbell');
    const plank = byKey('plank');
    const session = await logStrength(
      rt,
      {
        title: ' Beine ',
        startedAt: new Date('2026-10-16T17:00:00.000Z'),
        durationSec: 45 * 60,
        exercises: [
          {
            exerciseId: squat.id,
            name: squat.name,
            trackingMode: squat.trackingMode,
            sets: [
              { type: 'warmup', values: { weightKg: 40, reps: 10 } },
              { type: 'working', values: { weightKg: 80, reps: 5 } },
              { type: 'working', values: { weightKg: 80, reps: 5 } },
            ],
          },
          {
            exerciseId: plank.id,
            name: plank.name,
            trackingMode: plank.trackingMode,
            sets: [{ type: 'working', values: { durationSec: 60 } }],
          },
        ],
      },
      NOW,
    );
    expect(session).toMatchObject({
      kind: 'strength',
      source: 'manual',
      title: 'Beine',
      durationSec: 2700,
    });
    expect(session.exercises[0]!.sets.map((s) => [s.type, s.status, s.completedAt])).toEqual([
      ['warmup', 'done', '2026-10-16T17:45:00.000Z'],
      ['working', 'done', '2026-10-16T17:45:00.000Z'],
      ['working', 'done', '2026-10-16T17:45:00.000Z'],
    ]);
    expect(summarizeSession(session)).toMatchObject({ exercises: 2, doneSets: 4, volumeKg: 800 });
    const row = await latestHistory(rt.db, squat.id);
    expect(row).toMatchObject({
      sessionId: session.id,
      best: { weightKg: 80, reps: 5 },
      volumeKg: 800,
    });
    expect(estimateCalories(session, 80)?.kcal).toBeGreaterThan(0);
  });

  it('verlangt Übungen mit Sätzen und vollständige Werte', async () => {
    const squat = byKey('back_squat_barbell');
    const common = {
      title: 'x',
      startedAt: new Date('2026-10-16T17:00:00.000Z'),
      durationSec: 600,
    };
    await expect(logStrength(rt, { ...common, exercises: [] }, NOW)).rejects.toMatchObject({
      reason: 'exercises',
    });
    await expect(
      logStrength(
        rt,
        {
          ...common,
          exercises: [
            {
              exerciseId: squat.id,
              name: squat.name,
              trackingMode: 'weight_reps',
              sets: [{ type: 'working', values: { reps: 5 } }],
            },
          ],
        },
        NOW,
      ),
    ).rejects.toMatchObject({ reason: 'values' });
    expect(await listCompletedSessions(rt.db)).toHaveLength(0);
    expect(await rt.db.exerciseHistory.count()).toBe(0);
  });
});
