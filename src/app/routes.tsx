import { redirect, type RouteObject } from 'react-router';
import { bodyRoutes } from '@/modules/body';
import { dashboardRoutes } from '@/modules/dashboard';
import { exercisesRoutes } from '@/modules/exercises';
import { progressRoutes } from '@/modules/progress';
import { settingsRoutes } from '@/modules/settings';
import { trainingRoutes } from '@/modules/training';
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
          ...trainingRoutes,
          ...bodyRoutes,
          ...progressRoutes,
          ...exercisesRoutes,
          ...settingsRoutes,
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
