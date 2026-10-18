import { CircleCheck, CloudOff, HardDrive, MonitorSmartphone, Play, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import {
  ActiveProgramCard,
  formatClock,
  sessionDurationSec,
  sessionProgress,
  useActiveProgram,
  useActiveSession,
  useStartSession,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import { currentPlatform } from '@/shared/lib/platform';
import { usePwaState, type PwaState } from '@/shared/pwa/state';
import {
  Button,
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
 * „Heute" (S-01): Bühne mit der laufenden Einheit, sonst „Heute geplant" aus dem aktiven
 * Programm (AK-DSH-02), sonst dem freien Einstieg; darunter Inhalt dieser Version und echter
 * Status. Letztes Training und Wochenziel folgen mit M3.
 */
export function TodayPage() {
  const formatters = useFormatters();
  const today = useToday();
  const pwa = usePwaState();
  const platform = useMemo(() => currentPlatform(), []);
  const active = useActiveSession();
  const program = useActiveProgram();
  const now = useToday(1000);
  const { start, error, busy } = useStartSession();

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
        {active === undefined || program === undefined ? (
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
        ) : program ? (
          <div className="md:col-span-2">
            <ActiveProgramCard
              program={program}
              eyebrow={t.today.plannedEyebrow}
              busy={busy}
              onStart={(input) => {
                void start(input);
              }}
            />
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error.message}
              </p>
            ) : null}
          </div>
        ) : (
          <Card
            tone="ink"
            eyebrow={t.today.heroEyebrow}
            title={t.today.heroTitle}
            className="md:col-span-2"
          >
            <p className="-mt-2 max-w-md text-on-ink-muted">{t.today.heroText}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="onInk"
                disabled={busy}
                onClick={() => {
                  void start({ source: 'free', title: t.training.freeTitle, exercises: [] });
                }}
              >
                <Play aria-hidden="true" className="size-5" />
                {t.training.startFree}
              </Button>
              <ButtonLink to="/training/programme" variant="quiet" className="text-on-ink">
                {t.today.chooseTemplate}
              </ButtonLink>
            </div>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-on-ink">
                {error.message}
              </p>
            ) : null}
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
