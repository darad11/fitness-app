import type { RouteObject } from 'react-router';

/**
 * Übungsbibliothek (S-12); Seite und Daten werden erst beim Aufruf geladen. Das Übungsdetail
 * (S-13) liegt im Modul „progress“, weil es die letzten Einheiten zeigt.
 */
export const exercisesRoutes: RouteObject[] = [
  {
    path: 'uebungen',
    lazy: async () => ({
      Component: (await import('./ui/ExerciseLibraryPage')).ExerciseLibraryPage,
    }),
  },
];
