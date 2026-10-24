import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Smartphone, TriangleAlert } from 'lucide-react';
import { Component, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import {
  META_KEYS,
  dismissHint,
  getMetaValue,
  logError,
  parseDismissedHints,
  useConnectionState,
  useDb,
} from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { currentPlatform, type PlatformInfo } from '@/shared/lib/platform';
import { applyUpdate, usePwaState } from '@/shared/pwa/state';
import { SessionBanner, useActiveSession } from '@/modules/training';
import { Banner, Button, ButtonLink } from '@/shared/ui';

/** Anderes Fenster hat die Datenbank auf eine neuere Version gebracht. */
export function ConnectionBanner() {
  const state = useConnectionState();
  if (state !== 'replaced') return null;
  return (
    <Banner
      role="alert"
      icon={TriangleAlert}
      tone="warning"
      actions={
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          {t.common.reload}
        </Button>
      }
    >
      {t.banners.replaced}
    </Banner>
  );
}

/**
 * Neue Version geladen; aktiv erst nach Bestätigung (AK-PWA-03). Nie während eines laufenden
 * Trainings (E-01): Der Hinweis erscheint nach dem Beenden. Hat die neue Version in einem anderen
 * Fenster schon übernommen, lädt der Knopf nur neu (D-343).
 */
export function UpdateBanner() {
  const { updateAvailable, reloadPending } = usePwaState();
  // `undefined` beim Laden, `null` ohne laufendes Training.
  const active = useActiveSession();
  if (!updateAvailable && !reloadPending) return null;
  if (active !== null) return null;
  return (
    <Banner
      icon={RefreshCw}
      tone="accent"
      actions={
        <Button
          onClick={() => {
            void applyUpdate();
          }}
        >
          {t.banners.updateNow}
        </Button>
      }
    >
      {t.banners.updateAvailable}
    </Banner>
  );
}

/** iPhone oder iPad im Safari-Tab: Hinweis zur Installation und Datentrennung (AK-PWA-04). */
export function InstallHintBanner({ platform }: { platform?: PlatformInfo }) {
  const { db } = useDb();
  const { pathname } = useLocation();
  const detected = useMemo(() => platform ?? currentPlatform(), [platform]);
  const dismissed = useLiveQuery(
    async () => parseDismissedHints(await getMetaValue(db, META_KEYS.dismissedHints)),
    [db],
  );
  if (!detected.needsIosInstallHint || pathname === '/mehr/installieren') return null;
  if (dismissed === undefined || dismissed.includes('ios-install')) return null;
  return (
    <Banner
      icon={Smartphone}
      tone="accent"
      actions={
        <ButtonLink to="/mehr/installieren" variant="quiet" className="-ml-4">
          {t.banners.installGuide}
        </ButtonLink>
      }
      onDismiss={() => {
        void dismissHint(db, 'ios-install');
      }}
      dismissLabel={t.common.dismiss}
    >
      {t.banners.installHint}
    </Banner>
  );
}

/**
 * Ein Fehler in einer Leiste nimmt nur diese Leiste weg, nicht Navigation und Seiten (B-04):
 * Vorher landete z. B. ein ungültiges Training über „Training läuft“ in der Fehleransicht der App.
 */
class BannerBoundary extends Component<
  { children: ReactNode; onError: (error: unknown) => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function GlobalBanners() {
  const { db } = useDb();
  const report = (area: string) => (error: unknown) => {
    void logError(db, { area, error, route: window.location.pathname });
  };
  return (
    <>
      <BannerBoundary onError={report('banner:connection')}>
        <ConnectionBanner />
      </BannerBoundary>
      <BannerBoundary onError={report('banner:session')}>
        <SessionBanner />
      </BannerBoundary>
      <BannerBoundary onError={report('banner:update')}>
        <UpdateBanner />
      </BannerBoundary>
      <BannerBoundary onError={report('banner:install')}>
        <InstallHintBanner />
      </BannerBoundary>
    </>
  );
}
