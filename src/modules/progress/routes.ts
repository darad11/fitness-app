import { data, type RouteObject } from 'react-router';
import { loadCoreExercises } from '@/modules/exercises';

/** Fortschritt (S-27) und Übungsverlauf (C-02); Seiten und Diagrammbibliothek erst beim Aufruf. */
export const progressRoutes: RouteObject[] = [
  {
    path: 'fortschritt',
    lazy: async () => ({
      Component: (await import('./ui/ProgressPage')).ProgressPage,
      loader: () => loadCoreExercises(),
      shouldRevalidate: () => false,
    }),
  },
  {
    path: 'fortschritt/uebung/:exerciseId',
    lazy: async () => ({
      Component: (await import('./ui/ExerciseProgressPage')).ExerciseProgressPage,
      loader: async ({ params }) => {
        const exercise = (await loadCoreExercises()).find((e) => e.id === params.exerciseId);
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        if (!exercise) throw data(null, { status: 404 });
        return exercise;
      },
    }),
  },
];
