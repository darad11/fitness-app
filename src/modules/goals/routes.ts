import type { RouteObject } from 'react-router';

/** Profil und Ziele unter „Mehr“; erst beim Aufruf geladen. */
export const goalsRoutes: RouteObject[] = [
  {
    path: 'mehr/profil',
    lazy: async () => ({ Component: (await import('./ui/ProfilePage')).ProfilePage }),
  },
];
