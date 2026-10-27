import { Suspense, useEffect } from 'react';
import { Link, Outlet, useMatches } from 'react-router';
import { ThemeSync } from '@/modules/settings';
import { SyncRunner } from '@/modules/sync';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { PAGE_SCROLLER_ID } from '@/shared/ui/pageScroll';
import { GlobalBanners } from '../banners/GlobalBanners';
import { hideStartSurface } from '../startSurface';
import { ScrollManager } from './ScrollManager';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/** Rahmen aller Bereiche: Seitenleiste ab 1024 px, sonst Tab-Leiste; Hinweisleisten oben. */
export function AppLayout() {
  // Der Trainingsplayer ist eine Vollbildansicht ohne Navigation (design-system.md Abschnitt 9).
  const fullscreen = useMatches().some(
    (match) => (match.handle as { fullscreen?: boolean } | undefined)?.fullscreen === true,
  );
  // Die erste Ansicht steht: Startfläche aus index.html ausblenden (D-325).
  useEffect(() => {
    hideStartSurface();
  }, []);
  return (
    <div className="app-shell">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-button focus:bg-surface focus:shadow-float focus:px-4 focus:py-3"
      >
        {t.nav.skipToContent}
      </a>
      {fullscreen ? null : <Sidebar />}
      {/* Die Seite scrollt in diesem Rahmen, nicht im Fenster (D-384, `pageScroll.ts`). Feste
          Leisten (Tab-Leiste, Fußleiste im Training, Hinweise) liegen außerhalb und stehen beim
          Scrollen still, auch beim Gummiband am Seitenende. */}
      <div id={PAGE_SCROLLER_ID} className="page-scroller">
        <div
          className={cn(
            // Oben Platz für Statusleiste und die Unschärfe von iOS am oberen Rand (D-332).
            'flex min-h-full min-w-0 flex-col pt-[calc(env(safe-area-inset-top)+var(--spacing-edge-clear))] lg:pt-edge-clear',
            !fullscreen && 'app-content',
          )}
        >
          <GlobalBanners />
          <main
            id="inhalt"
            tabIndex={-1}
            className="page-gutters mx-auto w-full max-w-content flex-1 pt-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] outline-none lg:pt-8 lg:pb-10"
          >
            {fullscreen ? null : (
              // Kopfzeile (D-286, D-310, D-325): grüne Kachel mit F plus Wortmarke als Bild aus
              // public/brand, 106 × 28 px wie die Datei (ganze Pixel, D-332), Tippfläche 44 px; am
              // Desktop zeigt die Seitenleiste das Logo. Führt zu „Heute“.
              <div className="-mt-6 mb-2 flex h-header items-center lg:hidden">
                <Link to="/heute" className="flex min-h-touch items-center rounded-input">
                  <img
                    src="/brand/logo-kopfzeile-kompakt.svg"
                    alt={t.app.brandLink}
                    width={106}
                    height={28}
                    className="h-logo w-auto"
                  />
                </Link>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      {fullscreen ? null : <TabBar />}
      <ScrollManager />
      <ThemeSync />
      <Suspense fallback={null}>
        <SyncRunner />
      </Suspense>
    </div>
  );
}
