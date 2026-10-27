import { Check, Ellipsis, Minus, Plus, RotateCcw, Square, Timer } from 'lucide-react';
import { useState } from 'react';
import { tSession } from '@/shared/i18n/de-session';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';
import { fieldsFor, formatSetValues } from '../../calc/fields';
import { formatClock } from '../../calc/format';
import type { SessionExercise, SessionSet, SetValues } from '../../model/session';
import { ValueInput } from './ValueInput';

export interface SetRowProps {
  exercise: SessionExercise;
  set: SessionSet;
  /** Anzeige wie „1", „A" oder „D". */
  label: string;
  /** Lesbare Bezeichnung für Screenreader, z. B. „Arbeitssatz 2". */
  name: string;
  previous: SetValues | undefined;
  suggestion: SetValues;
  current: boolean;
  error: string | undefined;
  onRetry: (() => void) | undefined;
  weightStep: number;
  number: (value: number) => string;
  onValue: (field: keyof SetValues, value: number | null | 'invalid') => void;
  onToggleDone: () => void;
  onSkip: () => void;
  onRemove: () => void;
  /** Übungstimer für Zeitsätze (AK-TRN-14); fehlt bei Übungen ohne Zeitfeld. */
  timer?: { running: boolean; elapsedSec: number; onToggle: () => void };
}

/**
 * Satzzeile (design-system.md Abschnitt 11, ux-audit.md DS-5): Typ, Vorwert, Felder je
 * Erfassungsart und „erledigt". Jede Zeile ist jederzeit bedienbar; der nächste offene Satz
 * ist als Tonfläche hervorgehoben (AK-TRN-08). Bedienziele 48 px.
 */
