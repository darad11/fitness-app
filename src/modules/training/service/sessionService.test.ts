import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { previousValues } from '../calc/history';
import { liveExercises, liveSets, setSlot } from '../calc/session';
import { loadSampleTemplate } from '../data/sampleTemplates';
import { findActiveSession, getSession, latestHistory } from '../data/sessionRepository';
import type { Session } from '../model/session';
import {
  ActiveSessionError,
  addExercise,
  addSet,
  adjustRest,
  completeSet,
  discardSession,
  finishSession,
  InvalidValueError,
  MissingValuesError,
  ItemNotFoundError,
  NoteTooLongError,
  OpenSetsError,
  planFromTemplateDay,
  removeExercise,
  removeSet,
  reopenSet,
  restoreSession,
  SessionClosedError,
  setExerciseNote,
  setSessionNote,
  setValues,
  skipRest,
  skipSet,
  startSession,
  type StartInput,
} from './sessionService';

let rt: DbRuntime;
let exercises: readonly Exercise[];
const T0 = new Date('2026-10-18T09:00:00.000Z');
const at = (sec: number) => () => new Date(T0.getTime() + sec * 1000);
const REST = { restDefaultSec: 90, autoStartRest: true };

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  exercises = await loadCoreExercises();
});
afterEach(async () => {
  await rt.db.delete();
});

const byKey = (key: string) => exercises.find((e) => e.key === key)!;
const lookup = (id: string) => exercises.find((e) => e.id === id);

async function templatePlan(key: string, week = 0, day = 0): Promise<StartInput> {
  const template = (await loadSampleTemplate(key))!;
  return planFromTemplateDay(template, week, day, lookup);
}

const ex = (s: Session, i: number) => liveExercises(s)[i]!;
const st = (s: Session, i: number, j: number) => liveSets(ex(s, i))[j]!;

function freeInput(key: string): StartInput {
  const e = byKey(key);
  return {
    source: 'free',
    title: 'Freies Training',
    exercises: [
      {
        exerciseId: e.id,
        name: e.name,
        trackingMode: e.trackingMode,
        sets: [{ type: 'working' }, { type: 'working' }],
      },
    ],
  };
}

describe('Starten (AK-TRN-01, AK-TRN-22, AK-PRG-06 Beispiel starten)', () => {
  it('übernimmt einen Tag der Vorlage als Snapshot mit allen Übungen und Sätzen', async () => {
    const session = await startSession(rt, await templatePlan('full_body_ab'), { now: () => T0 });
    expect(session).toMatchObject({
      type: 'session',
      kind: 'strength',
      source: 'template',
      status: 'in_progress',
      title: 'Tag A · Ganzkörper A/B',
      startedAt: T0.toISOString(),
      restTimer: null,
      program: {
        programName: 'Ganzkörper A/B',
        sampleKey: 'full_body_ab',
        weekIndex: 0,
        dayIndex: 0,
        dayName: 'Tag A',
      },
    });
    expect(liveExercises(session).map((e) => e.nameSnapshot)).toEqual([
      'Kniebeuge mit Langhantel',
      'Bankdrücken mit Langhantel',
      'Rudern am Kabel, sitzend',
      'Beinbeuger liegend',
      'Unterarmstütz (Plank)',
    ]);
    expect(liveSets(ex(session, 0)).map((s) => [s.type, s.target])).toEqual([
      ['warmup', { repsMin: 10, repsMax: 10 }],
      ['warmup', { repsMin: 5, repsMax: 5 }],
      ['working', { repsMin: 6, repsMax: 8 }],
      ['working', { repsMin: 6, repsMax: 8 }],
      ['working', { repsMin: 6, repsMax: 8 }],
    ]);
    expect(ex(session, 0)).toMatchObject({ trackingMode: 'weight_reps', restSec: 150 });
    expect(ex(session, 4)).toMatchObject({ trackingMode: 'time' });
    expect(session.exerciseIds).toHaveLength(5);
    expect(await getSession(rt.db, session.id)).toEqual(session);
  });

  it('übernimmt Drop-Sätze und „je Seite"', async () => {
    const upper = await startSession(rt, await templatePlan('upper_lower'));
    const pushdown = liveExercises(upper).find(
      (e) => e.nameSnapshot === 'Trizepsdrücken am Kabel',
    )!;
    const sets = liveSets(pushdown);
    expect(sets[2]).toMatchObject({ type: 'drop', parentSetId: sets[1]!.id, restSec: 0 });
    await discardSession(rt, upper.id);
    const lower = await startSession(rt, await templatePlan('upper_lower', 0, 3));
    expect(
      liveExercises(lower).find((e) => e.nameSnapshot.startsWith('Bulgarische'))?.perSide,
    ).toBe(true);
  });

  it('erlaubt höchstens eine laufende Einheit', async () => {
    const first = await startSession(rt, freeInput('bench_press_barbell'));
    await expect(startSession(rt, freeInput('pull_up'))).rejects.toEqual(
      new ActiveSessionError(first.id),
    );
    expect((await findActiveSession(rt.db))?.id).toBe(first.id);
  });

  it('startet frei ohne Übungen und meldet unbekannte Tage und Übungen', async () => {
    const free = await startSession(rt, {
      source: 'free',
      title: 'Freies Training',
      exercises: [],
    });
    expect(free.exercises).toEqual([]);
    const template = (await loadSampleTemplate('full_body_ab'))!;
    expect(() => planFromTemplateDay(template, 5, 0, lookup)).toThrow(ItemNotFoundError);
    expect(() => planFromTemplateDay(template, 0, 0, () => undefined)).toThrow(/Übung fehlt/);
  });
});

