import type { RouteObject } from 'react-router';

/** Wasser in der Ernährung (D-289); erst beim Aufruf geladen. */
export const waterRoutes: RouteObject[] = [
  {
    path: 'ernaehrung/wasser',
    lazy: async () => ({ Component: (await import('./ui/WaterPage')).WaterPage }),
  },
];
