import { Play } from 'lucide-react';
import { SETTINGS_DEFAULTS, useSettings } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card, Meter } from '@/shared/ui';
import { planFromTemplateDay, type StartInput } from '../calc/plan';
import { plannedFor } from '../calc/programProgress';
import { describeDay } from '../calc/describe';
import { programLink, type ActiveProgram } from './useActiveProgram';

export interface ActiveProgramCardProps {
  program: ActiveProgram;
  eyebrow: string;
  onStart: (input: StartInput) => void;
  busy: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Bühne „Aktives Programm“ bzw. „Heute geplant“ mit dem nächsten Trainingstag (TP-21, AK-DSH-02). */
export function ActiveProgramCard({
  program,
  eyebrow,
  onStart,
  busy,
  className,
  children,
}: ActiveProgramCardProps) {
  const { template, exercises, progress } = program;
  const next = progress.next;
  const restDefaultSec = (useSettings() ?? SETTINGS_DEFAULTS).restDefaultSec;
  const templateLink = programLink(template);
  if (!next) {
    return (
      <Card tone="stage" eyebrow={eyebrow} title={t.programs.finishedTitle} className={className}>
        <p className="-mt-1 max-w-md text-muted">
          {t.programs.finishedText(template.name, progress.total)}
        </p>
        <div className="mt-5 grid gap-2">
          <ButtonLink to={templateLink} variant="primary" size="lg" className="w-full">
            {t.training.showProgram}
          </ButtonLink>
          {children ? <div className="-ml-5 flex flex-wrap gap-x-2">{children}</div> : null}
        </div>
      </Card>
    );
  }
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const week = template.weeks[next.weekIndex];
  const day = week?.days[next.dayIndex];
  return (
    <Card tone="stage" eyebrow={eyebrow} title={next.name} className={className}>
      {/* Trainingstag, Programm und Woche (FORM, D-315). */}
      <p className="-mt-1 text-muted">
        {t.programs.dayOf(next.index + 1, progress.total)} · {template.name}
        {week ? ` · ${week.name}` : ''}
      </p>
      {day ? <p className="mt-1 text-sm text-muted">{describeDay(day, restDefaultSec)}</p> : null}
      <Meter
        className="mt-4"
        label={t.programs.dayOf(next.index + 1, progress.total)}
        value={progress.total > 0 ? next.index / progress.total : 0}
      />
      <div className="mt-5 grid gap-2">
        <Button
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={() => {
            onStart(
              planFromTemplateDay(
                template,
                next.weekIndex,
                next.dayIndex,
                (id) => byId.get(id),
                'program',
              ),
            );
          }}
        >
          <Play aria-hidden="true" className="size-5" />
          {t.training.startNext}
        </Button>
        <div className="-ml-5 flex flex-wrap gap-x-2">
          <ButtonLink to={templateLink} variant="quiet">
            {t.training.chooseOtherDay}
          </ButtonLink>
          {children}
        </div>
      </div>
    </Card>
  );
}

/**
 * Überschrift auf „Heute“ (AK-PRG-09): „Heute geplant“, außer der nächste Tag hat einen anderen
 * Wochentag-Hinweis; dann „Geplant für Donnerstag“.
 */
export function plannedEyebrow(program: ActiveProgram, now: Date): string {
  const next = program.progress.next;
  if (!next) return t.today.plannedEyebrow;
  const planned = plannedFor(program.template, next, now);
  return planned.kind === 'today'
    ? t.today.plannedEyebrow
    : t.programs.plannedWeekday(t.programs.weekdays[planned.weekday - 1] ?? '');
}