describe('Übungen und Sätze (AK-TRN-08, AK-TRN-09)', () => {
  it('fügt Übungen und Sätze hinzu und entfernt sie weich', async () => {
    const pullUp = byKey('pull_up');
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    s = await addExercise(rt, s.id, {
      exerciseId: pullUp.id,
      name: pullUp.name,
      trackingMode: 'weight_reps',
    });
    expect(liveExercises(s).map((e) => e.nameSnapshot)).toEqual([
      'Bankdrücken mit Langhantel',
      'Klimmzüge',
    ]);
    expect(s.exerciseIds).toEqual([byKey('bench_press_barbell').id, pullUp.id]);
    expect(liveSets(ex(s, 1))).toHaveLength(1);

    s = await setValues(rt, s.id, st(s, 0, 0).id, { weightKg: 60, reps: 8 });
    s = await completeSet(rt, s.id, st(s, 0, 0).id, REST);
    s = await addSet(rt, s.id, ex(s, 0).id);
    expect(st(s, 0, 2)).toMatchObject({
      type: 'working',
      status: 'planned',
      actual: {},
      target: { weightKg: 60, repsMin: 8, repsMax: 8 },
    });
    s = await addSet(rt, s.id, ex(s, 0).id, 'warmup');
    expect(st(s, 0, 3).type).toBe('warmup');

    const removedSet = st(s, 0, 1).id;
    s = await removeSet(rt, s.id, removedSet);
    expect(liveSets(ex(s, 0)).map((x) => x.id)).not.toContain(removedSet);
    expect(ex(s, 0).sets.find((x) => x.id === removedSet)?.deletedAt).not.toBeNull();

    s = await removeExercise(rt, s.id, ex(s, 1).id);
    expect(liveExercises(s)).toHaveLength(1);
    expect(s.exerciseIds).toEqual([byKey('bench_press_barbell').id]);
    await expect(removeExercise(rt, s.id, 'fehlt')).rejects.toThrow(ItemNotFoundError);
  });

  it('entfernt mit einem Arbeitssatz auch seine Drop-Sätze', async () => {
    let s = await startSession(rt, await templatePlan('upper_lower'));
    const pushdown = liveExercises(s).find((e) => e.nameSnapshot === 'Trizepsdrücken am Kabel')!;
    s = await removeSet(rt, s.id, liveSets(pushdown)[1]!.id);
    expect(liveSets(liveExercises(s).find((e) => e.id === pushdown.id)!)).toHaveLength(1);
  });
});

