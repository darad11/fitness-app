import { beforeAll, describe, expect, it, vi } from 'vitest';
import { stableId } from '@/shared/lib/uuid';
import { TRACKING_MODES } from '../model/exercise';
import raw from './core-exercises.v1.json';
import { coreExerciseId, loadCoreExercises, parseCoreLibrary } from './coreLibrary';

type RawLibrary = typeof raw;
const clone = (): RawLibrary => structuredClone(raw);

describe('Basisbibliothek (AK-EXL-01)', () => {
  let exercises: Awaited<ReturnType<typeof loadCoreExercises>>;
  beforeAll(async () => {
    exercises = await loadCoreExercises();
  });

  it('enthält mindestens 100 gültige Übungen mit Name, Hauptmuskeln, Gerät und Erfassungsart', () => {
    expect(exercises.length).toBe(105);
    for (const exercise of exercises) {
      expect(exercise.name.length).toBeGreaterThan(0);
      expect(exercise.primaryMuscles.length).toBeGreaterThan(0);
      expect(exercise.equipment.length).toBeGreaterThan(0);
      expect(TRACKING_MODES).toContain(exercise.trackingMode);
    }
  });

  it('bildet die ID per UUID v5 aus dem Schlüssel (D-240); IDs sind eindeutig', () => {
    const bench = exercises.find((exercise) => exercise.key === 'bench_press_barbell');
    expect(bench?.id).toBe(stableId('core-exercise:bench_press_barbell'));
    expect(coreExerciseId('bench_press_barbell')).toBe(bench?.id);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length);
  });

  it('lädt die Daten nur einmal und liefert dieselbe, unveränderliche Liste', async () => {
    expect(await loadCoreExercises()).toBe(exercises);
    expect(Object.isFrozen(exercises)).toBe(true);
  });

  it('enthält die Antworten der Durchsicht (Q-05, D-241)', () => {
    const byKey = new Map(exercises.map((exercise) => [exercise.key, exercise]));
    expect(byKey.has('seated_cable_row_close')).toBe(false);
    expect(byKey.get('seated_cable_row')?.aliases).toContain('enger Griff');
    expect(byKey.get('assisted_pull_up')?.trackingMode).toBe('assisted_reps');
    expect(byKey.get('assisted_dip')?.trackingMode).toBe('assisted_reps');
    expect(byKey.get('rowing_machine')).toMatchObject({
      trackingMode: 'time_distance',
      distanceUnit: 'm',
    });
    for (const key of ['treadmill', 'stationary_bike', 'elliptical']) {
      expect(byKey.get(key)).toMatchObject({ trackingMode: 'time_distance', distanceUnit: 'km' });
    }
  });
});

describe('Prüfung der gebündelten Daten', () => {
  it('lehnt doppelte Schlüssel und Namen ab', () => {
    const data = clone();
    data.exercises.push({ ...data.exercises[0]! });
    expect(() => parseCoreLibrary(data)).toThrow(/Doppelter Wert in key/);
    const renamed = clone();
    renamed.exercises.push({ ...renamed.exercises[0]!, key: 'neu' });
    expect(() => parseCoreLibrary(renamed)).toThrow(/Doppelter Wert in name/);
  });

  it('verlangt die Distanzeinheit genau bei Dauer und Distanz', () => {
    const missing = clone();
    const rower = missing.exercises.find((exercise) => exercise.key === 'rowing_machine')!;
    delete (rower as { distanceUnit?: string }).distanceUnit;
    expect(() => parseCoreLibrary(missing)).toThrow(/distanceUnit/);
    const extra = clone();
    Object.assign(extra.exercises[0]!, { distanceUnit: 'km' });
    expect(() => parseCoreLibrary(extra)).toThrow(/distanceUnit/);
  });

  it('lehnt unbekannte Felder, Muskeln und ungültige Schlüssel ab', () => {
    const unknownField = clone();
    Object.assign(unknownField.exercises[0]!, { bild: 'x.png' });
    expect(() => parseCoreLibrary(unknownField)).toThrow();
    const unknownMuscle = clone();
    unknownMuscle.exercises[0]!.primaryMuscles = ['nacken'];
    expect(() => parseCoreLibrary(unknownMuscle)).toThrow();
    const badKey = clone();
    badKey.exercises[0]!.key = 'Bankdrücken';
    expect(() => parseCoreLibrary(badKey)).toThrow();
    const overlap = clone();
    overlap.exercises[0]!.secondaryMuscles = [overlap.exercises[0]!.primaryMuscles[0]!];
    expect(() => parseCoreLibrary(overlap)).toThrow(/Haupt- und Nebenmuskel/);
  });
});

describe('Fehler beim Nachladen', () => {
  it('meldet den Fehler und lädt beim nächsten Aufruf erneut', async () => {
    vi.resetModules();
    let fail = true;
    vi.doMock('./core-exercises.v1.json', async (importOriginal) => {
      if (fail) throw new Error('Datei nicht erreichbar');
      return importOriginal();
    });
    const fresh = await import('./coreLibrary');
    await expect(fresh.loadCoreExercises()).rejects.toThrow();
    fail = false;
    vi.resetModules();
    await expect(fresh.loadCoreExercises()).resolves.toHaveLength(105);
    vi.doUnmock('./core-exercises.v1.json');
  });
});
