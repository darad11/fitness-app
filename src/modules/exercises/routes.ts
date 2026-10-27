import type { RouteObject } from 'react-router';

/**
 * Übungsbibliothek (S-12); Seite und Daten werden erst beim Aufruf geladen. Das Übungsdetail
 * (S-13) liegt im Modul „progress“, weil es die letzten Einheiten zeigt.
 */
export const exercisesRoutes: RouteObject[] = [
  {
    path: 'uebungen',
    // Liste der Visuals vor der Seite (D-397), damit beim schnellen Weiterwechseln kein Abruf
    // mehr läuft.
    lazy: async () => {
      const [{ ExerciseLibraryPage }] = await Promise.all([
        import('./ui/ExerciseLibraryPage'),
        import('./ui/visuals').then((m) => m.loadVisualIndex()),
      ]);
      return { Component: ExerciseLibraryPage };
    },
  },
];