export function SetRow(props: SetRowProps) {
  const { exercise, set, current, error, timer } = props;
  const [actionsOpen, setActionsOpen] = useState(false);
  const fields = fieldsFor(exercise.trackingMode, exercise.distanceUnit);
  const done = set.status === 'done';
  const skipped = set.status === 'skipped';
  const weight = fields.find((spec) => spec.field === 'weightKg' || spec.field === 'assistKg');
  const stepValue = (direction: 1 | -1) => {
    if (!weight) return;
    const base = set.actual[weight.field] ?? props.suggestion[weight.field] ?? 0;
    const next = Math.max(0, Math.round((base + direction * props.weightStep) * 100) / 100);
    props.onValue(weight.field, next);
  };

  return (
    <li
      aria-label={props.name}
      aria-current={current ? 'step' : undefined}
      data-set-id={set.id}
      className={cn(
        // Scroll-Abstand zum klebenden Kopf mit Pause (gemessen, `useStableSetView`) und zur
        // Fußleiste: Fokus und Tastatur scrollen ein Feld nie hinter den Kopf (F5, D-323).
        'scroll-mt-[calc(var(--player-head,0px)+0.75rem)] scroll-mb-32 rounded-input px-2 py-1.5',
        set.type === 'drop' && 'ml-6',
        current && 'bg-accent-soft',
        skipped && 'opacity-70',
      )}
    >
      {/* In schmalen Zeilen (unter 24 rem, alle iPhones hochkant und das Duo zugeklappt) etwas
          engere Abstände und Vorwert-Spalte, damit die Felder Platz für „102,5“ haben (D-378).
          Unter 20 rem (375 pt und schmaler) steht der Vorwert in einer zweiten Zeile unter den
          Feldern, mit seinem Namen davor (D-380). */}
      <div className="flex items-center gap-2 @max-sm:gap-1.5 @max-[20rem]:flex-wrap">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-pill text-sm font-semibold tabular-nums',
            done
              ? 'bg-success-soft text-success'
              : set.type === 'warmup'
                ? 'bg-surface-2 text-muted'
                : current
                  ? 'bg-accent text-on-accent'
                  : 'bg-surface-2 text-fg',
          )}
        >
          {props.label}
        </span>
        <span
          className={cn(
            'w-14 shrink-0 text-xs text-muted tabular-nums @max-sm:w-12',
            '@max-[20rem]:order-last @max-[20rem]:w-full @max-[20rem]:basis-full @max-[20rem]:pl-[2.375rem]',
            !props.previous && '@max-[20rem]:hidden',
          )}
        >
          <span className="sr-only @max-[20rem]:not-sr-only">{tSession.previous}: </span>
          {props.previous
            ? formatSetValues(
                props.previous,
                exercise.trackingMode,
                exercise.distanceUnit,
                props.number,
              )
            : '–'}
        </span>
        <div
          className={cn(
            'grid min-w-0 flex-1 gap-2 @max-sm:gap-1.5',
            fields.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {fields.map((spec) => (
            <ValueInput
              key={spec.label}
              spec={spec}
              label={`${tSession.fields[spec.label]}, ${props.name}`}
              stored={set.actual[spec.field]}
              suggestion={props.suggestion[spec.field]}
              format={props.number}
              disabled={skipped}
              onCommit={(value) => {
                props.onValue(spec.field, value);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={props.onToggleDone}
          aria-label={
            done
              ? `${tSession.undo}, ${props.name}`
              : skipped
                ? `${tSession.unskip}, ${props.name}`
                : `${tSession.done}, ${props.name}`
          }
          aria-pressed={done}
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-pill transition-colors duration-120',
            done
              ? 'bg-success text-on-accent'
              : current
                ? 'bg-surface text-fg shadow-card hover:bg-surface-2'
                : 'bg-surface-2 text-muted hover:text-fg',
          )}
        >
          {skipped ? (
            <RotateCcw aria-hidden="true" className="size-5" />
          ) : (
            <Check aria-hidden="true" className="size-6" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setActionsOpen((open) => !open);
          }}
          aria-expanded={actionsOpen}
          aria-label={`${tSession.more}, ${props.name}`}
          className="-mr-1 flex h-12 w-9 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Ellipsis aria-hidden="true" className="size-5" />
        </button>
      </div>
      {skipped ? <p className="mt-1 ml-10 text-sm text-muted">{tSession.skipped}</p> : null}
      {error ? (
        <p
          role="alert"
          className="mt-2 ml-10 flex flex-wrap items-center gap-2 text-sm text-danger"
        >
          {error}
          {props.onRetry ? (
            <Button variant="quiet" size="sm" onClick={props.onRetry}>
              {tSession.retry}
            </Button>
          ) : null}
        </p>
      ) : null}
      {(current && (weight || timer) && !done) || timer?.running || actionsOpen ? (
        <div className="mt-2 ml-10 flex flex-wrap gap-2">
          {timer && !done && !skipped && (current || timer.running || actionsOpen) ? (
            <Button
              variant={timer.running ? 'primary' : 'secondary'}
              size="sm"
              className={timer.running ? 'tabular-nums' : undefined}
              aria-label={`${timer.running ? tSession.stopTimer : tSession.startTimer}, ${props.name}`}
              onClick={timer.onToggle}
            >
              {timer.running ? (
                <Square aria-hidden="true" className="size-4" />
              ) : (
                <Timer aria-hidden="true" className="size-4" />
              )}
              {timer.running
                ? `${tSession.stopTimer} ${formatClock(timer.elapsedSec)}`
                : tSession.startTimer}
            </Button>
          ) : null}
          {current && weight && !done ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  stepValue(-1);
                }}
                aria-label={tSession.stepDown(props.number(props.weightStep))}
              >
                <Minus aria-hidden="true" className="size-4" />
                {props.number(props.weightStep)}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  stepValue(1);
                }}
                aria-label={tSession.stepUp(props.number(props.weightStep))}
              >
                <Plus aria-hidden="true" className="size-4" />
                {props.number(props.weightStep)}
              </Button>
            </>
          ) : null}
          {actionsOpen ? (
            <>
              {!done && !skipped ? (
                <Button variant="secondary" size="sm" onClick={props.onSkip}>
                  {tSession.skip}
                </Button>
              ) : null}
              <Button variant="danger" size="sm" onClick={props.onRemove}>
                {tSession.removeSet}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** Spaltenköpfe über den Satzzeilen: Satz, Vorwert und die Einheiten der Felder. */
export function SetHeader({ exercise }: { exercise: SessionExercise }) {
  const fields = fieldsFor(exercise.trackingMode, exercise.distanceUnit);
  return (
    <div
      aria-hidden="true"
      className="eyebrow mb-1 flex items-center gap-2 px-2 text-muted @max-sm:gap-1.5"
    >
      <span className="w-8 shrink-0 text-center">#</span>
      <span className="w-14 shrink-0 @max-sm:w-12 @max-[20rem]:hidden">{tSession.previous}</span>
      <span
        className={cn(
          'grid min-w-0 flex-1 gap-2 @max-sm:gap-1.5',
          fields.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {fields.map((spec) => (
          <span key={spec.label} className="text-center">
            {tSession.units[spec.label]}
          </span>
        ))}
      </span>
      <span className="w-12 shrink-0" />
      <span className="w-9 shrink-0" />
    </div>
  );
}
