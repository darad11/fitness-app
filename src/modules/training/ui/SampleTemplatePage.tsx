import { Info, Play } from 'lucide-react';
import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import type { Exercise } from '@/modules/exercises';
import { Badge, Button, ButtonLink, Card, Meter, PageHeader } from '@/shared/ui';
import { estimateDay, roundMinutes } from '../calc/duration';
import { formatRest, formatTargetRange } from '../calc/format';
import { programProgress, type ProgramProgress } from '../calc/programProgress';
import { distinctDays, summarizeSets } from '../calc/sampleTemplates';
import { useCompletedSessions } from '../data/useSession';
import { useTrainingState } from '../data/useTrainingState';
import type { Day, PlannedExercise, SampleTemplate, Week } from '../model/program';
import { activateProgram, deactivateProgram } from '../service/programService';
import { planFromTemplateDay } from '../service/sessionService';
import { describeTemplate } from './ProgramsPage';
import { useStartSession } from './useStartSession';

export interface SampleTemplateData {
  template: SampleTemplate;
  exercises: readonly Exercise[];
}

/**
 * Vorlage oder Programm (S-49): schreibgeschützt, mit Etikett und Hinweis (AK-PRG-06). Programme
 * lassen sich aktivieren; dann zeigt die Seite den nächsten Tag und die erledigten Tage (D-249).
 */
