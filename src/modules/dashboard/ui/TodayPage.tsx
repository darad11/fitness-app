import { CircleCheck, CloudOff, HardDrive, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { currentPlatform } from '@/shared/lib/platform';
import { usePwaState, type PwaState } from '@/shared/pwa/state';
import { Card, PageHeader, StatusList, type StatusItem } from '@/shared/ui';
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
 * „Heute" in M0: Datum, Inhalt dieser Version und echter Status (Offline-Bereitschaft,
 * Startart). Trainings-, Ziel- und Gewichtskarten folgen mit M1 und M3 (S-01).
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
      <PageHeader title={t.today.title} subtitle={formatters.weekdayDayMonth(today)} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={t.today.versionTitle}>
          <p>{t.today.versionText}</p>
        </Card>
        <Card title={t.today.statusTitle}>
          <StatusList items={items} />
        </Card>
      </div>
    </>
  );
}
