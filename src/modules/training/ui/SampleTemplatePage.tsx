import { Copy, Info, Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import type { Exercise } from '@/modules/exercises';
import { Badge, Button, ButtonLink, Card, Meter, PageHeader } from '@/shared/ui';
import { programProgress, type ProgramProgress } from '../calc/programProgress';
import { describeDay, describeSets, describeTemplate } from '../calc/describe';
import { useCompletedSessions } from '../data/useSession';
import { useTrainingState } from '../data/useTrainingState';
import type { Day, PlanTree, SampleTemplate, Week } from '../model/program';
import { activateProgram, copyProgram, deactivateProgram } from '../service/programService';
import { planFromTemplateDay } from '../service/sessionService';
import type { AnyProgram } from './useActiveProgram';
import { useStartSession } from './useStartSession';

export interface SampleTemplateData {
  template: SampleTemplate;
  exercises: readonly Exercise[];
}

/**
 * Vorlage oder Programm (S-49): schreibgeschützt, mit Etikett und Hinweis (AK-PRG-06). Programme
 * lassen sich aktivieren; dann zeigt die Seite den nächsten Tag und die erledigten Tage (D-249).
 * Gebündelte Programme und Vorlagen lassen sich als eigenes Programm übernehmen (D-257).
 */
export function SampleTemplatePage() {
  const { template, exercises } = useLoaderData<SampleTemplateData>();
  return (
    <ProgramDetail
      template={template}
      exercises={exercises}
      isProgram={template.program === true}
      eyebrow={template.program ? t.programs.programEyebrow : t.programs.sampleEyebrow}
      subtitle={describeTemplate(template)}
      actions={<AdoptButton template={template} />}
      hint={
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
      }
    />
  );
}

/** Kopie unter „Meine Programme“ anlegen und dorthin wechseln (AK-PRG-06). */
function AdoptButton({ template }: { template: SampleTemplate }) {
  const rt = useDb();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="mb-4">
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setFailed(false);
          copyProgram(rt, template, { name: template.name, kind: 'program' })
            .then((copy) => navigate(`/training/programme/${copy.id}`))
            .catch((caught: unknown) => {
              setFailed(true);
              void logError(rt.db, {
                area: 'training',
                error: caught,
                route: window.location.pathname,
              });
            })
            .finally(() => {
              setBusy(false);
            });
        }}
      >
        <Copy aria-hidden="true" className="size-5" />
        {t.programs.adopt}
      </Button>
      <p className="mt-2 text-sm text-muted">{t.programs.adoptHint}</p>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.programs.actionFailed}
        </p>
      ) : null}
    </div>
  );
}

export interface ProgramDetailProps {
  template: AnyProgram;
  exercises: readonly Exercise[];
  /** Aktivierbar (Programm, nicht Vorlage und nicht archiviert). */
  isProgram: boolean;
  eyebrow: string;
  subtitle?: string;
  /** Aktionen unter dem Kopf, z. B. Bearbeiten oder Übernehmen. */
  actions?: ReactNode;
  /** Hinweis statt der Programmkarte, z. B. bei archivierten Programmen. */
  notice?: ReactNode;
  hint?: ReactNode;
}