export function SampleTemplatePage() {
  const { template, exercises } = useLoaderData<SampleTemplateData>();
  const groups = groupDays(template);
  const perSide = new Set(exercises.filter((e) => e.isUnilateral).map((e) => e.id));
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const { start, error, busy } = useStartSession();
  const state = useTrainingState();
  const sessions = useCompletedSessions();
  const restDefaultSec = (useSettings() ?? SETTINGS_DEFAULTS).restDefaultSec;
  const active = template.program === true && state?.activeProgramId === template.id;
  const progress =
    active && sessions ? programProgress(template, sessions, state.activeSince) : undefined;
  // Erledigte Tage nur markieren, wenn jeder Tag genau einmal vorkommt (z. B. Winter Arc);
  // bei wiederholten Tagen (A, B, A, B) wäre die Markierung mehrdeutig.
  const markDone = progress?.total === distinctDays(template).length;

  const startDay = (weekIndex: number, dayIndex: number) => {
    void start(
      planFromTemplateDay(
        template,
        weekIndex,
        dayIndex,
        (id) => byId.get(id),
        active ? 'program' : 'template',
      ),
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={template.program ? t.programs.programEyebrow : t.programs.sampleEyebrow}
        title={template.name}
        subtitle={describeTemplate(template)}
        back={{ to: '/training/programme', label: t.programs.title }}
      />
      {error ? (
        <div role="alert" className="mb-4 rounded-card bg-danger-soft p-4 text-danger">
          <p className="mb-3">{error.message}</p>
          {error.activeId ? (
            <ButtonLink to={`/training/einheit/${error.activeId}`} size="sm">
              {t.training.resume}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4">
        {template.program ? (
          <ProgramCard
            template={template}
            active={active}
            activeSince={active ? state.activeSince : undefined}
            otherActive={state?.activeProgramId !== undefined && !active}
            progress={progress}
            busy={busy}
            onStartNext={(next) => {
              startDay(next.weekIndex, next.dayIndex);
            }}
          />
        ) : null}
        {groups.map((group) => (
          <section key={group.week.id} aria-labelledby={`woche-${group.week.id}`}>
            {groups.length > 1 ? (
              <h2 id={`woche-${group.week.id}`} className="eyebrow mb-3 text-muted">
                {group.week.name}
              </h2>
            ) : (
              <h2 id={`woche-${group.week.id}`} className="sr-only">
                {t.programs.daysTitle}
              </h2>
            )}
            <div className="grid gap-4">
              {group.days.map(({ day, index, weekIndex, dayIndex }) => {
                const isNext = progress?.next?.name === day.name;
                const isDone = markDone && progress.doneInRound.has(index);
                return (
                  <Card
                    key={day.id}
                    eyebrow={t.programs.dayEyebrow(index + 1)}
                    title={day.name}
                    action={
                      isNext ? (
                        <Badge tone="accent">{t.programs.nextBadge}</Badge>
                      ) : isDone ? (
                        <Badge tone="success">{t.programs.doneBadge}</Badge>
                      ) : undefined
                    }
                  >
                    <p className="-mt-2 mb-3 text-sm text-muted" title={t.programs.estimateHint}>
                      {describeDay(day, restDefaultSec)}
                    </p>
                    <ol className="divide-y divide-line">
                      {day.exercises.map((exercise, position) => (
                        <li key={exercise.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                          <span className="w-6 shrink-0 pt-0.5 text-sm font-semibold text-muted tabular-nums">
                            {position + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium">{exercise.nameSnapshot}</span>
                            <span className="block text-sm text-muted">
                              {describeSets(exercise, perSide.has(exercise.exerciseId))}
                            </span>
                            {exercise.notes ? (
                              <span className="mt-1 block text-sm">{exercise.notes}</span>
                            ) : null}
                            {exercise.originalName ? (
                              <span className="block text-xs text-muted">
                                {t.programs.originalName(exercise.originalName)}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <Button
                      variant={isNext ? 'primary' : 'secondary'}
                      className="mt-5 w-full md:w-auto"
                      disabled={busy}
                      onClick={() => {
                        startDay(weekIndex, dayIndex);
                      }}
                    >
                      <Play aria-hidden="true" className="size-5" />
                      {t.training.startDay(day.name)}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        <Card title={t.programs.schedule}>
          <ul className="space-y-1">
            {template.weeks.map((week) => (
              <li key={week.id}>
                {t.programs.week(week.name, week.days.map((day) => day.name).join(', '))}
              </li>
            ))}
          </ul>
          {template.repeat ? (
            <p className="mt-2 text-sm text-muted">{t.programs.scheduleRepeat}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">{t.training.startDayHint}</p>
        </Card>
        <div className="flex items-start gap-3 rounded-card bg-surface-2 p-4">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" />
          <div>
            <Badge tone={template.program ? 'neutral' : 'accent'} className="mb-2">
              {template.program ? t.programs.programBadge : t.programs.sampleBadge}
            </Badge>
            <p className="text-sm text-muted">
              {template.program ? t.programs.programHint : t.programs.sampleHint}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface DayGroup {
  week: Week;
  days: { day: Day; index: number; weekIndex: number; dayIndex: number }[];
}

/** Tage ohne Wiederholung, gruppiert nach der Woche ihres ersten Auftretens. */
function groupDays(template: SampleTemplate): DayGroup[] {
  const seen = new Set<string>();
  const groups: DayGroup[] = [];
  let index = 0;
  template.weeks.forEach((week, weekIndex) => {
    const days: DayGroup['days'] = [];
    week.days.forEach((day, dayIndex) => {
      if (!seen.has(day.name)) {
        seen.add(day.name);
        days.push({ day, index, weekIndex, dayIndex });
      }
      index += 1;
    });
    if (days.length > 0) groups.push({ week, days });
  });
  return groups;
}

function ProgramCard({
  template,
  active,
  activeSince,
  otherActive,
  progress,
  busy,
  onStartNext,
}: {
  template: SampleTemplate;
  active: boolean;
  activeSince: string | undefined;
  otherActive: boolean;
  progress: ProgramProgress | undefined;
  busy: boolean;
  onStartNext: (next: NonNullable<ProgramProgress['next']>) => void;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = (action: () => Promise<unknown>) => {
    setSaving(true);
    setFailed(false);
    action()
      .catch((caught: unknown) => {
        setFailed(true);
        void logError(rt.db, { area: 'training', error: caught, route: window.location.pathname });
      })
      .finally(() => {
        setSaving(false);
      });
  };
  const description = (
    <>
      {template.description ? <p className="max-w-xl">{template.description}</p> : null}
      {template.source ? (
        <p className="mt-2 text-sm text-muted">{t.programs.source(template.source)}</p>
      ) : null}
    </>
  );
  if (!active) {
    return (
      <Card title={template.name} eyebrow={t.programs.programEyebrow}>
        {description}
        {otherActive ? <p className="mt-3 text-sm text-muted">{t.programs.switchHint}</p> : null}
        {failed ? (
          <p role="alert" className="mt-3 text-danger">
            {t.programs.activateFailed}
          </p>
        ) : null}
        <Button
          className="mt-5 w-full md:w-auto"
          disabled={saving}
          onClick={() => {
            run(() => activateProgram(rt, template.id));
          }}
        >
          {t.programs.activate}
        </Button>
      </Card>
    );
  }
  const next = progress?.next;
  return (
    <Card
      tone="ink"
      eyebrow={t.training.activeProgram}
      title={
        !progress
          ? t.programs.loadingProgress
          : next
            ? t.programs.dayOf(next.index + 1, progress.total)
            : t.programs.finishedTitle
      }
    >
      <p className="-mt-2 text-on-ink-muted">
        {progress && next
          ? `${next.name}${progress.round > 1 ? ` · ${t.programs.round(progress.round)}` : ''}`
          : progress
            ? t.programs.finishedText(template.name, progress.total)
            : ''}
      </p>
      {progress && next ? (
        <Meter
          tone="onInk"
          className="mt-3"
          label={t.programs.dayOf(next.index + 1, progress.total)}
          value={progress.total > 0 ? next.index / progress.total : 0}
        />
      ) : null}
      <div className="mt-4 text-sm text-on-ink-muted">{description}</div>
      {activeSince ? (
        <p className="mt-2 text-sm text-on-ink-muted">
          {t.programs.activeSince(fmt.weekdayDayMonth(new Date(activeSince)))}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-3 text-sm text-on-ink">
          {t.programs.activateFailed}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {next ? (
          <Button
            variant="onInk"
            disabled={busy}
            onClick={() => {
              onStartNext(next);
            }}
          >
            <Play aria-hidden="true" className="size-5" />
            {t.training.startNext}
          </Button>
        ) : null}
        <Button
          variant="quiet"
          className="text-on-ink"
          disabled={saving}
          onClick={() => {
            run(() => deactivateProgram(rt));
          }}
        >
          {t.programs.deactivate}
        </Button>
      </div>
    </Card>
  );
}

/** Z. B. „2 Aufwärmsätze, 3 Sätze je Seite · 6–8 Wdh. · Pause 2:30 min". */
export function describeSets(exercise: PlannedExercise, perSide: boolean): string {
  const summary = summarizeSets(exercise);
  const sets = [
    summary.warmup > 0 ? t.programs.warmupSets(summary.warmup) : null,
    t.programs.workingSets(summary.working) + (perSide ? ` ${t.programs.perSide}` : ''),
    summary.drop > 0 ? t.programs.dropSets(summary.drop) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const range = formatTargetRange(summary.target);
  const dropRange = summary.dropTarget ? formatTargetRange(summary.dropTarget) : null;
  const target = range
    ? (range.kind === 'reps' ? t.programs.reps(range.text) : range.text) +
      (dropRange
        ? `, Drop ${dropRange.kind === 'reps' ? t.programs.reps(dropRange.text) : dropRange.text}`
        : '')
    : null;
  const rest =
    exercise.restSec === undefined
      ? null
      : exercise.restSec === 0
        ? t.programs.noRest
        : t.programs.rest(formatRest(exercise.restSec));
  return [sets, target, rest].filter(Boolean).join(' · ');
}

/** Tagesvorschau: „5 Übungen · 17 Sätze · ca. 50 min" (Schritt D). */
export function describeDay(day: Pick<Day, 'exercises'>, restDefaultSec: number): string {
  const estimate = estimateDay(day, restDefaultSec);
  return [
    t.programs.exerciseCount(estimate.exercises),
    t.programs.setCount(estimate.sets),
    t.programs.estimate(roundMinutes(estimate.seconds)),
  ].join(' · ');
}
