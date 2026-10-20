import { redirect, type RouteObject } from 'react-router';
import { bodyRoutes } from '@/modules/body';
import { dashboardRoutes } from '@/modules/dashboard';
import { exercisesRoutes } from '@/modules/exercises';
import { goalsRoutes } from '@/modules/goals';
import { habitsRoutes } from '@/modules/habits';
import { nutritionRoutes } from '@/modules/nutrition';
import { progressRoutes } from '@/modules/progress';
import { settingsRoutes } from '@/modules/settings';
import { shoppingRoutes } from '@/modules/shopping';
import { stepsRoutes } from '@/modules/steps';
import { syncRoutes } from '@/modules/sync';
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
          ...habitsRoutes,
          ...trainingRoutes,
          ...bodyRoutes,
          ...progressRoutes,
          ...exercisesRoutes,
          ...nutritionRoutes,
          ...shoppingRoutes,
          ...settingsRoutes,
          ...syncRoutes,
          ...stepsRoutes,
          ...goalsRoutes,
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
