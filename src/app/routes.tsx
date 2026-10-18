import { redirect, type RouteObject } from 'react-router';
import { dashboardRoutes } from '@/modules/dashboard';
import { settingsRoutes } from '@/modules/settings';
import { NotFoundPage, RootErrorView, RouteErrorView, ShellFallback } from './errors/ErrorViews';
import { AppLayout } from './layout/AppLayout';

/**
 * Routen im Data Mode (architecture.md Abschnitt 8). Bereiche werden nachgeladen.
 * Die innere, pfadlose Route trägt die Fehlergrenze je Ansicht; der Rahmen bleibt stehen.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: RootErrorView,
    HydrateFallback: ShellFallback,
    children: [
      {
        ErrorBoundary: RouteErrorView,
        children: [
          { index: true, loader: () => redirect('/heute') },
          ...dashboardRoutes,
          ...settingsRoutes,
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
