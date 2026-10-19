import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { createTestRuntime } from '@/shared/testing/db';
import { loadTrainingState, TRAINING_STATE_ID } from '../data/trainingStateRepository';
import { loadCoreExercises } from '@/modules/exercises';
import { addExercise, updateSet } from '../calc/programEdit';
import { getOwnProgram, listOwnPrograms, programDef } from '../data/programRepository';
import { loadSampleTemplate } from '../data/sampleTemplates';
import { getDoc } from '@/shared/db';
import { uuidv4 } from '@/shared/lib/uuid';
import {
  activateProgram,
  copyProgram,
  createProgram,
  deactivateProgram,
  deleteProgram,
  editProgram,
  InvalidProgramError,
  restoreProgram,
  setArchived,
} from './programService';
import { planFromTemplateDay, startSession } from './sessionService';
import { sessionDef } from '../data/sessionRepository';

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

describe('Eigene Programme (AK-PRG-01 bis AK-PRG-06, AK-PRG-10, AK-PRG-11, D-257)', () => {
  const names = { firstWeek: 'Woche 1', firstDay: 'Tag 1' };

  it('legt ein Programm mit einer Woche und einem Tag an', async () => {
    const program = await createProgram(rt, { name: '  Mein Plan ', description: ' ', ...names });
    expect(program).toMatchObject({
      kind: 'program',
      origin: 'user',
      name: 'Mein Plan',
      repeat: true,
    });
    expect(program).not.toHaveProperty('description');
    expect(program.weeks).toEqual([
      {
        id: program.weeks[0]?.id,
        position: 0,
        name: 'Woche 1',
        days: [{ id: program.weeks[0]?.days[0]?.id, position: 0, name: 'Tag 1', exercises: [] }],
      },
    ]);
    const stored = await rt.db.programs.get(program.id);
    expect(stored).toMatchObject({ type: 'program', schemaVersion: 1, deletedAt: null });
    expect(await listOwnPrograms(rt.db)).toHaveLength(1);
  });

  it('lehnt einen leeren oder zu langen Namen ab', async () => {
    await expect(createProgram(rt, { name: '  ', ...names })).rejects.toBeInstanceOf(
      InvalidProgramError,
    );
    await expect(createProgram(rt, { name: 'x'.repeat(81), ...names })).rejects.toBeInstanceOf(
      InvalidProgramError,
    );
    expect(await rt.db.programs.count()).toBe(0);
  });

  it('übernimmt ein gebündeltes Programm als unabhängige Kopie (AK-PRG-06)', async () => {
    const sample = await loadSampleTemplate('winter_arc_2026');
    if (!sample) throw new Error('Winter Arc fehlt');
    const copy = await copyProgram(rt, sample, { name: sample.name, kind: 'program' });
    expect(copy).toMatchObject({
      origin: 'sample-copy',
      sampleKey: 'winter_arc_2026',
      name: sample.name,
      repeat: sample.repeat,
      level: sample.level,
      location: sample.location,
    });
    expect(copy.id).not.toBe(sample.id);
    const sampleIds = new Set(JSON.stringify(sample).match(/[0-9a-f-]{36}/g));
    const copyIds = JSON.stringify(copy.weeks).match(/[0-9a-f-]{36}/g) ?? [];
    // Neue IDs für Wochen, Tage, Übungen und Sätze; nur die Übungs-IDs der Bibliothek bleiben.
    const exerciseIds = new Set((await loadCoreExercises()).map((e) => e.id));
    expect(copyIds.filter((id) => sampleIds.has(id) && !exerciseIds.has(id))).toEqual([]);
    expect(copy.weeks.flatMap((w) => w.days).length).toBe(
      sample.weeks.flatMap((w) => w.days).length,
    );
    // Notizen und Xeela-Namen bleiben erhalten.
    const firstExercise = copy.weeks[0]?.days[0]?.exercises[0];
    expect(firstExercise?.originalName).toBe(sample.weeks[0]?.days[0]?.exercises[0]?.originalName);
  });

  it('dupliziert, speichert als Vorlage und verwendet eine Vorlage (AK-PRG-05, AK-PRG-06)', async () => {
    const original = await createProgram(rt, { name: 'Plan', ...names });
    const duplicate = await copyProgram(rt, original, { name: 'Plan (Kopie)', kind: 'program' });
    const template = await copyProgram(rt, original, { name: 'Plan', kind: 'template' });
    const used = await copyProgram(rt, template, { name: 'Plan', kind: 'program' });
    expect([duplicate.kind, template.kind, used.kind]).toEqual(['program', 'template', 'program']);
    expect(duplicate.name).toBe('Plan (Kopie)');
    expect(new Set([original.id, duplicate.id, template.id, used.id]).size).toBe(4);
    expect(duplicate.weeks[0]?.id).not.toBe(original.weeks[0]?.id);
    // Unabhängig: Änderung an der Kopie lässt das Original unverändert.
    await editProgram(rt, duplicate.id, (plan) => ({ ...plan, name: 'Anders' }));
    expect((await getOwnProgram(rt.db, original.id))?.name).toBe('Plan');
  });

  it('bearbeitet mit Stempeln je Element; gestartete Einheiten bleiben unverändert (AK-PRG-10)', async () => {
    const [bench] = (await loadCoreExercises()).filter((e) => e.trackingMode === 'weight_reps');
    if (!bench) throw new Error('Übung fehlt');
    let program = await createProgram(rt, { name: 'Plan', ...names });
    const dayId = program.weeks[0]!.days[0]!.id;
    program = await editProgram(rt, program.id, (plan) => ({
      ...plan,
      weeks: addExercise(plan.weeks, dayId, bench, uuidv4),
    }));
    const lookup = new Map((await loadCoreExercises()).map((e) => [e.id, e]));
    const session = await startSession(
      rt,
      planFromTemplateDay(program, 0, 0, (id) => lookup.get(id), 'program'),
    );
    const setId = program.weeks[0]!.days[0]!.exercises[0]!.sets[0]!.id;
    const before = (await getDoc(rt.db, programDef, program.id))!;
    program = await editProgram(rt, program.id, (plan) => ({
      ...plan,
      weeks: updateSet(plan.weeks, setId, { reps: { min: 3, max: 5 }, weightKg: 100 }),
    }));
    const after = (await getDoc(rt.db, programDef, program.id))!;
    const storedSets = after.weeks[0]!.days[0]!.exercises[0]!.sets;
    expect(storedSets[0]?.hlc).not.toBe(before.weeks[0]!.days[0]!.exercises[0]!.sets[0]!.hlc);
    expect(storedSets[1]?.hlc).toBe(before.weeks[0]!.days[0]!.exercises[0]!.sets[1]!.hlc);
    expect(after.weeks[0]?.hlc).toBe(before.weeks[0]?.hlc);
    // Die laufende Einheit trägt ihre eigene Kopie.
    const running = await getDoc(rt.db, sessionDef, session.id);
    expect(running?.exercises[0]?.sets[0]?.target).toEqual({ repsMin: 8, repsMax: 12 });
    expect(program.weeks[0]?.days[0]?.exercises[0]?.sets[0]).toMatchObject({
      repsMin: 3,
      repsMax: 5,
      weightKg: 100,
    });
    // Neue Einheiten übernehmen das Zielgewicht als Ziel.
    const plan = planFromTemplateDay(program, 0, 0, (id) => lookup.get(id), 'program');
    expect(plan.exercises[0]?.sets[0]?.target).toEqual({ repsMin: 3, repsMax: 5, weightKg: 100 });
    expect(plan.program).not.toHaveProperty('sampleKey');
  });

  it('lehnt ein Programm ohne Woche oder mit leerer Woche ab, ohne zu speichern', async () => {
    const program = await createProgram(rt, { name: 'Plan', ...names });
    await expect(
      editProgram(rt, program.id, (plan) => ({ ...plan, weeks: [] })),
    ).rejects.toBeInstanceOf(InvalidProgramError);
    await expect(
      editProgram(rt, program.id, (plan) => ({
        ...plan,
        weeks: plan.weeks.map((w) => ({ ...w, days: [] })),
      })),
    ).rejects.toBeInstanceOf(InvalidProgramError);
    expect((await getOwnProgram(rt.db, program.id))?.weeks[0]?.days).toHaveLength(1);
  });

  it('archiviert und beendet dabei ein aktives Programm; holt es zurück', async () => {
    const program = await createProgram(rt, { name: 'Plan', ...names });
    await activateProgram(rt, program.id, at('2026-10-18T10:00:00.000Z'));
    await setArchived(rt, program.id, true, at('2026-10-19T10:00:00.000Z'));
    expect((await getOwnProgram(rt.db, program.id))?.archivedAt).toBe('2026-10-19T10:00:00.000Z');
    expect((await loadTrainingState(rt.db)).activeProgramId).toBeUndefined();
    await setArchived(rt, program.id, false);
    expect(await getOwnProgram(rt.db, program.id)).not.toHaveProperty('archivedAt');
  });

  it('löscht weich, beendet ein aktives Programm und stellt es wieder her (AK-PRG-11)', async () => {
    const program = await createProgram(rt, { name: 'Plan', ...names });
    await activateProgram(rt, program.id);
    expect(await deleteProgram(rt, program.id)).toEqual({ wasActive: true });
    expect(await getOwnProgram(rt.db, program.id)).toBeUndefined();
    expect(typeof (await rt.db.programs.get(program.id))?.deletedAt).toBe('string');
    expect((await loadTrainingState(rt.db)).activeProgramId).toBeUndefined();
    await restoreProgram(rt, program.id);
    expect((await getOwnProgram(rt.db, program.id))?.name).toBe('Plan');
    // Rückgängig aktiviert nicht erneut.
    expect((await loadTrainingState(rt.db)).activeProgramId).toBeUndefined();
  });
});
