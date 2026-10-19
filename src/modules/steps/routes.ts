import type { RouteObject } from 'react-router';

/** Schritte aus dem Dashboard (D-277) unter „Mehr“. */
export const stepsRoutes: RouteObject[] = [
  {
    path: 'mehr/schritte',
    lazy: async () => ({ Component: (await import('./ui/StepsPage')).StepsPage }),
  },
];
