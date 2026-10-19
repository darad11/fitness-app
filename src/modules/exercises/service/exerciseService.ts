import { insertDoc, updateDoc, upsertDoc, type DbRuntime } from '@/shared/db';
import { searchKey } from '@/shared/lib/normalize';
import {
  customExerciseDef,
  exercisePrefDef,
  exercisePrefId,
  toExercise,
} from '../data/customExercises';
import {
  EXERCISE_NAME_MAX,
  PREF_LIMITS,
  videoUrlSchema,
  type DistanceUnit,
  type Equipment,
  type Exercise,
  type ExerciseCategory,
  type ExercisePref,
  type ExercisePrefData,
  type Muscle,
  type TrackingMode,
} from '../model/exercise';

export interface Clock {
  now?: () => Date;
}

export class InvalidExerciseError extends Error {
  override name = 'InvalidExerciseError';
  constructor(
    readonly reason: 'name' | 'muscle' | 'equipment' | 'video' | 'rest' | 'step' | 'notes',
  ) {
    super(`Ungültige Angabe: ${reason}`);
  }
}

/** Eingaben des Formulars „Eigene Übung" (D-258). */
export interface CustomExerciseInput {
  name: string;
  primaryMuscles: readonly Muscle[];
  secondaryMuscles?: readonly Muscle[];
  equipment: readonly Equipment[];
  trackingMode: TrackingMode;
  isUnilateral?: boolean;
  /** Nur bei Zeit und Distanz; Standard km. */
  distanceUnit?: DistanceUnit;
}

/** Kategorie aus Erfassungsart und Muskeln: Cardio, Rumpf oder Kraft. */
export function categoryFor(
  input: Pick<CustomExerciseInput, 'trackingMode' | 'primaryMuscles'>,
): ExerciseCategory {
  if (input.trackingMode === 'time_distance') return 'cardio';
  if (input.primaryMuscles.every((m) => m === 'abs' || m === 'obliques')) return 'core';
  return 'strength';
}

function buildData(input: CustomExerciseInput) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > EXERCISE_NAME_MAX) throw new InvalidExerciseError('name');
  const primary = [...new Set(input.primaryMuscles)];
  if (primary.length === 0) throw new InvalidExerciseError('muscle');
  const equipment = [...new Set(input.equipment)];
  if (equipment.length === 0) throw new InvalidExerciseError('equipment');
  const secondary = [...new Set(input.secondaryMuscles ?? [])].filter((m) => !primary.includes(m));
  return {
    name,
    nameNorm: searchKey(name),
    aliases: [],
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment,
    category: categoryFor(input),
    trackingMode: input.trackingMode,
    ...(input.isUnilateral ? { isUnilateral: true as const } : {}),
    ...(input.trackingMode === 'time_distance' ? { distanceUnit: input.distanceUnit ?? 'km' } : {}),
  };
}

/** Legt eine eigene Übung an (AK-EXL-03). */
export async function createCustomExercise(
  rt: DbRuntime,
  input: CustomExerciseInput,
): Promise<Exercise> {
  const data = buildData(input);
  return toExercise(await insertDoc(rt, customExerciseDef, data));
}

/**
 * Ändert eine eigene Übung. Abgeschlossene Einheiten behalten ihre Kopie von Name und
 * Erfassungsart; Pläne zeigen den neuen Namen erst nach dem nächsten Bearbeiten des Tags.
 */
export async function updateCustomExercise(
  rt: DbRuntime,
  id: string,
  input: CustomExerciseInput,
): Promise<Exercise> {
  const data = buildData(input);
  const doc = await updateDoc(rt, customExerciseDef, id, (current) => {
    const { isUnilateral: _u, distanceUnit: _d, ...rest } = current;
    return { ...rest, ...data, aliases: current.aliases };
  });
  return toExercise(doc);
}

/** Archivieren blendet die Übung aus Suche und Auswahl aus; Verlauf und Pläne bleiben. */
export async function setCustomExerciseArchived(
  rt: DbRuntime,
  id: string,
  archived: boolean,
  clock: Clock = {},
): Promise<Exercise> {
  const now = (clock.now ?? (() => new Date()))().toISOString();
  const doc = await updateDoc(rt, customExerciseDef, id, (current) => {
    const { archivedAt: _old, ...rest } = current;
    return archived ? { ...rest, archivedAt: now } : rest;
  });
  return toExercise(doc);
}

/** Persönliche Angaben; leere Felder (Text leer, `null`) werden entfernt. */
export interface PrefInput {
  notes?: string | null;
  defaultRestSec?: number | null;
  weightStepKg?: number | null;
  videoUrl?: string | null;
}

/**
 * Speichert persönliche Angaben zu einer Basis- oder eigenen Übung (AK-EXL-04). Eine Angabe je
 * Übung mit fester ID; das Bündel der Basisbibliothek bleibt davon unberührt.
 */
export async function savePrefs(
  rt: DbRuntime,
  exerciseId: string,
  input: PrefInput,
): Promise<ExercisePref> {
  const notes = input.notes?.trim();
  if (notes && notes.length > PREF_LIMITS.notes) throw new InvalidExerciseError('notes');
  const rest = input.defaultRestSec;
  if (
    rest !== undefined &&
    rest !== null &&
    (!Number.isInteger(rest) || rest < PREF_LIMITS.restSec.min || rest > PREF_LIMITS.restSec.max)
  ) {
    throw new InvalidExerciseError('rest');
  }
  const step = input.weightStepKg;
  if (
    step !== undefined &&
    step !== null &&
    (step < PREF_LIMITS.weightStepKg.min || step > PREF_LIMITS.weightStepKg.max)
  ) {
    throw new InvalidExerciseError('step');
  }
  const url = input.videoUrl?.trim();
  if (url && !videoUrlSchema.safeParse(url).success) throw new InvalidExerciseError('video');

  return upsertDoc(rt, exercisePrefDef, exercisePrefId(exerciseId), (current) => {
    const next: Record<string, unknown> = { ...(current ?? {}), exerciseId };
    const apply = (key: string, value: unknown) => {
      if (value === undefined) return;
      if (value === null || value === '') Reflect.deleteProperty(next, key);
      else next[key] = value;
    };
    apply('notes', input.notes === undefined ? undefined : (notes ?? null));
    apply('defaultRestSec', rest);
    apply('weightStepKg', step);
    apply('videoUrl', input.videoUrl === undefined ? undefined : (url ?? null));
    return next as ExercisePrefData;
  });
}
