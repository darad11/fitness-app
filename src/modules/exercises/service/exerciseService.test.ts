import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { coreExerciseId } from '../data/coreLibrary';
import {
  exercisePrefId,
  listCustomExercises,
  listExercisePrefs,
  loadExercises,
} from '../data/customExercises';
import {
  categoryFor,
  createCustomExercise,
  InvalidExerciseError,
  savePrefs,
  setCustomExerciseArchived,
  updateCustomExercise,
  type CustomExerciseInput,
} from './exerciseService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const press: CustomExerciseInput = {
  name: '  Brustpresse   Technogym ',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'chest'],
  equipment: ['machine'],
  trackingMode: 'weight_reps',
};

const reason = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof InvalidExerciseError ? error.reason : 'other';
  }
  return 'none';
};

describe('Eigene Übungen (AK-EXL-03, D-258)', () => {
  it('legt eine Übung mit Suchschlüssel und abgeleiteter Kategorie an', async () => {
    const exercise = await createCustomExercise(rt, press);
    expect(exercise).toMatchObject({
      source: 'custom',
      name: 'Brustpresse Technogym',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      equipment: ['machine'],
      category: 'strength',
      trackingMode: 'weight_reps',
    });
    expect(exercise).not.toHaveProperty('key');
    const stored = await rt.db.exercises.get(exercise.id);
    expect(stored).toMatchObject({
      type: 'exercise',
      schemaVersion: 1,
      nameNorm: 'brustpresse technogym',
      deletedAt: null,
    });
  });

  it('setzt die Distanz-Einheit nur bei Zeit und Distanz', async () => {
    const run = await createCustomExercise(rt, {
      name: 'Crosstrainer',
      primaryMuscles: ['full_body'],
      equipment: ['cardio_machine'],
      trackingMode: 'time_distance',
    });
    expect(run).toMatchObject({ category: 'cardio', distanceUnit: 'km' });
    const changed = await updateCustomExercise(rt, run.id, {
      name: 'Crosstrainer',
      primaryMuscles: ['full_body'],
      equipment: ['cardio_machine'],
      trackingMode: 'time',
      distanceUnit: 'm',
    });
    expect(changed).not.toHaveProperty('distanceUnit');
    expect(categoryFor({ trackingMode: 'time', primaryMuscles: ['abs', 'obliques'] })).toBe('core');
  });

  it('lehnt fehlende Angaben ab, ohne zu speichern', async () => {
    expect(await reason(createCustomExercise(rt, { ...press, name: '  ' }))).toBe('name');
    expect(await reason(createCustomExercise(rt, { ...press, name: 'x'.repeat(81) }))).toBe('name');
    expect(await reason(createCustomExercise(rt, { ...press, primaryMuscles: [] }))).toBe('muscle');
    expect(await reason(createCustomExercise(rt, { ...press, equipment: [] }))).toBe('equipment');
    expect(await rt.db.exercises.count()).toBe(0);
  });

  it('bearbeitet, archiviert und holt zurück; archivierte bleiben auffindbar', async () => {
    const exercise = await createCustomExercise(rt, press);
    const renamed = await updateCustomExercise(rt, exercise.id, {
      ...press,
      name: 'Brustpresse',
      isUnilateral: true,
    });
    expect(renamed).toMatchObject({ name: 'Brustpresse', isUnilateral: true });
    const archived = await setCustomExerciseArchived(rt, exercise.id, true, {
      now: () => new Date('2026-10-19T09:00:00.000Z'),
    });
    expect(archived.archivedAt).toBe('2026-10-19T09:00:00.000Z');
    const all = await loadExercises(rt.db);
    expect(all.find((e) => e.id === exercise.id)?.archivedAt).toBe('2026-10-19T09:00:00.000Z');
    expect(all.filter((e) => e.source === 'core')).toHaveLength(124);
    await setCustomExerciseArchived(rt, exercise.id, false);
    expect((await listCustomExercises(rt.db))[0]).not.toHaveProperty('archivedAt');
  });
});

describe('Persönliche Angaben (AK-EXL-04)', () => {
  const benchId = coreExerciseId('bench_press_barbell');

  it('speichert je Übung ein Dokument mit fester ID, auch für Basisübungen', async () => {
    await savePrefs(rt, benchId, {
      notes: ' Bank Stufe 3 ',
      defaultRestSec: 150,
      weightStepKg: 1.25,
      videoUrl: 'https://example.org/bankdruecken',
    });
    const stored = await rt.db.exercisePrefs.get(exercisePrefId(benchId));
    expect(stored).toMatchObject({
      type: 'exercise_pref',
      exerciseId: benchId,
      notes: 'Bank Stufe 3',
      defaultRestSec: 150,
      weightStepKg: 1.25,
      videoUrl: 'https://example.org/bankdruecken',
    });
    // Teiländerung: nicht genannte Felder bleiben, `null` entfernt.
    await savePrefs(rt, benchId, { defaultRestSec: null, notes: 'Griff eng' });
    const prefs = await listExercisePrefs(rt.db);
    expect(prefs.get(benchId)).toMatchObject({ notes: 'Griff eng', weightStepKg: 1.25 });
    expect(prefs.get(benchId)).not.toHaveProperty('defaultRestSec');
    expect(await rt.db.exercisePrefs.count()).toBe(1);
  });

  it('nimmt nur https-Adressen und gültige Werte an', async () => {
    expect(await reason(savePrefs(rt, benchId, { videoUrl: 'http://example.org' }))).toBe('video');
    expect(await reason(savePrefs(rt, benchId, { videoUrl: 'javascript:alert(1)' }))).toBe('video');
    expect(await reason(savePrefs(rt, benchId, { videoUrl: 'https://localhost' }))).toBe('video');
    expect(await reason(savePrefs(rt, benchId, { defaultRestSec: 3601 }))).toBe('rest');
    expect(await reason(savePrefs(rt, benchId, { defaultRestSec: 1.5 }))).toBe('rest');
    expect(await reason(savePrefs(rt, benchId, { weightStepKg: 0.1 }))).toBe('step');
    expect(await rt.db.exercisePrefs.count()).toBe(0);
  });
});
