import { Play } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card, Meter } from '@/shared/ui';
import type { StartInput } from '../service/sessionService';
import { planFromTemplateDay } from '../service/sessionService';
import type { ActiveProgram } from './useActiveProgram';

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
  const templateLink = `/training/vorlagen/${template.key}`;
  if (!next) {
    return (
      <Card tone="ink" eyebrow={eyebrow} title={t.programs.finishedTitle} className={className}>
        <p className="-mt-2 max-w-md text-on-ink-muted">
          {t.programs.finishedText(template.name, progress.total)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to={templateLink} variant="onInk">
            {t.training.showProgram}
          </ButtonLink>
          {children}
        </div>
      </Card>
    );
  }
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  return (
    <Card tone="ink" eyebrow={eyebrow} title={next.name} className={className}>
      <p className="-mt-2 text-on-ink-muted">
        {t.programs.dayOf(next.index + 1, progress.total)} · {template.name}
      </p>
      <Meter
        tone="onInk"
        className="mt-3"
        label={t.programs.dayOf(next.index + 1, progress.total)}
        value={progress.total > 0 ? next.index / progress.total : 0}
      />
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="onInk"
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
        <ButtonLink to={templateLink} variant="quiet" className="text-on-ink">
          {t.training.chooseOtherDay}
        </ButtonLink>
        {children}
      </div>
    </Card>
  );
}