describe('Werte und Status (AK-TRN-04, AK-TRN-06, AK-TRN-07)', () => {
  it('lehnt ungültige Werte ab, ohne Gespeichertes zu überschreiben', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    const setId = st(s, 0, 0).id;
    s = await setValues(rt, s.id, setId, { weightKg: 72.5, reps: 8 });
    await expect(setValues(rt, s.id, setId, { weightKg: 501 })).rejects.toEqual(
      new InvalidValueError('weightKg', 'range'),
    );
    await expect(setValues(rt, s.id, setId, { reps: 8.5 })).rejects.toEqual(
      new InvalidValueError('reps', 'whole'),
    );
    expect(st((await getSession(rt.db, s.id))!, 0, 0).actual).toEqual({ weightKg: 72.5, reps: 8 });
    s = await setValues(rt, s.id, setId, { reps: null });
    expect(st(s, 0, 0).actual).toEqual({ weightKg: 72.5 });
  });

  it('übernimmt Vorschläge bei „erledigt" und verlangt Eingaben ohne Vorschlag', async () => {
    let s = await startSession(rt, await templatePlan('full_body_ab'), { now: () => T0 });
    const warmup = st(s, 0, 0);
    await expect(completeSet(rt, s.id, warmup.id, REST)).rejects.toEqual(
      new MissingValuesError(['weightKg']),
    );
    s = await completeSet(rt, s.id, warmup.id, {
      ...REST,
      previous: { weightKg: 40, reps: 10 },
      now: at(10),
    });
    expect(st(s, 0, 0)).toMatchObject({
      status: 'done',
      actual: { weightKg: 40, reps: 10 },
      completedAt: at(10)().toISOString(),
    });
    const working = st(s, 0, 2);
    await expect(
      completeSet(rt, s.id, working.id, { ...REST, previous: { weightKg: 60 } }),
    ).rejects.toEqual(new MissingValuesError(['reps']));
  });

  it('macht „erledigt" und „übersprungen" rückgängig und behält die Werte', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    const setId = st(s, 0, 0).id;
    s = await setValues(rt, s.id, setId, { weightKg: 60, reps: 8 });
    s = await completeSet(rt, s.id, setId, REST);
    expect(s.restTimer?.afterSetId).toBe(setId);
    s = await reopenSet(rt, s.id, setId);
    expect(st(s, 0, 0)).toMatchObject({ status: 'planned', actual: { weightKg: 60, reps: 8 } });
    expect(st(s, 0, 0).completedAt).toBeUndefined();
    expect(s.restTimer).toBeNull();
    s = await skipSet(rt, s.id, setId);
    expect(st(s, 0, 0).status).toBe('skipped');
    s = await reopenSet(rt, s.id, setId);
    expect(st(s, 0, 0).status).toBe('planned');
  });
});

describe('Pausentimer (AK-TRN-10, AK-TRN-11)', () => {
  it('speichert den Endzeitpunkt mit der Pause aus Satz, Übung oder Einstellung', async () => {
    let s = await startSession(rt, await templatePlan('full_body_ab'));
    s = await completeSet(rt, s.id, st(s, 0, 0).id, {
      ...REST,
      previous: { weightKg: 40 },
      now: at(0),
    });
    expect(s.restTimer).toEqual({
      afterSetId: st(s, 0, 0).id,
      startedAt: T0.toISOString(),
      endsAt: at(150)().toISOString(),
      durationSec: 150,
    });
    s = await adjustRest(rt, s.id, 15);
    expect(s.restTimer).toMatchObject({ endsAt: at(165)().toISOString(), durationSec: 165 });
    s = await adjustRest(rt, s.id, -500);
    expect(s.restTimer).toMatchObject({ endsAt: T0.toISOString(), durationSec: 0 });
    s = await skipRest(rt, s.id);
    expect(s.restTimer).toBeNull();
    s = await adjustRest(rt, s.id, 15);
    expect(s.restTimer).toBeNull();

    const free = await startSession(rt, freeInput('pull_up')).catch(() => null);
    expect(free).toBeNull();
    await discardSession(rt, s.id);
    let f = await startSession(rt, freeInput('pull_up'));
    f = await completeSet(rt, f.id, st(f, 0, 0).id, {
      ...REST,
      previous: { weightKg: 0, reps: 8 },
      now: at(0),
    });
    expect(f.restTimer?.durationSec).toBe(90);
    f = await completeSet(rt, f.id, st(f, 0, 1).id, {
      restDefaultSec: 90,
      autoStartRest: false,
      previous: { weightKg: 0, reps: 8 },
    });
    expect(f.restTimer).toBeNull();
  });

  it('startet bei Drop-Sätzen erst nach dem letzten der Kette (AK-TRN-03)', async () => {
    let s = await startSession(rt, await templatePlan('upper_lower'));
    const pushdown = liveExercises(s).find((e) => e.nameSnapshot === 'Trizepsdrücken am Kabel')!;
    const [, second, drop] = liveSets(pushdown);
    s = await completeSet(rt, s.id, second!.id, {
      ...REST,
      previous: { weightKg: 30, reps: 10 },
    });
    expect(s.restTimer).toBeNull();
    s = await completeSet(rt, s.id, drop!.id, { ...REST, previous: { weightKg: 20, reps: 10 } });
    expect(s.restTimer).toMatchObject({ afterSetId: drop!.id, durationSec: 75 });
  });
});

