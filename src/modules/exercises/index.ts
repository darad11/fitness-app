// Öffentliche Schnittstelle des Moduls „exercises" (Basisbibliothek, Suche).
export { exercisesRoutes } from './routes';
export { buildSearchIndex, searchExercises, type ExerciseFilter } from './calc/search';
export { coreExerciseId, loadCoreExercises } from './data/coreLibrary';
export {
  EQUIPMENT,
  MUSCLES,
  TRACKING_MODES,
  type DistanceUnit,
  type Equipment,
  type Exercise,
  type Muscle,
  type TrackingMode,
} from './model/exercise';
