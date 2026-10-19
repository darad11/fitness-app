import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useDb, type AppDb, type DocDef } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import {
  customExerciseSchema,
  EXERCISE_SCHEMA_VERSION,
  exercisePrefSchema,
  type CoreExercise,
  type CustomExerciseDoc,
  type Exercise,
  type ExercisePref,
} from '../model/exercise';
import { loadCoreExercises } from './coreLibrary';

export const customExerciseDef: DocDef<CustomExerciseDoc> = {
  type: 'exercise',
  schemaVersion: EXERCISE_SCHEMA_VERSION,
  schema: customExerciseSchema,
  table: (db) => db.exercises,
};

export const exercisePrefDef: DocDef<ExercisePref> = {
  type: 'exercise_pref',
  schemaVersion: EXERCISE_SCHEMA_VERSION,
  schema: exercisePrefSchema,
  table: (db) => db.exercisePrefs,
};

/** Eine Angabe je Übung, auf allen Geräten dieselbe ID (data-model.md 3.4). */
export function exercisePrefId(exerciseId: string): string {
  return stableId(`exercise_pref:${exerciseId}`);
}

/** Dokument in Anzeigeform; das Etikett „eigene" kommt aus `source`. */
export function toExercise(doc: CustomExerciseDoc): Exercise {
  return {
    id: doc.id,
    source: 'custom',
    name: doc.name,
    aliases: doc.aliases,
    primaryMuscles: doc.primaryMuscles,
    secondaryMuscles: doc.secondaryMuscles,
    equipment: doc.equipment,
    category: doc.category,
    trackingMode: doc.trackingMode,
    ...(doc.isUnilateral ? { isUnilateral: true as const } : {}),
    ...(doc.distanceUnit ? { distanceUnit: doc.distanceUnit } : {}),
    ...(doc.archivedAt ? { archivedAt: doc.archivedAt } : {}),
  };
}

/** Alle nicht gelöschten eigenen Übungen, auch archivierte; ungültige werden übersprungen. */
export async function listCustomExercises(db: AppDb): Promise<Exercise[]> {
  const rows = await db.exercises.toArray();
  return rows.flatMap((row) => {
    if (row.type !== 'exercise' || row.deletedAt !== null) return [];
    const parsed = customExerciseSchema.safeParse(row);
    return parsed.success ? [toExercise(parsed.data)] : [];
  });
}

export async function listExercisePrefs(db: AppDb): Promise<Map<string, ExercisePref>> {
  const rows = await db.exercisePrefs.toArray();
  const prefs = new Map<string, ExercisePref>();
  for (const row of rows) {
    if (row.type !== 'exercise_pref' || row.deletedAt !== null) continue;
    const parsed = exercisePrefSchema.safeParse(row);
    if (parsed.success) prefs.set(parsed.data.exerciseId, parsed.data);
  }
  return prefs;
}

/** Basisübungen und eigene Übungen (auch archivierte, damit Verlauf und Pläne sie finden). */
export async function loadExercises(db: AppDb): Promise<readonly Exercise[]> {
  const [core, custom] = await Promise.all([loadCoreExercises(), listCustomExercises(db)]);
  return [...core, ...custom];
}

function useCoreExercises(): readonly CoreExercise[] | undefined {
  const [core, setCore] = useState<readonly CoreExercise[]>();
  useEffect(() => {
    let active = true;
    loadCoreExercises().then(
      (list) => {
        if (active) setCore(list);
      },
      () => {
        if (active) setCore([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return core;
}

/**
 * Alle Übungen, reaktiv: Basis und eigene, auch archivierte. Für Suche und Auswahl filtert die
 * Oberfläche archivierte heraus. `undefined` beim Laden.
 */
export function useExercises(): readonly Exercise[] | undefined {
  const { db } = useDb();
  const core = useCoreExercises();
  const custom = useLiveQuery(() => listCustomExercises(db), [db]);
  return useMemo(() => (core && custom ? [...core, ...custom] : undefined), [core, custom]);
}

/** Persönliche Angaben nach Übungs-ID, reaktiv; `undefined` beim Laden. */
export function useExercisePrefs(): ReadonlyMap<string, ExercisePref> | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listExercisePrefs(db), [db]);
}
