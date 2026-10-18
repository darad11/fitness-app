// Öffentliche Schnittstelle des Moduls „exercises" (Basisbibliothek, Suche).
import { lazy } from 'react';

/** Übungsauswahl (S-39), erst beim Öffnen geladen, damit sie den Start nicht verlangsamt. */
export const ExercisePicker = lazy(async () => ({
  default: (await import('./ui/ExercisePicker')).ExercisePicker,
}));
export type { ExercisePickerProps } from './ui/ExercisePicker';
export { exercisesRoutes } from './routes';
export { coreExerciseId, loadCoreExercises } from './data/coreLibrary';
export {
  EQUIPMENT,
  MUSCLES,
  TRACKING_MODES,
  distanceUnitSchema,
  trackingModeSchema,
  type DistanceUnit,
  type Equipment,
  type Exercise,
  type Muscle,
  type TrackingMode,
} from './model/exercise';
