import { data, type RouteObject } from 'react-router';
import { loadCoreExercises } from '@/modules/exercises';

/** Bereich Training. Seiten und gebündelte Daten werden erst beim Aufruf geladen (D-242). */
export const trainingRoutes: RouteObject[] = [
  {
    path: 'training',
    lazy: async () => ({ Component: (await import('./ui/TrainingPage')).TrainingPage }),
  },
  {
    path: 'training/programme',
    lazy: async () => {
      const [{ ProgramsPage }, { loadSampleTemplates }] = await Promise.all([
        import('./ui/ProgramsPage'),
        import('./data/sampleTemplates'),
      ]);
      return {
        Component: ProgramsPage,
        loader: () => loadSampleTemplates(),
        shouldRevalidate: () => false,
      };
    },
  },
  {
    path: 'training/vorlagen/:key',
    lazy: async () => {
      const [{ SampleTemplatePage }, { loadSampleTemplate }] = await Promise.all([
        import('./ui/SampleTemplatePage'),
        import('./data/sampleTemplates'),
      ]);
      return {
        Component: SampleTemplatePage,
        loader: async ({ params }) => {
          const template = await loadSampleTemplate(params.key ?? '');
          // React Router erwartet hier eine Antwort, kein Error-Objekt; die Fehlergrenze zeigt „Seite nicht gefunden".
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          if (!template) throw data(null, { status: 404 });
          const unilateral = (await loadCoreExercises())
            .filter((exercise) => exercise.isUnilateral)
            .map((exercise) => exercise.id);
          return { template, unilateral };
        },
      };
    },
  },
];
