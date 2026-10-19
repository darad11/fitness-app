import { CircleCheck, CloudOff, HardDrive, MonitorSmartphone, Play, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { changeInPeriod, inPeriod, recentValues, Sparkline, useBodyWeights } from '@/modules/body';
import { pickDaily, TasksCard } from '@/modules/habits';
import { useFormatters } from '@/modules/settings';
import {
  ActiveProgramCard,
  compareWithPrevious,
  formatClock,
  sessionDurationSec,
  sessionProgress,
  summarizeSession,
  useActiveProgram,
  useActiveSession,
  useCompletedSessions,
  useStartSession,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import { currentPlatform } from '@/shared/lib/platform';
import { dayKey } from '@/shared/lib/time';
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
  const sessions = useCompletedSessions();
  const weights = useBodyWeights();
  const now = useToday(1000);
  const last = sessions?.[0];
  const lastSummary = last ? summarizeSession(last) : null;
  const lastComparison = sessions?.[0] ? compareWithPrevious(sessions[0], sessions) : null;
  const latestWeight = weights?.[0];
  const weightChange = weights ? changeInPeriod(inPeriod(weights, '30d', now)) : null;
  const sparkValues = weights ? recentValues(weights) : [];
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
      <PageHeader
        eyebrow={formatters.weekdayDayMonth(today)}
        title={t.today.title}
        subtitle={pickDaily(t.motivation.sentences, dayKey(today, formatters.timeZone))}
      />
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
        <TasksCard />
        {last && lastSummary ? (
          <Card eyebrow={t.today.lastTitle} title={last.title}>
            <p className="-mt-2 text-sm text-muted tabular-nums">
              {formatters.weekdayDayMonth(new Date(`${last.dayKey}T12:00:00`))} ·{' '}
              {t.history.summary(
                formatClock(lastSummary.durationSec),
                t.history.sets(lastSummary.doneSets),
                formatters.loadKg(lastSummary.volumeKg),
              )}
            </p>
            {lastComparison ? (
              <p className="mt-2 text-sm text-muted tabular-nums">
                {t.today.lastCompare(
                  `${lastComparison.volumeDiffKg >= 0 ? '+' : '−'}${formatters.loadKg(Math.abs(lastComparison.volumeDiffKg))}`,
                  `${lastComparison.doneSetsDiff >= 0 ? '+' : '−'}${formatters.number(Math.abs(lastComparison.doneSetsDiff))}`,
                )}
              </p>
            ) : null}
            <ButtonLink
              to={`/training/verlauf/${last.id}`}
              variant="secondary"
              size="sm"
              className="mt-4"
            >
              {t.today.lastOpen}
            </ButtonLink>
          </Card>
        ) : null}
        <Card
          title={t.body.title}
          action={
            <Link
              to="/fortschritt/gewicht"
              className="inline-flex min-h-11 items-center font-semibold text-accent-ink"
            >
              {latestWeight ? t.today.weightOpen : t.body.add}
            </Link>
          }
        >
          {latestWeight ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatters.bodyWeightKg(latestWeight.weightKg)}
                </p>
                <p className="text-sm text-muted">
                  {t.body.lastMeasured(formatters.dateTimeShort(new Date(latestWeight.measuredAt)))}
                  {weightChange !== null
                    ? ` · ${weightChange > 0 ? '+' : weightChange < 0 ? '−' : ''}${formatters.bodyWeightKg(Math.abs(weightChange))} ${t.body.periods['30d']}`
                    : ''}
                </p>
              </div>
              {sparkValues.length >= 3 ? <Sparkline values={sparkValues} /> : null}
            </div>
          ) : (
            <p className="text-muted">{t.today.weightNone}</p>
          )}
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
