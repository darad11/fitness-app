import type { RouteObject } from 'react-router';

/** Seiten unter „Mehr"; jede wird erst beim Aufruf nachgeladen. */
export const settingsRoutes: RouteObject[] = [
  {
    path: 'mehr',
    lazy: async () => ({ Component: (await import('./ui/MorePage')).MorePage }),
  },
  {
    path: 'mehr/einstellungen',
    lazy: async () => ({ Component: (await import('./ui/SettingsPage')).SettingsPage }),
  },
  {
    path: 'mehr/installieren',
    lazy: async () => ({ Component: (await import('./ui/InstallPage')).InstallPage }),
  },
  {
    path: 'mehr/ueber',
    lazy: async () => ({ Component: (await import('./ui/AboutPage')).AboutPage }),
  },
];
