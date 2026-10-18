import type { RouteObject } from 'react-router';

/** Körpergewicht (S-28); Seite und Diagrammbibliothek werden erst beim Aufruf geladen. */
export const bodyRoutes: RouteObject[] = [
  {
    path: 'fortschritt/gewicht',
    lazy: async () => ({ Component: (await import('./ui/BodyWeightPage')).BodyWeightPage }),
  },
];