/** Ansicht eines Programms mit Tagen, Start und Aktivierung; für gebündelte und eigene. */
export function ProgramDetail({
  template,
  exercises,
  isProgram,
  eyebrow,
  subtitle,
  actions,
  notice,
  hint,
}: ProgramDetailProps) {
  const own = !('key' in template);
  const groups = own ? allDays(template) : groupDays(template);
  const perSide = new Set(exercises.filter((e) => e.isUnilateral).map((e) => e.id));
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const { start, error, busy } = useStartSession();
  const state = useTrainingState();
  const sessions = useCompletedSessions();
  const restDefaultSec = (useSettings() ?? SETTINGS_DEFAULTS).restDefaultSec;
  const active = isProgram && state?.activeProgramId === template.id;
  const progress =
    active && sessions ? programProgress(template, sessions, state.activeSince) : undefined;
  // Erledigte Tage nur markieren, wenn jeder Tag genau einmal vorkommt (z. B. Programm C);
  // bei wiederholten Tagen (A, B, A, B) wäre die Markierung mehrdeutig.
  const markDone = progress?.total === groups.reduce((sum, group) => sum + group.days.length, 0);

  const startDay = (weekIndex: number, dayIndex: number) => {
    // Der Plan entsteht erst im Start; scheitert er, erscheint die Meldung (B-07).
    void start(() =>
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
        eyebrow={eyebrow}
        title={template.name}
        subtitle={subtitle}
        back={{ to: '/training/programme', label: t.programs.title }}
      />
      {actions}
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
        {notice}
        {isProgram ? (
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
            {groups.length > 1 || own ? (
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
                const isNext = own
                  ? progress?.next?.dayId === day.id
                  : progress?.next?.name === day.name;
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
                      {day.weekdayHint
                        ? ` · ${t.programs.plannedWeekday(t.programs.weekdays[day.weekdayHint - 1] ?? '')}`
                        : ''}
                    </p>
                    {day.notes ? <p className="mb-3 text-sm">{day.notes}</p> : null}
                    {day.exercises.length === 0 ? (
                      <p className="text-sm text-muted">{t.programs.emptyDayStart}</p>
                    ) : (
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
                    )}
                    {/* Sichtbar kurz, weil der Tag darüber steht; der Name nennt den Tag (F5 §9, D-331). */}
                    <Button
                      variant={isNext ? 'primary' : 'secondary'}
                      className="mt-5 w-full md:w-auto"
                      aria-label={t.training.startDay(day.name)}
                      disabled={busy || day.exercises.length === 0}
                      onClick={() => {
                        startDay(weekIndex, dayIndex);
                      }}
                    >
                      <Play aria-hidden="true" className="size-5" />
                      {t.training.startDayShort}
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
        {hint}
      </div>
    </>
  );
}

interface DayGroup {
  week: Week;
  days: { day: Day; index: number; weekIndex: number; dayIndex: number }[];
}

/** Alle Tage je Woche (eigene Programme: gleiche Namen können verschiedene Inhalte haben). */
function allDays(template: PlanTree): DayGroup[] {
  let index = 0;
  return template.weeks.map((week, weekIndex) => ({
    week,
    days: week.days.map((day, dayIndex) => ({ day, index: index++, weekIndex, dayIndex })),
  }));
}

/** Tage ohne Wiederholung, gruppiert nach der Woche ihres ersten Auftretens. */
function groupDays(template: PlanTree): DayGroup[] {
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
  template: AnyProgram;
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
      {'source' in template && template.source ? (
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
      tone="stage"
      eyebrow={t.training.activeProgram}
      title={
        !progress
          ? t.programs.loadingProgress
          : next
            ? t.programs.dayOf(next.index + 1, progress.total)
            : t.programs.finishedTitle
      }
    >
      <p className="-mt-2 text-muted">
        {progress && next
          ? `${next.name}${progress.round > 1 ? ` · ${t.programs.round(progress.round)}` : ''}`
          : progress
            ? t.programs.finishedText(template.name, progress.total)
            : ''}
      </p>
      {progress && next ? (
        <Meter
          className="mt-3"
          label={t.programs.dayOf(next.index + 1, progress.total)}
          value={progress.total > 0 ? next.index / progress.total : 0}
        />
      ) : null}
      <div className="mt-4 text-sm text-muted">{description}</div>
      {activeSince ? (
        <p className="mt-2 text-sm text-muted">
          {t.programs.activeSince(fmt.weekdayDayMonth(new Date(activeSince)))}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-3 text-sm text-fg">
          {t.programs.activateFailed}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {next ? (
          <Button
            size="lg"
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
          variant="secondary"
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
