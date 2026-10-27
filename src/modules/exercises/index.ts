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
// Visuals und Ausführung (D-397, D-398): Komponenten ohne Seitenimporte; Daten und Bilder laden
// erst, wenn eine Übung angezeigt wird.
// Wie `ExercisePicker` nur als `lazy` exportiert, damit nichts davon in die Startansicht kommt.
// Andere Module setzen eine eigene `Suspense` mit dem Symbol in der Kachel als Platzhalter.
/** Vorschaubild links neben dem Namen in Übungslisten (D-397). */
const visuals = () => import('./ui/visuals');
export const ExerciseThumb = lazy(async () => ({ default: (await visuals()).ExerciseThumb }));
/** Demonstration der Übung im Player, in der Übungsinfo und in den Details (D-397). */
export const ExerciseDemo = lazy(async () => ({ default: (await visuals()).ExerciseDemo }));
/** Ausführung mit Quellen (D-398). */
export const ExerciseGuideView = lazy(async () => ({
  default: (await visuals()).ExerciseGuideView,
}));
export type { ExerciseDemoProps } from './ui/ExerciseVisual';

/** Lädt die Demonstrationen der genannten Übungen vor (aktuelle und nächste im Player). */
export async function preloadExerciseDemos(exerciseIds: readonly string[]): Promise<void> {
  const { loadVisualIndex, preloadVisual } = await visuals();
  const index = await loadVisualIndex();
  for (const id of exerciseIds) {
    const entry = index.get(id);
    if (entry) preloadVisual(entry.visual);
  }
}

/** Nur für Tests anderer Module: geladene Visuals und Texte vergessen. */
export async function resetExerciseMediaForTests(): Promise<void> {
  (await visuals()).resetMediaCacheForTests();
}
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
