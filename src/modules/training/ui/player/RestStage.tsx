import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { Button, IconButton } from '@/shared/ui';
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
 * gespeicherten Endzeitpunkt, Überziehung als „+0:42" mit Akzentfläche, nächster Satz, ±15 s,
 * Überspringen; antippen öffnet die Vollansicht mit großem Timer.
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
        'grid gap-2',
        size === 'lg' ? 'w-full max-w-md grid-cols-[1fr_1fr_1.6fr]' : 'grid-cols-[1fr_1fr_1.5fr]',
      )}
    >
      <Button
        variant="onInk"
        size={size === 'lg' ? 'md' : size}
        aria-label={t.rest.minus}
        onClick={() => {
          props.onAdjust(-REST_STEP_SEC);
        }}
      >
        <Minus aria-hidden="true" className="size-4" />
        15
      </Button>
      <Button
        variant="onInk"
        size={size === 'lg' ? 'md' : size}
        aria-label={t.rest.plus}
        onClick={() => {
          props.onAdjust(REST_STEP_SEC);
        }}
      >
        <Plus aria-hidden="true" className="size-4" />
        15
      </Button>
      <Button
        variant={over ? 'onInk' : 'primary'}
        size={size === 'lg' ? 'md' : size}
        aria-label={t.rest.skip}
        onClick={props.onSkip}
      >
        {t.rest.skipShort}
      </Button>
    </div>
  );

  if (expanded) {
    // Als Portal, weil die Kopfzeile mit Weichzeichner sonst den Bezugsrahmen für `fixed` bildet.
    return createPortal(
      <section
        aria-label={t.rest.label}
        className={cn(
          'fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 px-6 text-center text-on-ink',
          over ? 'bg-accent' : 'bg-ink',
        )}
      >
        <p className="eyebrow text-on-ink-muted">{over ? t.rest.over : t.rest.label}</p>
        <p role="timer" aria-label={status} className="text-timer font-bold tabular-nums">
          {time}
        </p>
        <div className="max-w-md">
          <p className="eyebrow text-on-ink-muted">{t.rest.next}</p>
          <p className="mt-1 text-lg">{nextText}</p>
        </div>
        {controls('lg')}
        <Button
          variant="quiet"
          className="text-on-ink"
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
      className={cn('mt-3 rounded-card p-4 text-on-ink', over ? 'bg-accent' : 'bg-ink')}
    >
      <div className="flex min-h-12 items-center gap-4">
        <p role="timer" aria-label={status} className="text-4xl font-bold tabular-nums">
          {time}
        </p>
        <p className="min-w-0 flex-1">
          <span className="eyebrow block text-on-ink-muted">
            {over ? t.rest.over : t.rest.label}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-sm">
            <span className="font-semibold">{t.rest.next}: </span>
            {nextText}
          </span>
        </p>
        <IconButton
          label={t.rest.expand}
          tone="onInk"
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
