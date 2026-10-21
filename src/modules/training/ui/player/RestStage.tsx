import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { Button, Chip, IconButton } from '@/shared/ui';
import { formatRestRemaining, formatTargetRange, restRemainingSec } from '../../calc/format';
import type { Session, SessionExercise, SessionSet } from '../../model/session';

export const REST_STEP_SEC = 15;

export interface RestStageProps {
  timer: NonNullable<Session['restTimer']>;
  now: Date;
  /** Nächster offener Satz nach dem erledigten, mit lesbarem Namen. */
  next: { exercise: SessionExercise; set: SessionSet; name: string } | null;
  previous: string | undefined;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
}

/**
 * Pause als Bühne im Player (ux-audit.md DS-6, AK-TRN-10 bis AK-TRN-12): Restzeit aus dem
 * gespeicherten Endzeitpunkt, Überziehung als „+0:42" mit Rand und Zahl in Lime, nächster Satz,
 * ±15 s als Chips, „Überspringen“ in Blau (FORM, D-315); antippen öffnet die Vollansicht mit großem Timer.
 */
export function RestStage(props: RestStageProps) {
  const [expanded, setExpanded] = useState(false);
  const remaining = restRemainingSec(props.timer.endsAt, props.now);
  const over = remaining <= 0;
  const time = formatRestRemaining(remaining);
  const status = over ? t.rest.overBy(time.slice(1)) : `${t.rest.remaining} ${time}`;
  const target = props.next?.set.target ? formatTargetRange(props.next.set.target) : null;
  const nextText = props.next
    ? [
        props.next.name,
        target ? `${t.rest.target} ${target.text}` : null,
        props.previous ? `${t.session.previous} ${props.previous}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : t.rest.noNext;

  const controls = (size: 'sm' | 'lg') => (
    <div
      className={cn(
        'grid items-center gap-2',
        size === 'lg' ? 'w-full max-w-md grid-cols-[1fr_1fr_1.6fr]' : 'grid-cols-[1fr_1fr_1.5fr]',
      )}
    >
      {/* ±15 s als Chips, „Überspringen“ in Blau: Trainingsaktion im aktiven Workout (D-315). */}
      <Chip
        aria-label={t.rest.minus}
        className="w-full"
        onClick={() => {
          props.onAdjust(-REST_STEP_SEC);
        }}
      >
        <Minus aria-hidden="true" className="size-4" />
        15 s
      </Chip>
      <Chip
        aria-label={t.rest.plus}
        className="w-full"
        onClick={() => {
          props.onAdjust(REST_STEP_SEC);
        }}
      >
        <Plus aria-hidden="true" className="size-4" />
        15 s
      </Chip>
      <Button
        variant="action"
        size={size === 'lg' ? 'md' : 'sm'}
        aria-label={t.rest.skip}
        onClick={props.onSkip}
      >
        {t.rest.skipShort}
      </Button>
    </div>
  );

  // Überzogen: Rand und Zahl in Lime; Lime ist Akzent, nie Fläche (Markenassets, Regeln).
  const overClass = over ? 'shadow-[0_0_0_1px_var(--accent)]' : '';

  if (expanded) {
    // Als Portal, damit `fixed` sich auf das Fenster bezieht und nicht auf den klebenden Kopf.
    return createPortal(
      <section
        aria-label={t.rest.label}
        className={cn(
          'stage fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 px-page text-center text-fg',
          overClass,
        )}
      >
        <p className="eyebrow text-muted">{over ? t.rest.over : t.rest.label}</p>
        <p
          role="timer"
          aria-label={status}
          className={cn('text-timer font-semibold', over && 'text-accent-ink')}
        >
          {time}
        </p>
        <div className="max-w-md">
          <p className="eyebrow text-muted">{t.rest.next}</p>
          <p className="mt-1 text-lg">{nextText}</p>
        </div>
        {controls('lg')}
        <Button
          variant="secondary"
          onClick={() => {
            setExpanded(false);
          }}
        >
          <ChevronDown aria-hidden="true" className="size-5" />
          {t.rest.collapse}
        </Button>
      </section>,
      document.body,
    );
  }

  return (
    <section
      aria-label={t.rest.label}
      className={cn('stage mt-3 rounded-card p-card text-fg', overClass)}
    >
      <div className="flex min-h-12 items-center gap-4">
        <p
          role="timer"
          aria-label={status}
          className={cn('text-value font-semibold', over && 'text-accent-ink')}
        >
          {time}
        </p>
        <p className="min-w-0 flex-1">
          <span className="eyebrow block text-muted">{over ? t.rest.over : t.rest.label}</span>
          <span className="mt-0.5 line-clamp-2 text-sm">
            <span className="font-semibold">{t.rest.next}: </span>
            {nextText}
          </span>
        </p>
        <IconButton
          label={t.rest.expand}
          aria-expanded={false}
          className="size-12"
          onClick={() => {
            setExpanded(true);
          }}
        >
          <ChevronUp aria-hidden="true" className="size-6" />
        </IconButton>
      </div>
      <div className="mt-3">{controls('sm')}</div>
    </section>
  );
}
