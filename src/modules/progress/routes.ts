import type { RouteObject } from 'react-router';
import { loadExerciseVisuals } from '@/modules/exercises';

/**
 * Fortschritt (S-27), Übungsverlauf (C-02) und Übungsdetail (S-13). Das Detail liegt hier, weil es
 * die letzten Einheiten aus dem Training zeigt; die Seiten laden erst beim Aufruf.
 */
export const progressRoutes: RouteObject[] = [
  {
    path: 'fortschritt',
    lazy: async () => ({
      Component: (await import('./ui/ProgressPage')).ProgressPage,
    }),
  },
  {
    path: 'fortschritt/uebung/:exerciseId',
    lazy: async () => ({
      Component: (await import('./ui/ExerciseProgressPage')).ExerciseProgressPage,
    }),
  },
  {
    path: 'uebungen/:exerciseId',
    lazy: async () => {
      const [{ ExerciseDetailPage }] = await Promise.all([
        import('./ui/ExerciseDetailPage'),
        loadExerciseVisuals(),
      ]);
      return { Component: ExerciseDetailPage };
    },
  },
];
