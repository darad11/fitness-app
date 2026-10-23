import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Smartphone, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router';
import {
  META_KEYS,
  dismissHint,
  getMetaValue,
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

export function GlobalBanners() {
  return (
    <>
      <ConnectionBanner />
      <SessionBanner />
      <UpdateBanner />
      <InstallHintBanner />
    </>
  );
}