describe('Beenden, Verlauf, Verwerfen (AK-TRN-19, AK-TRN-21, AK-TRN-05)', () => {
  it('beendet eine vergessene Einheit nach über 24 Stunden mit dem letzten erledigten Satz (D-290)', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'), { now: () => T0 });
    s = await setValues(rt, s.id, st(s, 0, 0).id, { weightKg: 60, reps: 8 });
    s = await completeSet(rt, s.id, st(s, 0, 0).id, { ...REST, now: at(1500) });
    // Beenden erst am übernächsten Tag: vorher lehnte das Schema die Dauer ab (nur Verwerfen blieb).
    const finished = await finishSession(rt, s.id, { skipOpen: true, now: at(25 * 3600) });
    expect(finished).toMatchObject({
      status: 'completed',
      endedAt: at(1500)().toISOString(),
      durationSec: 1500,
    });
    expect(await findActiveSession(rt.db)).toBeUndefined();
    expect(await latestHistory(rt.db, byKey('bench_press_barbell').id)).toMatchObject({
      sessionId: s.id,
    });

    // Ohne erledigten Satz: endet jetzt, Dauer höchstens 24 Stunden.
    const empty = await startSession(rt, freeInput('bench_press_barbell'), { now: () => T0 });
    const closed = await finishSession(rt, empty.id, { skipOpen: true, now: at(30 * 3600) });
    expect(closed).toMatchObject({
      status: 'completed',
      endedAt: at(30 * 3600)().toISOString(),
      durationSec: 24 * 3600,
    });
  });

  it('fragt bei offenen Sätzen, schließt ab und schreibt die Projektion', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'), { now: () => T0 });
    s = await setValues(rt, s.id, st(s, 0, 0).id, { weightKg: 60, reps: 8 });
    s = await completeSet(rt, s.id, st(s, 0, 0).id, REST);
    await expect(finishSession(rt, s.id, { skipOpen: false })).rejects.toEqual(
      new OpenSetsError(1),
    );
    const finished = await finishSession(rt, s.id, { skipOpen: true, now: at(1800) });
    expect(finished).toMatchObject({
      status: 'completed',
      endedAt: at(1800)().toISOString(),
      durationSec: 1800,
      restTimer: null,
    });
    expect(st(finished, 0, 1).status).toBe('skipped');
    expect(await findActiveSession(rt.db)).toBeUndefined();

    const row = (await latestHistory(rt.db, byKey('bench_press_barbell').id))!;
    expect(row).toMatchObject({
      sessionId: s.id,
      volumeKg: 480,
      setCount: 1,
      best: { weightKg: 60, reps: 8 },
      title: 'Freies Training',
    });
    expect(row.bestOneRepMax).toBeCloseTo(76, 5);
    expect(await latestHistory(rt.db, byKey('bench_press_barbell').id, s.id)).toBeUndefined();

    await expect(setValues(rt, s.id, st(finished, 0, 0).id, { reps: 9 })).rejects.toThrow(
      SessionClosedError,
    );
    await expect(finishSession(rt, s.id, { skipOpen: true })).rejects.toThrow(SessionClosedError);
  });

  it('liefert beim nächsten Mal die Vorwerte des passenden Satzes', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    s = await completeSet(rt, s.id, st(s, 0, 0).id, {
      ...REST,
      previous: { weightKg: 60, reps: 8 },
    });
    s = await completeSet(rt, s.id, st(s, 0, 1).id, {
      ...REST,
      previous: { weightKg: 62.5, reps: 6 },
    });
    await finishSession(rt, s.id, { skipOpen: false });

    const next = await startSession(rt, freeInput('bench_press_barbell'));
    const row = await latestHistory(rt.db, byKey('bench_press_barbell').id, next.id);
    const second = st(next, 0, 1);
    expect(previousValues(row, setSlot(ex(next, 0), second.id))).toEqual({
      weightKg: 62.5,
      reps: 6,
    });
    expect(previousValues(row, 'warmup:0')).toBeUndefined();
    expect(previousValues(undefined, 'working:0')).toBeUndefined();
  });

  it('verwirft weich und stellt mit „Rückgängig" wieder her', async () => {
    const s = await startSession(rt, freeInput('bench_press_barbell'));
    await discardSession(rt, s.id);
    expect(await findActiveSession(rt.db)).toBeUndefined();
    expect((await rt.db.sessions.get(s.id))?.deletedFrom).toBe('in_progress');
    const restored = await restoreSession(rt, s.id);
    expect(restored.deletedAt).toBeNull();
    expect((await findActiveSession(rt.db))?.id).toBe(s.id);

    await discardSession(rt, s.id);
    const other = await startSession(rt, freeInput('pull_up'));
    await expect(restoreSession(rt, s.id)).rejects.toEqual(new ActiveSessionError(other.id));
  });

  it('stempelt geänderte Kinder mit dem Stempel der Änderung', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    const before = st(s, 0, 1).hlc;
    s = await setValues(rt, s.id, st(s, 0, 0).id, { reps: 5 });
    expect(st(s, 0, 0).hlc).toBe(s.hlc);
    expect(st(s, 0, 1).hlc).toBe(before);
  });
});

