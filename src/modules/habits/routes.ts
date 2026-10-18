import type { RouteObject } from 'react-router';

/** Tagesaufgaben verwalten; erst beim Aufruf geladen. */
export const habitsRoutes: RouteObject[] = [
  {
    path: 'heute/aufgaben',
    lazy: async () => ({ Component: (await import('./ui/TasksPage')).TasksPage }),
  },
];
