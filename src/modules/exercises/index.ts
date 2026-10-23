// Öffentliche Schnittstelle des Moduls „exercises" (Basisbibliothek, Suche).
import type { DocDef, RootFields } from '@/shared/db';
import { lazy } from 'react';

/** Übungsauswahl (S-39), erst beim Öffnen geladen, damit sie den Start nicht verlangsamt. */
export const ExercisePicker = lazy(async () => ({
  default: (await import('./ui/ExercisePicker')).ExercisePicker,
}));
export type { ExercisePickerProps } from './ui/ExercisePicker';

/** Eigene Übung anlegen oder bearbeiten (S-14), erst beim Öffnen geladen. */
export const CustomExerciseDialog = lazy(async () => ({
  default: (await import('./ui/CustomExerciseDialog')).CustomExerciseDialog,
}));
/** Persönliche Angaben zu einer Übung (AK-EXL-04), erst beim Öffnen geladen. */
export const ExercisePrefsCard = lazy(async () => ({
  default: (await import('./ui/ExercisePrefsCard')).ExercisePrefsCard,
}));
export { loadExercises, useExercisePrefs, useExercises } from './data/customExercises';
export {
  createCustomExercise,
  savePrefs,
  setCustomExerciseArchived,
  updateCustomExercise,
} from './service/exerciseService';
export { exercisesRoutes } from './routes';
export { coreExerciseId, loadCoreExercises } from './data/coreLibrary';
export { findAlternatives } from './calc/alternatives';
export { describeExercise } from './ui/describe';
export { MuscleTags } from './ui/MuscleTags';
export {
  EQUIPMENT,
  MUSCLES,
  TRACKING_MODES,
  distanceUnitSchema,
  trackingModeSchema,
  type DistanceUnit,
  type Equipment,
  type CoreExercise,
  type Exercise,
  type ExercisePref,
  type Muscle,
  type TrackingMode,
} from './model/exercise';

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): eigene Übungen, persönliche
 * Angaben. Erst bei Bedarf geladen, damit die Startansicht nicht wächst.
 */
export async function exerciseDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/customExercises');
  return [m0.customExerciseDef, m0.exercisePrefDef];
}
