import { data, type RouteObject } from 'react-router';
import { loadCoreExercises, loadExerciseVisuals } from '@/modules/exercises';

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
    path: 'training/programme/:id',
    lazy: async () => ({
      Component: (await import('./ui/programs/OwnProgramPage')).OwnProgramPage,
    }),
  },
  {
    path: 'training/programme/:id/bearbeiten',
    lazy: async () => ({
      Component: (await import('./ui/programs/ProgramEditPage')).ProgramEditPage,
    }),
  },
  {
    path: 'training/programme/:id/tage/:dayId',
    lazy: async () => {
      const [{ DayEditPage }] = await Promise.all([
        import('./ui/programs/DayEditPage'),
        loadExerciseVisuals(),
      ]);
      return { Component: DayEditPage };
    },
  },
  {
    path: 'training/vorlagen/:key',
    lazy: async () => {
      const [{ SampleTemplatePage }, { loadSampleTemplate }] = await Promise.all([
        import('./ui/SampleTemplatePage'),
        import('./data/sampleTemplates'),
        loadExerciseVisuals(),
      ]);
      return {
        Component: SampleTemplatePage,
        loader: async ({ params }) => {
          const template = await loadSampleTemplate(params.key ?? '');
          // React Router erwartet hier eine Antwort, kein Error-Objekt; die Fehlergrenze zeigt „Seite nicht gefunden".
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          if (!template) throw data(null, { status: 404 });
          return { template, exercises: await loadCoreExercises() };
        },
      };
    },
  },
  {
    path: 'training/nachtragen',
    lazy: async () => ({ Component: (await import('./ui/LogPage')).LogPage }),
  },
  {
    path: 'training/verlauf',
    lazy: async () => ({ Component: (await import('./ui/HistoryPage')).HistoryPage }),
  },
  {
    path: 'training/verlauf/:id',
    lazy: async () => ({
      Component: (await import('./ui/HistoryDetailPage')).HistoryDetailPage,
    }),
  },
  {
    path: 'training/einheit/:id',
    handle: { fullscreen: true },
    // Visuals vor dem Player (D-397): kein Abruf mehr unterwegs, wenn man gleich weiterwechselt.
    lazy: async () => {
      const [{ SessionPage }] = await Promise.all([
        import('./ui/player/SessionPage'),
        loadExerciseVisuals(),
      ]);
      return { Component: SessionPage };
    },
  },
  {
    path: 'training/einheit/:id/zusammenfassung',
    lazy: async () => {
      const [{ SummaryPage }] = await Promise.all([
        import('./ui/SummaryPage'),
        loadExerciseVisuals(),
      ]);
      return { Component: SummaryPage };
    },
  },
];
