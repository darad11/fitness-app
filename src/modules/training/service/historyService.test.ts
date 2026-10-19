import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { liveExercises, liveSets } from '../calc/session';
import { getSession, latestHistory, listCompletedSessions } from '../data/sessionRepository';
import {
  deleteCompletedSession,
  editCompletedSession,
  InvalidEditError,
  NotCompletedError,
  restoreCompletedSession,
} from './historyService';
import { logActivity, logStrength } from './logService';
import { InvalidValueError, startSession } from './sessionService';

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

async function logged() {
  const squat = exercises.find((e) => e.key === 'back_squat_barbell')!;
  return logStrength(
    rt,
    {
      title: 'Beine',
      startedAt: new Date('2026-10-16T17:00:00.000Z'),
      durationSec: 2700,
      notes: 'alt',
      exercises: [
        {
          exerciseId: squat.id,
          name: squat.name,
          trackingMode: squat.trackingMode,
          sets: [
            { type: 'working', values: { weightKg: 80, reps: 5 } },
            { type: 'working', values: { weightKg: 80, reps: 5 } },
          ],
        },
      ],
    },
    NOW,
  );
}

describe('Verlauf bearbeiten (AK-HIS-03)', () => {
  it('ändert Titel, Beginn, Dauer, Notiz und Werte und schreibt die Projektion neu', async () => {
    const session = await logged();
    const [first, second] = liveSets(liveExercises(session)[0]!);
    const edited = await editCompletedSession(
      rt,
      session.id,
      {
        title: ' Beine schwer ',
        startedAt: new Date('2026-10-15T18:00:00.000Z'),
        durationSec: 3000,
        notes: '',
        sets: { [first!.id]: { weightKg: 90, reps: 5 } },
        removeSetIds: [second!.id],
      },
      NOW,
    );
    expect(edited).toMatchObject({
      title: 'Beine schwer',
      startedAt: '2026-10-15T18:00:00.000Z',
      endedAt: '2026-10-15T18:50:00.000Z',
      durationSec: 3000,
    });
    expect(edited).not.toHaveProperty('notes');
    expect(edited.dayKey).toMatch(/^2026-10-1[56]$/);
    const sets = liveSets(liveExercises(edited)[0]!);
    expect(sets.map((s) => s.actual)).toEqual([{ weightKg: 90, reps: 5 }]);
    const row = await latestHistory(rt.db, liveExercises(edited)[0]!.exerciseId);
    expect(row).toMatchObject({
      completedAt: '2026-10-15T18:50:00.000Z',
      best: { weightKg: 90, reps: 5 },
      volumeKg: 450,
    });
  });

  it('lehnt Ungültiges ab, ohne etwas zu ändern', async () => {
    const session = await logged();
    const set = liveSets(liveExercises(session)[0]!)[0]!;
    await expect(
      editCompletedSession(rt, session.id, { durationSec: 30 }, NOW),
    ).rejects.toMatchObject({ reason: 'duration' });
    await expect(
      editCompletedSession(
        rt,
        session.id,
        { startedAt: new Date('2026-10-25T10:00:00.000Z') },
        NOW,
      ),
    ).rejects.toBeInstanceOf(InvalidEditError);
    await expect(editCompletedSession(rt, session.id, { title: '  ' }, NOW)).rejects.toMatchObject({
      reason: 'title',
    });
    await expect(
      editCompletedSession(rt, session.id, { sets: { [set.id]: { weightKg: 80 } } }, NOW),
    ).rejects.toMatchObject({ reason: 'missing' });
    await expect(
      editCompletedSession(rt, session.id, { sets: { [set.id]: { weightKg: 900, reps: 5 } } }, NOW),
    ).rejects.toBeInstanceOf(InvalidValueError);
    await expect(
      editCompletedSession(
        rt,
        session.id,
        { removeSetIds: ['00000000-0000-4000-8000-000000000000'] },
        NOW,
      ),
    ).rejects.toThrow('Satz nicht gefunden');
    expect((await getSession(rt.db, session.id))?.hlc).toBe(session.hlc);
  });

  it('bearbeitet keine laufende Einheit und passt die Dauer einer Aktivität mit an', async () => {
    const running = await startSession(rt, { source: 'free', title: 'Frei', exercises: [] });
    await expect(editCompletedSession(rt, running.id, { title: 'x' }, NOW)).rejects.toBeInstanceOf(
      NotCompletedError,
    );
    const activity = await logActivity(
      rt,
      { type: 'run', startedAt: new Date('2026-10-17T07:00:00.000Z'), durationSec: 1800 },
      'Laufen',
      NOW,
    );
    const edited = await editCompletedSession(rt, activity.id, { durationSec: 2100 }, NOW);
    expect(edited.activity?.durationSec).toBe(2100);
  });
});

describe('Verlauf löschen (AK-HIS-04)', () => {
  it('löscht weich samt Projektion und stellt beides wieder her', async () => {
    const session = await logged();
    const exerciseId = liveExercises(session)[0]!.exerciseId;
    await deleteCompletedSession(rt, session.id);
    expect(await listCompletedSessions(rt.db)).toHaveLength(0);
    expect(await latestHistory(rt.db, exerciseId)).toBeUndefined();
    const tomb = await rt.db.sessions.get(session.id);
    expect(tomb).toMatchObject({ deletedFrom: 'completed' });
    expect(tomb?.deletedAt).not.toBeNull();
    await restoreCompletedSession(rt, session.id);
    expect((await listCompletedSessions(rt.db)).map((s) => s.id)).toEqual([session.id]);
    expect(await latestHistory(rt.db, exerciseId)).toMatchObject({ sessionId: session.id });
  });
});

describe('Notizen im Verlauf (AK-TRN-24, D-260)', () => {
  it('ändert die Notiz einer Übung und schreibt sie in die Projektion', async () => {
    const session = await logged();
    const exercise = liveExercises(session)[0]!;
    const edited = await editCompletedSession(
      rt,
      session.id,
      { exerciseNotes: { [exercise.id]: '  tiefer gehen ' } },
      NOW,
    );
    expect(liveExercises(edited)[0]?.note).toBe('tiefer gehen');
    expect((await latestHistory(rt.db, exercise.exerciseId))?.note).toBe('tiefer gehen');
    const cleared = await editCompletedSession(
      rt,
      session.id,
      { exerciseNotes: { [exercise.id]: '' } },
      NOW,
    );
    expect(liveExercises(cleared)[0]).not.toHaveProperty('note');
    expect(await latestHistory(rt.db, exercise.exerciseId)).not.toHaveProperty('note');
    await expect(
      editCompletedSession(rt, session.id, { exerciseNotes: { unbekannt: 'x' } }, NOW),
    ).rejects.toThrow('Übung nicht gefunden');
  });
});
