import { Play } from 'lucide-react';
import { Suspense } from 'react';
import { Link } from 'react-router';
import { changeInPeriod, inPeriod, recentValues, Sparkline, useBodyWeights } from '@/modules/body';
import { changeTone, useActiveGoals, WeeklyGoalCard, weightToGoal } from '@/modules/goals';
import { pickDaily, TasksCard } from '@/modules/habits';
import { NutritionTodayCard } from '@/modules/nutrition';
import { useFormatters, useProfile } from '@/modules/settings';
import {
  ActiveProgramCard,
  compareWithPrevious,
  formatClock,
  sessionDurationSec,
  sessionProgress,
  summarizeSession,
  plannedEyebrow,
  useActiveProgram,
  useActiveSession,
  useCompletedSessions,
  useStartSession,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import { dayKey } from '@/shared/lib/time';
import { Button, ButtonLink, Card, Meter, PageHeader, Skeleton } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';

/**
 * „Heute" (S-01): Bühne mit der laufenden Einheit, sonst „Heute geplant" aus dem aktiven
 * Programm (AK-DSH-02), sonst dem freien Einstieg; darunter Aufgaben, Ernährung, letztes
 * Training, Wochenziel und Gewicht. Status und „Diese Version“ entfallen (D-265).
 */
export function TodayPage() {
  const formatters = useFormatters();
  const today = useToday();
  const active = useActiveSession();
  const program = useActiveProgram();
  const sessions = useCompletedSessions();
  const weights = useBodyWeights();
  const goals = useActiveGoals();
  const profile = useProfile();
  const now = useToday(1000);
  const todayKey = dayKey(today, formatters.timeZone);
  const last = sessions?.[0];
  const lastSummary = last ? summarizeSession(last) : null;
  const lastComparison = sessions?.[0] ? compareWithPrevious(sessions[0], sessions) : null;
  const latestWeight = weights?.[0];
  const weightChange = weights ? changeInPeriod(inPeriod(weights, '30d', now)) : null;
  const sparkValues = weights ? recentValues(weights) : [];
  const goalKg = goals?.bodyWeightKg;
  const toGoal =
    latestWeight && goalKg !== undefined ? weightToGoal(latestWeight.weightKg, goalKg) : null;
  const tone =
    latestWeight && weightChange !== null
      ? changeTone(weightChange, latestWeight.weightKg, goalKg)
      : 'neutral';
  const { start, error, busy } = useStartSession();

  return (
    <>
      <PageHeader
        eyebrow={formatters.weekdayDayMonth(today)}
        title={t.today.title}
        subtitle={[
          profile?.displayName ? t.profile.greeting(profile.displayName) : null,
          pickDaily(t.motivation.sentences, todayKey),
        ]
          .filter(Boolean)
          .join(' ')}
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
              eyebrow={plannedEyebrow(program, today)}
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
        <Suspense fallback={null}>
          <NutritionTodayCard />
        </Suspense>
        {sessions && goals ? (
          <WeeklyGoalCard sessions={sessions} target={goals.weeklySessions} today={todayKey} />
        ) : null}
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
                  {weightChange !== null ? (
                    <>
                      {' · '}
                      <span className={tone === 'toward' ? 'text-success' : undefined}>
                        {`${weightChange > 0 ? '+' : weightChange < 0 ? '−' : ''}${formatters.bodyWeightKg(Math.abs(weightChange))} ${t.body.periods['30d']}`}
                      </span>
                    </>
                  ) : null}
                </p>
                {toGoal && goalKg !== undefined ? (
                  <p className="mt-1 text-sm text-muted">
                    {toGoal.reached
                      ? t.goals.goalReached(formatters.bodyWeightKg(goalKg))
                      : toGoal.diffKg > 0
                        ? t.goals.toGoal(
                            formatters.bodyWeightKg(toGoal.diffKg),
                            formatters.bodyWeightKg(goalKg),
                          )
                        : t.goals.toGoalUp(
                            formatters.bodyWeightKg(-toGoal.diffKg),
                            formatters.bodyWeightKg(goalKg),
                          )}
                  </p>
                ) : null}
              </div>
              {sparkValues.length >= 3 ? <Sparkline values={sparkValues} /> : null}
            </div>
          ) : (
            <p className="text-muted">{t.today.weightNone}</p>
          )}
        </Card>
      </div>
    </>
  );
}
