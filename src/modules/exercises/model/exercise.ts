import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';

/** Aufzählungen aus sample-templates.md Abschnitt 5.2; Erfassungsarten ergänzt um D-241. */
export const MUSCLES = [
  'chest',
  'lats',
  'upper_back',
  'traps',
  'lower_back',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
  'full_body',
] as const;

export const EQUIPMENT = [
  'barbell',
  'ez_bar',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'smith',
  'bench',
  'pullup_bar',
  'dip_station',
  'band',
  'bodyweight',
  'cardio_machine',
  'other',
] as const;

export const CATEGORIES = ['strength', 'cardio', 'mobility', 'core'] as const;

export const TRACKING_MODES = [
  'weight_reps',
  'reps',
  'time',
  'weight_time',
  'time_distance',
  'assisted_reps',
] as const;

/** Gliederung der Bibliothek (exercise-library.md); gefiltert wird nach Muskeln und Gerät. */
export const EXERCISE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps_forearms',
  'triceps',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'lower_leg',
  'conditioning',
] as const;

export const DISTANCE_UNITS = ['m', 'km'] as const;

export const muscleSchema = z.enum(MUSCLES);
export const equipmentSchema = z.enum(EQUIPMENT);
export const categorySchema = z.enum(CATEGORIES);
export const trackingModeSchema = z.enum(TRACKING_MODES);
export const exerciseGroupSchema = z.enum(EXERCISE_GROUPS);
export const distanceUnitSchema = z.enum(DISTANCE_UNITS);

export type Muscle = z.infer<typeof muscleSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type ExerciseCategory = z.infer<typeof categorySchema>;
export type TrackingMode = z.infer<typeof trackingModeSchema>;
export type ExerciseGroup = z.infer<typeof exerciseGroupSchema>;
export type DistanceUnit = z.infer<typeof distanceUnitSchema>;

/** Dauerhafter Schlüssel einer Basisübung (D-240), z. B. `bench_press_barbell`. */
export const CORE_KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const uniqueList = <T extends z.ZodType>(item: T) =>
  z.array(item).refine((list) => new Set(list).size === list.length, 'Doppelter Eintrag');

export const coreExerciseSchema = z
  .strictObject({
    key: z.string().regex(CORE_KEY_PATTERN),
    name: z.string().trim().min(1),
    group: exerciseGroupSchema,
    aliases: uniqueList(z.string().trim().min(1)),
    primaryMuscles: uniqueList(muscleSchema).refine((list) => list.length > 0),
    secondaryMuscles: uniqueList(muscleSchema),
    equipment: uniqueList(equipmentSchema).refine((list) => list.length > 0),
    category: categorySchema,
    trackingMode: trackingModeSchema,
    isUnilateral: z.literal(true).optional(),
    distanceUnit: distanceUnitSchema.optional(),
  })
  .refine(
    (exercise) =>
      (exercise.trackingMode === 'time_distance') === (exercise.distanceUnit !== undefined),
    { message: 'distanceUnit genau bei der Erfassungsart time_distance', path: ['distanceUnit'] },
  )
  .refine(
    (exercise) => !exercise.primaryMuscles.some((m) => exercise.secondaryMuscles.includes(m)),
    { message: 'Muskel zugleich Haupt- und Nebenmuskel', path: ['secondaryMuscles'] },
  );

export type CoreExerciseData = z.infer<typeof coreExerciseSchema>;

/** Gebündelte Basisbibliothek (D-213, D-230): Schlüssel und Namen sind eindeutig. */
export const coreLibrarySchema = z
  .strictObject({
    version: z.literal(1),
    exercises: z.array(coreExerciseSchema).min(1),
  })
  .superRefine((library, ctx) => {
    for (const field of ['key', 'name'] as const) {
      const seen = new Set<string>();
      library.exercises.forEach((exercise, index) => {
        const value = exercise[field];
        if (seen.has(value)) {
          ctx.addIssue({
            code: 'custom',
            message: `Doppelter Wert in ${field}: ${value}`,
            path: ['exercises', index, field],
          });
        }
        seen.add(value);
      });
    }
  });

