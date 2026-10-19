import { useExercises, type Exercise } from '@/modules/exercises';

/** Basis- und eigene Übungen (auch archivierte, damit Pläne sie finden); `undefined` beim Laden. */
export function useLibrary(): readonly Exercise[] | undefined {
  return useExercises();
}
