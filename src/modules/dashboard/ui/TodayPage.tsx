import { CircleCheck, CloudOff, HardDrive, MonitorSmartphone, Play, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import {
  formatClock,
  sessionDurationSec,
  sessionProgress,
  useActiveSession,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import { currentPlatform } from '@/shared/lib/platform';
import { usePwaState, type PwaState } from '@/shared/pwa/state';
import {
  ButtonLink,
  Card,
  Meter,
  PageHeader,
  Skeleton,
  StatusList,
  type StatusItem,
} from '@/shared/ui';
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
  const active = useActiveSession();
  const now = useToday(1000);

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
        {active === undefined ? (
          <div aria-busy="true" className="md:col-span-2">
            <Skeleton className="h-44" />
          </div>
        ) : active ? (
          <Card
            tone="ink"
            eyebrow={t.training.running}
            title={active.title}
            className="md:col-span-2"
          >
            <p className="-mt-2 text-on-ink-muted tabular-nums">
              {t.today.runningText(
                formatClock(sessionDurationSec(active, now)),
                t.session.progress(sessionProgress(active).done, sessionProgress(active).total),
              )}
            </p>
            <Meter
              tone="onInk"
              className="mt-3"
              label={t.session.progress(
                sessionProgress(active).done,
                sessionProgress(active).total,
              )}
              value={
                sessionProgress(active).total > 0
                  ? sessionProgress(active).done / sessionProgress(active).total
                  : 0
              }
            />
            <ButtonLink to={`/training/einheit/${active.id}`} variant="onInk" className="mt-5">
              <Play aria-hidden="true" className="size-5" />
              {t.training.resume}
            </ButtonLink>
          </Card>
        ) : (
          <Card
            tone="ink"
            eyebrow={t.today.heroEyebrow}
            title={t.today.heroTitle}
            className="md:col-span-2"
          >
            <p className="-mt-2 max-w-md text-on-ink-muted">{t.today.heroText}</p>
            <ButtonLink to="/training" variant="onInk" className="mt-5">
              <Play aria-hidden="true" className="size-5" />
              {t.today.startLink}
            </ButtonLink>
          </Card>
        )}
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
