import type { RouteObject } from 'react-router';

/** Übungsbibliothek (S-12); Seite und Daten werden erst beim Aufruf geladen. */
export const exercisesRoutes: RouteObject[] = [
  {
    path: 'uebungen',
    lazy: async () => {
      const [{ ExerciseLibraryPage }, { loadCoreExercises }] = await Promise.all([
        import('./ui/ExerciseLibraryPage'),
        import('./data/coreLibrary'),
      ]);
      return {
        Component: ExerciseLibraryPage,
        loader: () => loadCoreExercises(),
        // Gebündelte Daten ändern sich nicht; Suche und Filter in der Adresse laden nichts neu.
        shouldRevalidate: () => false,
      };
    },
  },
];