describe('Notizen (AK-TRN-24, D-260)', () => {
  it('speichert Notizen zu Übung und Einheit, entfernt leere und lehnt zu lange ab', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    const key = ex(s, 0).id;
    s = await setExerciseNote(rt, s.id, key, '  Schulter zwickt  ');
    expect(ex(s, 0).note).toBe('Schulter zwickt');
    s = await setSessionNote(rt, s.id, 'Wenig Schlaf');
    expect(s.notes).toBe('Wenig Schlaf');
    await expect(setExerciseNote(rt, s.id, key, 'x'.repeat(2001))).rejects.toBeInstanceOf(
      NoteTooLongError,
    );
    s = await setSessionNote(rt, s.id, '   ');
    expect(s).not.toHaveProperty('notes');
    expect(ex(s, 0).note).toBe('Schulter zwickt');
    await expect(setExerciseNote(rt, s.id, 'unbekannt', 'x')).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
  });

  it('übernimmt die Notiz in den Verlauf und zeigt sie beim nächsten Mal', async () => {
    let s = await startSession(rt, freeInput('bench_press_barbell'));
    s = await setExerciseNote(rt, s.id, ex(s, 0).id, 'Griff enger');
    s = await completeSet(rt, s.id, st(s, 0, 0).id, {
      ...REST,
      previous: { weightKg: 60, reps: 8 },
    });
    await finishSession(rt, s.id, { skipOpen: true });
    await expect(setExerciseNote(rt, s.id, ex(s, 0).id, 'zu spät')).rejects.toBeInstanceOf(
      SessionClosedError,
    );
    const next = await startSession(rt, freeInput('bench_press_barbell'));
    const row = await latestHistory(rt.db, byKey('bench_press_barbell').id, next.id);
    expect(row?.note).toBe('Griff enger');
    // Die neue Einheit beginnt ohne eigene Notiz.
    expect(ex(next, 0)).not.toHaveProperty('note');
  });
});
