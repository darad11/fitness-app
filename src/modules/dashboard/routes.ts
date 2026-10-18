import type { RouteObject } from 'react-router';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'heute',
    lazy: async () => ({ Component: (await import('./ui/TodayPage')).TodayPage }),
  },
];
