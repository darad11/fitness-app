// Ein gemeinsamer Einstieg für alles, was die Modulschnittstelle nachlädt (D-397, D-398): So legt
// Vite nur eine Liste vorzuladender Dateien an, und die Startansicht bleibt wie vor der Phase.
export { ExerciseDemo, ExerciseThumb } from './ExerciseVisual';
export { ExerciseGuideView } from './ExerciseGuideView';
export { loadVisualIndex, preloadVisual, resetMediaCacheForTests } from '../data/media';
// Muskelkarte (D-401) als eigener Teil: Die Pfade sind groß und werden nur im Reiter „Muskeln“ gebraucht.
export const loadMuscleMap = () => import('./MuscleMap');
