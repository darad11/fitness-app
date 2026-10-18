import { Outlet } from 'react-router';
import { ThemeSync } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { GlobalBanners } from '../banners/GlobalBanners';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/** Rahmen aller Bereiche: Seitenleiste ab 1024 px, sonst Tab-Leiste; Hinweisleisten oben. */
export function AppLayout() {
  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-input focus:bg-surface focus:px-4 focus:py-3"
      >
        {t.nav.skipToContent}
      </a>
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)] lg:pt-0">
        <GlobalBanners />
        <main
          id="inhalt"
          tabIndex={-1}
          className="page-gutters mx-auto w-full max-w-[1200px] flex-1 pt-6 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] outline-none lg:pt-8 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>
      <TabBar />
      <ThemeSync />
    </div>
  );
}
