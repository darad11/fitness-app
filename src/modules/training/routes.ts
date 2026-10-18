import type { RouteObject } from 'react-router';

export const trainingRoutes: RouteObject[] = [
  {
    path: 'training',
    lazy: async () => ({ Component: (await import('./ui/TrainingPage')).TrainingPage }),
  },
];
