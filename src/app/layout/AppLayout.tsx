import { Suspense } from 'react';
import { Outlet, useMatches } from 'react-router';
import { ThemeSync } from '@/modules/settings';
import { SyncRunner } from '@/modules/sync';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { GlobalBanners } from '../banners/GlobalBanners';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/** Rahmen aller Bereiche: Seitenleiste ab 1024 px, sonst Tab-Leiste; Hinweisleisten oben. */
export function AppLayout() {
  // Der Trainingsplayer ist eine Vollbildansicht ohne Navigation (design-system.md Abschnitt 9).
  const fullscreen = useMatches().some(
    (match) => (match.handle as { fullscreen?: boolean } | undefined)?.fullscreen === true,
  );
  return (
    <div className="min-h-dvh lg:flex">
      <div aria-hidden="true" className="app-backdrop">
        <span />
        <span />
        <span />
      </div>
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-surface focus:shadow-float focus:px-4 focus:py-3"
      >
        {t.nav.skipToContent}
      </a>
      {fullscreen ? null : <Sidebar />}
      <div
        className={cn(
          'flex min-h-dvh min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)] lg:pt-0',
          !fullscreen && 'lg:pl-[5.5rem]',
        )}
      >
        <GlobalBanners />
        <main
          id="inhalt"
          tabIndex={-1}
          className="page-gutters mx-auto w-full max-w-[1200px] flex-1 pt-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] outline-none lg:pt-8 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>
      {fullscreen ? null : <TabBar />}
      <ThemeSync />
      <Suspense fallback={null}>
        <SyncRunner />
      </Suspense>
    </div>
  );
}
