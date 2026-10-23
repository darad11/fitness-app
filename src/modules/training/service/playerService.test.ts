import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { liveExercises, liveSets } from '../calc/session';
import { loadSampleTemplate } from '../data/sampleTemplates';
import { getSession } from '../data/sessionRepository';
import type { Session } from '../model/session';
import { PROGRAM_C_KEY } from '../data/programC';
import {
  completeSet,
  moveExercise,
  planFromTemplateDay,
  removeSet,
  replaceExercise,
  SetNotOpenError,
  skipSet,
  startSession,
  startSetTimer,
  stopSetTimer,
} from './sessionService';

let rt: DbRuntime;
let exercises: readonly Exercise[];
const T0 = new Date('2026-10-18T09:00:00.000Z');
const at = (sec: number) => ({ now: () => new Date(T0.getTime() + sec * 1000) });
const REST = { restDefaultSec: 90, autoStartRest: false };

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  exercises = await loadCoreExercises();
});
afterEach(async () => {
  await rt.db.delete();
});

const byKey = (key: string) => exercises.find((e) => e.key === key)!;
const info = (key: string) => {
  const e = byKey(key);
  return {
    exerciseId: e.id,
    name: e.name,
    trackingMode: e.trackingMode,
    ...(e.distanceUnit ? { distanceUnit: e.distanceUnit } : {}),
    ...(e.isUnilateral ? { perSide: true } : {}),
  };
};

async function startDayA(): Promise<Session> {
  const template = (await loadSampleTemplate('full_body_ab'))!;
  return startSession(
    rt,
    planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
    at(0),
  );
}

