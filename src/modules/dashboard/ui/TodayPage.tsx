import { CircleCheck, CloudOff, HardDrive, MonitorSmartphone, Play, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { currentPlatform } from '@/shared/lib/platform';
import { usePwaState, type PwaState } from '@/shared/pwa/state';
import { ButtonLink, Card, PageHeader, StatusList, type StatusItem } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';

function offlineStatus(pwa: PwaState): StatusItem {
  if (!pwa.supported) {
    return { id: 'offline', icon: CloudOff, tone: 'neutral', content: t.today.offlineUnsupported };
  }
  if (pwa.offlineReady) {
    return { id: 'offline', icon: CircleCheck, tone: 'success', content: t.today.offlineReady };
  }
  return { id: 'offline', icon: RefreshCw, tone: 'neutral', content: t.today.offlinePreparing };
}

/**
 * „Heute" (S-01): Bühne mit dem Einstieg ins Training, darunter Inhalt dieser Version und
 * echter Status. Programmkarte, letztes Training und Wochenziel folgen mit AP 1.7 und M3.
 */
export function TodayPage() {
  const formatters = useFormatters();
  const today = useToday();
  const pwa = usePwaState();
  const platform = useMemo(() => currentPlatform(), []);

  const items: StatusItem[] = [
    offlineStatus(pwa),
    platform.isStandalone
      ? { id: 'install', icon: CircleCheck, tone: 'success', content: t.today.installed }
      : {
          id: 'install',
          icon: MonitorSmartphone,
          tone: 'neutral',
          content: (
            <>
              <span>{t.today.notInstalled}</span>
              <Link
                to="/mehr/installieren"
                className="inline-flex min-h-11 items-center font-semibold text-accent-ink underline-offset-4 hover:underline"
              >
                {t.today.installLink}
              </Link>
            </>
          ),
        },
    { id: 'local', icon: HardDrive, tone: 'neutral', content: t.today.localData },
  ];

  return (
    <>
      <PageHeader eyebrow={formatters.weekdayDayMonth(today)} title={t.today.title} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card tone="ink" eyebrow={t.today.heroEyebrow} className="md:col-span-2">
          <h2 className="text-2xl font-bold">{t.today.heroTitle}</h2>
          <p className="mt-2 max-w-md text-on-ink-muted">{t.today.heroText}</p>
          <ButtonLink to="/training" variant="onInk" className="mt-5">
            <Play aria-hidden="true" className="size-5" />
            {t.today.startLink}
          </ButtonLink>
        </Card>
        <Card title={t.today.statusTitle}>
          <StatusList items={items} />
        </Card>
        <Card title={t.today.versionTitle}>
          <p className="text-muted">{t.today.versionText}</p>
        </Card>
      </div>
    </>
  );
}
