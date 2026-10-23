import { Play } from 'lucide-react';
import { Suspense, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  changeInPeriod,
  inPeriod,
  recentValues,
  useBodyWeights,
  WeightCurve,
} from '@/modules/body';
import { changeTone, useActiveGoals, WeeklyGoalCard, weightToGoal } from '@/modules/goals';
import { TasksCard } from '@/modules/habits';
import { NutritionTodayCard } from '@/modules/nutrition';
import { useFormatters, useProfile } from '@/modules/settings';
import { StepsTodayCard } from '@/modules/steps';
import { WaterCard } from '@/modules/water';
import {
  ActiveProgramCard,
  compareWithPrevious,
  formatClock,
  LIGHT_QUERY,
  nextDayInput,
  sessionDurationSec,
  sessionProgress,
  summarizeSession,
  plannedEyebrow,
  plannedRest,
  ReadyCard,
  useActiveProgram,
  useActiveSession,
  useCompletedSessions,
  useStartSession,
} from '@/modules/training';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { dayKey, hourIn } from '@/shared/lib/time';
import { ButtonLink, Card, Meter, Skeleton } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { ReturnSheet, useReturnFlow, type ReturnChoice } from './ReturnFlow';

/**
 * „Heute" (S-01): Bühne mit der laufenden Einheit, sonst „Heute geplant" aus dem aktiven
 * Programm (AK-DSH-02), sonst dem freien Einstieg; darunter Aufgaben, Ernährung, letztes
 * Training, Wochenziel und Gewicht. Status und „Diese Version“ entfallen (D-265). Nach einer
 * Pause von 14 Tagen der Rückkehr-Flow (D-319), beim ersten Start ein Satz unter dem Gruß.
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
  const hour = hourIn(now, formatters.timeZone);
  const navigate = useNavigate();
  const flow = useReturnFlow(todayKey);
  const steps = useRef<HTMLDivElement>(null);
  const [stepsHighlighted, setStepsHighlighted] = useState(false);
  const choose = (choice: ReturnChoice) => {
    flow.close();
    if (choice === 'walk') {
      // Schritte-Karte zeigen und hervorheben; der Fokus folgt für Tastatur und Screenreader.
      setStepsHighlighted(true);
      requestAnimationFrame(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        steps.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        steps.current?.focus({ preventScroll: true });
      });
    } else if (choice === 'light') {
      // Das geplante Training mit dem Hinweis „Weniger Sätze …“; ohne Plan ein freies Training.
      if (active) {
        void navigate(`/training/einheit/${active.id}${LIGHT_QUERY}`);
      } else {
        const input = program ? nextDayInput(program) : null;
        void start(input ?? { source: 'free', title: t.training.freeTitle, exercises: [] }, {
          light: true,
        });
      }
    }
  };

  return (
    <>
      {/* Begrüßung nach Tageszeit (D-276, D-310): Gruß mit Namen, darunter das Datum; ohne Uhr. */}
      <header className="mb-6">
        <h1 className="text-headline font-semibold">
          <span className="sr-only">{t.today.title}: </span>
          {t.today.greetingLine(greetingFor(hour), profile?.displayName)}
        </h1>
        <p className="mt-2 text-muted">{formatters.weekdayDayMonth(today)}</p>
        {flow.firstStart ? <p className="mt-3 text-lg">{t.today.firstStart}</p> : null}
      </header>
      <ReturnSheet open={flow.open} onChoose={choose} />
      <div className="grid gap-stack md:grid-cols-2">
        {active === undefined || program === undefined ? (
          <div aria-busy="true" className="md:col-span-2">
            <Skeleton className="h-44" />
          </div>
        ) : active ? (
          <Card
            tone="stage"
            eyebrow={t.training.running}
            title={active.title}
            className="md:col-span-2"
          >
            <p className="-mt-1 text-muted">
              {t.today.runningText(
                formatClock(sessionDurationSec(active, now)),
                t.session.progress(sessionProgress(active).done, sessionProgress(active).total),
              )}
            </p>
            <Meter
              className="mt-4"
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
            <ButtonLink to={`/training/einheit/${active.id}`} size="lg" className="mt-5 w-full">
              <Play aria-hidden="true" className="size-5" />
              {t.training.resume}
            </ButtonLink>
          </Card>
        ) : program ? (
          <div className="md:col-span-2">
            <ActiveProgramCard
              program={program}
              eyebrow={plannedEyebrow(program, today)}
              rest={plannedRest(program, today)}
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
          // Ohne Training und ohne Programm (F5, D-324): „Bereit für dein Training?“.
          <ReadyCard
            className="md:col-span-2"
            busy={busy}
            onStartFree={() => {
              void start({ source: 'free', title: t.training.freeTitle, exercises: [] });
            }}
            error={error?.message}
          />
        )}
        <Suspense fallback={null}>
          <NutritionTodayCard />
        </Suspense>
        <Suspense fallback={null}>
          <WaterCard day={todayKey} />
        </Suspense>
        <div
          ref={steps}
          tabIndex={-1}
          data-highlighted={stepsHighlighted || undefined}
          className={cn(
            'rounded-card',
            stepsHighlighted && 'outline-2 outline-offset-4 outline-accent',
          )}
        >
          <Suspense fallback={null}>
            <StepsTodayCard />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <TasksCard />
        </Suspense>
        {sessions && goals ? (
          <WeeklyGoalCard sessions={sessions} target={goals.weeklySessions} today={todayKey} />
        ) : null}
        {last && lastSummary ? (
          <Card eyebrow={t.today.lastTitle} title={last.title}>
            <p className="-mt-1 text-sm text-muted">
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
          titleStyle="label"
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
            <div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
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
              {sparkValues.length >= 2 ? (
                <WeightCurve values={sparkValues} className="mt-3" />
              ) : null}
            </div>
          ) : (
            <p className="text-muted">{t.today.weightNone}</p>
          )}
        </Card>
      </div>
    </>
  );
}

/** Gruß nach Uhrzeit (D-310): 5 bis 11 Uhr Morgen, 11 bis 18 Uhr Tag, sonst Abend. */
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 11) return t.today.greetingMorning;
  if (hour >= 11 && hour < 18) return t.today.greetingDay;
  return t.today.greetingEvening;
}