describe('Übung ersetzen (AK-TRN-09, TS-10)', () => {
  it('schreibt die Übung ohne erledigte Sätze um und behält Sätze und Ziele', async () => {
    const session = await startDayA();
    const squat = liveExercises(session)[0]!;
    const before = liveSets(squat).map((set) => set.id);
    const updated = await replaceExercise(rt, session.id, squat.id, info('leg_press'));
    const replaced = liveExercises(updated)[0]!;
    expect(replaced.id).toBe(squat.id);
    expect(replaced).toMatchObject({
      exerciseId: byKey('leg_press').id,
      nameSnapshot: 'Beinpresse',
      trackingMode: 'weight_reps',
      replacedFromExerciseId: byKey('back_squat_barbell').id,
    });
    expect(liveSets(replaced).map((set) => set.id)).toEqual(before);
    expect(liveSets(replaced)[2]!.target).toEqual({ repsMin: 6, repsMax: 8 });
    expect(liveExercises(updated)).toHaveLength(5);
    expect(updated.exerciseIds).toContain(byKey('leg_press').id);
    expect(updated.exerciseIds).not.toContain(byKey('back_squat_barbell').id);
  });

  it('lässt erledigte Sätze bei der bisherigen Übung und verschiebt die offenen zur neuen dahinter', async () => {
    const session = await startDayA();
    const squat = liveExercises(session)[0]!;
    const sets = liveSets(squat);
    await completeSet(rt, session.id, sets[0]!.id, {
      ...REST,
      previous: { weightKg: 40, reps: 10 },
    });
    await completeSet(rt, session.id, sets[1]!.id, {
      ...REST,
      previous: { weightKg: 50, reps: 5 },
    });
    const updated = await replaceExercise(rt, session.id, squat.id, info('front_squat_barbell'));
    const [original, replacement, third] = liveExercises(updated);
    expect(original!.id).toBe(squat.id);
    expect(original!.nameSnapshot).toBe('Kniebeuge mit Langhantel');
    expect(liveSets(original!).map((set) => set.status)).toEqual(['done', 'done']);
    expect(replacement).toMatchObject({
      nameSnapshot: 'Frontkniebeuge mit Langhantel',
      replacedFromExerciseId: squat.exerciseId,
      restSec: squat.restSec,
    });
    const moved = liveSets(replacement!);
    expect(moved).toHaveLength(3);
    expect(moved.every((set) => set.status === 'planned')).toBe(true);
    expect(moved.map((set) => set.position)).toEqual([0, 1, 2]);
    expect(moved.map((set) => set.id)).not.toContain(sets[2]!.id);
    expect(third!.nameSnapshot).toBe('Bankdrücken mit Langhantel');
    expect(liveExercises(updated).map((e) => e.position)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('verwirft Eingaben und unpassende Ziele bei anderer Erfassungsart', async () => {
    const session = await startDayA();
    const plank = liveExercises(session)[4]!;
    expect(plank.trackingMode).toBe('time');
    const updated = await replaceExercise(rt, session.id, plank.id, info('crunch'));
    const replaced = liveExercises(updated)[4]!;
    expect(replaced.trackingMode).toBe('reps');
    expect(liveSets(replaced).every((set) => set.target === undefined)).toBe(true);
    const squat = liveExercises(session)[0]!;
    const again = await replaceExercise(rt, session.id, squat.id, info('leg_press'));
    const once = liveExercises(again)[0]!;
    const twice = await replaceExercise(rt, session.id, once.id, info('hack_squat'));
    // Der ursprüngliche Plan bleibt als Herkunft erhalten, auch nach zweimaligem Ersetzen.
    expect(liveExercises(twice)[0]!.replacedFromExerciseId).toBe(squat.exerciseId);
  });

  it('nimmt Drop-Sätze nur mit ihrem Arbeitssatz mit', async () => {
    const template = (await loadSampleTemplate('upper_lower'))!;
    const session = await startSession(
      rt,
      planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
      at(0),
    );
    const withDrop = liveExercises(session).find((e) =>
      liveSets(e).some((set) => set.type === 'drop'),
    )!;
    const sets = liveSets(withDrop);
    const working = sets.filter((set) => set.type === 'working');
    const drop = sets.find((set) => set.type === 'drop')!;
    expect(drop.parentSetId).toBe(working.at(-1)!.id);
    await completeSet(rt, session.id, working.at(-1)!.id, {
      ...REST,
      previous: { weightKg: 20, reps: 10 },
    });
    const updated = await replaceExercise(rt, session.id, withDrop.id, info('lateral_raise_cable'));
    const original = liveExercises(updated).find((e) => e.id === withDrop.id)!;
    const replacement = liveExercises(updated).find(
      (e) => e.replacedFromExerciseId === withDrop.exerciseId && e.id !== withDrop.id,
    )!;
    expect(liveSets(original).map((set) => set.type)).toEqual(['working', 'drop']);
    expect(liveSets(replacement).every((set) => set.type === 'working')).toBe(true);
  });
});

describe('Umsortieren im Player (AK-PRG-03)', () => {
  it('tauscht mit der Nachbarin und bleibt am Rand stehen', async () => {
    const session = await startDayA();
    const names = (s: Session) => liveExercises(s).map((e) => e.nameSnapshot);
    const second = liveExercises(session)[1]!;
    const up = await moveExercise(rt, session.id, second.id, -1);
    expect(names(up).slice(0, 2)).toEqual([
      'Bankdrücken mit Langhantel',
      'Kniebeuge mit Langhantel',
    ]);
    const stuck = await moveExercise(rt, session.id, second.id, -1);
    expect(names(stuck)).toEqual(names(up));
    const down = await moveExercise(rt, session.id, second.id, 1);
    expect(names(down)).toEqual(names(session));
    await expect(moveExercise(rt, session.id, 'fehlt', 1)).rejects.toThrow('Übung nicht gefunden');
  });
});

describe('Übungstimer (AK-TRN-14)', () => {
  it('läuft gespeichert, stoppt mit Istwert und wird durch „erledigt" übernommen', async () => {
    const session = await startDayA();
    const plank = liveExercises(session)[4]!;
    const [first, second] = liveSets(plank);
    const started = await startSetTimer(rt, session.id, first!.id, at(10));
    expect(started.setTimer).toEqual({ setId: first!.id, startedAt: '2026-10-18T09:00:10.000Z' });
    expect((await getSession(rt.db, session.id))!.setTimer?.setId).toBe(first!.id);
    const stopped = await stopSetTimer(rt, session.id, at(52.4));
    expect(stopped.setTimer).toBeNull();
    expect(liveSets(liveExercises(stopped)[4]!)[0]!.actual).toEqual({ durationSec: 42 });
    expect(await stopSetTimer(rt, session.id, at(60))).toMatchObject({ setTimer: null });

    // Ein zweiter Start stoppt den ersten Timer; „erledigt" übernimmt die Zeit.
    await startSetTimer(rt, session.id, first!.id, at(100));
    const switched = await startSetTimer(rt, session.id, second!.id, at(130));
    expect(liveSets(liveExercises(switched)[4]!)[0]!.actual.durationSec).toBe(30);
    const completed = await completeSet(rt, session.id, second!.id, { ...REST, now: at(175).now });
    const done = liveSets(liveExercises(completed)[4]!)[1]!;
    expect(done).toMatchObject({ status: 'done', actual: { durationSec: 45 } });
    expect(completed.setTimer).toBeNull();
  });

  it('läuft nur an offenen Sätzen und endet mit Überspringen oder Entfernen', async () => {
    const session = await startDayA();
    const plank = liveExercises(session)[4]!;
    const [first, second, third] = liveSets(plank);
    await skipSet(rt, session.id, first!.id);
    await expect(startSetTimer(rt, session.id, first!.id)).rejects.toBeInstanceOf(SetNotOpenError);
    await startSetTimer(rt, session.id, second!.id, at(0));
    expect((await skipSet(rt, session.id, second!.id)).setTimer).toBeNull();
    await startSetTimer(rt, session.id, third!.id, at(0));
    expect((await removeSet(rt, session.id, third!.id)).setTimer).toBeNull();
    const squat = liveExercises(session)[0]!;
    await expect(startSetTimer(rt, session.id, liveSets(squat)[0]!.id)).resolves.toBeDefined();
  });
});

describe('Hinweise aus dem Programm', () => {
  it('übernimmt den Ausführungshinweis je Übung in die Einheit', async () => {
    const template = (await loadSampleTemplate(PROGRAM_C_KEY))!;
    const input = planFromTemplateDay(template, 3, 1, (id) => exercises.find((e) => e.id === id));
    const noted = input.exercises.find((e) => e.notes?.startsWith('Dropset'));
    expect(noted).toBeDefined();
    const session = await startSession(rt, input, at(0));
    expect(liveExercises(session).find((e) => e.notes?.startsWith('Dropset'))).toBeDefined();
  });
});
