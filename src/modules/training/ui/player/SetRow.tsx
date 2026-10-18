import { Check, Ellipsis, Minus, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';
import { fieldsFor, formatSetValues } from '../../calc/fields';
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
}

/**
 * Satzzeile (design-system.md Abschnitt 11): Typ, Vorwert, Felder je Erfassungsart und „erledigt".
 * Jede Zeile ist jederzeit bedienbar; der nächste offene Satz ist hervorgehoben (AK-TRN-08).
 */
export function SetRow(props: SetRowProps) {
  const { exercise, set, current, error } = props;
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
      className={cn(
        'rounded-input px-2 py-2',
        set.type === 'drop' && 'ml-6',
        current && 'bg-surface-2 ring-2 ring-accent',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'w-6 shrink-0 text-center font-semibold tabular-nums',
            set.type === 'warmup' ? 'text-muted' : 'text-fg',
          )}
        >
          {props.label}
        </span>
        <span className="w-16 shrink-0 text-sm text-muted tabular-nums">
          <span className="sr-only">{t.session.previous}: </span>
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
            'grid min-w-0 flex-1 gap-2',
            fields.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {fields.map((spec) => (
            <ValueInput
              key={spec.label}
              spec={spec}
              label={`${t.session.fields[spec.label]}, ${props.name}`}
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
              ? `${t.session.undo}, ${props.name}`
              : skipped
                ? `${t.session.unskip}, ${props.name}`
                : `${t.session.done}, ${props.name}`
          }
          aria-pressed={done}
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-input border',
            done
              ? 'border-success bg-surface text-success'
              : 'border-line-input bg-surface text-muted hover:bg-surface-2',
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
          aria-label={`${t.session.more}, ${props.name}`}
          className="-mr-1 flex h-11 w-8 shrink-0 items-center justify-center rounded-input text-muted hover:bg-surface"
        >
          <Ellipsis aria-hidden="true" className="size-5" />
        </button>
      </div>
      {skipped ? <p className="mt-1 ml-8 text-sm text-muted">{t.session.skipped}</p> : null}
      {error ? (
        <p role="alert" className="mt-2 ml-8 flex flex-wrap items-center gap-2 text-sm text-danger">
          {error}
          {props.onRetry ? (
            <Button variant="quiet" className="min-h-9 px-2 text-sm" onClick={props.onRetry}>
              {t.session.retry}
            </Button>
          ) : null}
        </p>
      ) : null}
      {(current && weight && !done) || actionsOpen ? (
        <div className="mt-2 ml-8 flex flex-wrap gap-2">
          {current && weight && !done ? (
            <>
              <Button
                variant="secondary"
                className="min-h-10 px-3"
                onClick={() => {
                  stepValue(-1);
                }}
                aria-label={t.session.stepDown(props.number(props.weightStep))}
              >
                <Minus aria-hidden="true" className="size-4" />
                {props.number(props.weightStep)}
              </Button>
              <Button
                variant="secondary"
                className="min-h-10 px-3"
                onClick={() => {
                  stepValue(1);
                }}
                aria-label={t.session.stepUp(props.number(props.weightStep))}
              >
                <Plus aria-hidden="true" className="size-4" />
                {props.number(props.weightStep)}
              </Button>
            </>
          ) : null}
          {actionsOpen ? (
            <>
              {!done && !skipped ? (
                <Button variant="secondary" className="min-h-10 px-3" onClick={props.onSkip}>
                  {t.session.skip}
                </Button>
              ) : null}
              <Button variant="danger" className="min-h-10 px-3" onClick={props.onRemove}>
                {t.session.removeSet}
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
      className="flex items-center gap-2 px-2 text-xs font-semibold text-muted"
    >
      <span className="w-6 shrink-0 text-center">#</span>
      <span className="w-16 shrink-0">{t.session.previous}</span>
      <span
        className={cn(
          'grid min-w-0 flex-1 gap-2',
          fields.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {fields.map((spec) => (
          <span key={spec.label} className="text-center">
            {t.session.units[spec.label]}
          </span>
        ))}
      </span>
      <span className="w-11 shrink-0" />
      <span className="w-8 shrink-0" />
    </div>
  );
}
