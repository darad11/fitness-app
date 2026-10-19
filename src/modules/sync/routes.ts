import type { RouteObject } from 'react-router';

/** Synchronisierung (D-269) unter „Mehr“. */
export const syncRoutes: RouteObject[] = [
  {
    path: 'mehr/synchronisierung',
    lazy: async () => ({ Component: (await import('./ui/SyncPage')).SyncPage }),
  },
];