/**
 * Übung, wie die App sie anzeigt und auswählt: Basisübung aus dem Bündel oder eigene Übung aus
 * der Datenbank (D-258). Nur Basisübungen haben Schlüssel und Gruppe der Bibliothek.
 */
export interface Exercise extends Omit<CoreExerciseData, 'key' | 'group' | 'isUnilateral'> {
  id: string;
  source: 'core' | 'custom';
  key?: string;
  group?: ExerciseGroup;
  isUnilateral?: true;
  /** Nur eigene Übungen: archiviert heißt aus Suche und Auswahl ausgeblendet. */
  archivedAt?: string;
}

export interface CoreExercise extends Exercise {
  source: 'core';
  key: string;
  group: ExerciseGroup;
}

// ---------------------------------------------------------------------------------------------
// Eigene Übungen und persönliche Angaben (data-model.md 3.4, AK-EXL-03, AK-EXL-04, D-258)

export const EXERCISE_SCHEMA_VERSION = 1;
export const EXERCISE_NAME_MAX = 80;

export const customExerciseSchema = defineDocSchema('exercise', {
  name: z.string().trim().min(1).max(EXERCISE_NAME_MAX),
  /** Suchschlüssel des Namens, für den Hinweis auf gleiche Namen und den Index. */
  nameNorm: z.string().min(1),
  aliases: uniqueList(z.string().trim().min(1).max(EXERCISE_NAME_MAX)).max(20),
  primaryMuscles: uniqueList(muscleSchema).min(1).max(5),
  secondaryMuscles: uniqueList(muscleSchema).max(10),
  equipment: uniqueList(equipmentSchema).min(1).max(5),
  category: categorySchema,
  trackingMode: trackingModeSchema,
  isUnilateral: z.literal(true).optional(),
  instructions: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  distanceUnit: distanceUnitSchema.optional(),
  archivedAt: isoDateTimeSchema.optional(),
})
  .refine(
    (exercise) =>
      (exercise.trackingMode === 'time_distance') === (exercise.distanceUnit !== undefined),
    { message: 'distanceUnit genau bei der Erfassungsart time_distance', path: ['distanceUnit'] },
  )
  .refine(
    (exercise) => !exercise.primaryMuscles.some((m) => exercise.secondaryMuscles.includes(m)),
    { message: 'Muskel zugleich Haupt- und Nebenmuskel', path: ['secondaryMuscles'] },
  );

export type CustomExerciseDoc = z.infer<typeof customExerciseSchema>;
export type CustomExerciseData = DocData<CustomExerciseDoc>;

export const PREF_LIMITS = {
  notes: 2000,
  restSec: { min: 0, max: 3600 },
  weightStepKg: { min: 0.25, max: 50 },
  videoUrl: 500,
} as const;

/** Nur Adressen mit https, damit kein Link etwas anderes als eine Webseite öffnet. */
export const videoUrlSchema = z
  .string()
  .trim()
  .max(PREF_LIMITS.videoUrl)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'Nur https-Adressen');

/** Persönliche Angaben je Übung, auch zu Basisübungen; App-Updates berühren sie nie (AK-EXL-04). */
export const exercisePrefSchema = defineDocSchema('exercise_pref', {
  exerciseId: z.uuid(),
  notes: z.string().trim().min(1).max(PREF_LIMITS.notes).optional(),
  defaultRestSec: z
    .number()
    .int()
    .min(PREF_LIMITS.restSec.min)
    .max(PREF_LIMITS.restSec.max)
    .optional(),
  weightStepKg: z
    .number()
    .min(PREF_LIMITS.weightStepKg.min)
    .max(PREF_LIMITS.weightStepKg.max)
    .optional(),
  videoUrl: videoUrlSchema.optional(),
  hidden: z.boolean().optional(),
  favorite: z.boolean().optional(),
});

export type ExercisePref = z.infer<typeof exercisePrefSchema>;
export type ExercisePrefData = DocData<ExercisePref>;
