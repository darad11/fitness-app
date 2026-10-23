import { Check, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { tWater } from '@/shared/i18n/de-water';
import { cn } from '@/shared/lib/cn';
import type { DayKey } from '@/shared/lib/time';
import { Button, Card, chipClasses, IconButton, Skeleton, Toast } from '@/shared/ui';
import { dayTotal, entriesOf, parseAmount, progress } from '../calc/water';
import { useQuickAmounts, useWaterEntries, useWaterGoals } from '../data/useWater';
import type { WaterEntry } from '../model/waterEntry';
import { addWater, deleteWater, restoreWater } from '../service/waterService';
import { formatMl } from './format';

const tw = tWater;
/** Schnellmengen als Chips (D-314); beim Antippen kurz Lime. */
const QUICK = chipClasses(false, 'active:bg-accent active:text-on-accent', { fill: true });
const INPUT = 'field w-full min-w-0';

/**
 * Wasser eines Tages (D-289): Menge, Ziel, Rest, Balken mit Zielmarke, vier Schnellmengen mit
 * einem Tipp, eigene Menge und „letzten Eintrag entfernen“. Auf „Heute“, in der Ernährung und
 * auf der Seite „Wasser“.
 */
export function WaterCard({
  day,
  title = tw.title,
  showDetailsLink = true,
  className,
}: {
  day: DayKey;
  title?: string;
  showDetailsLink?: boolean;
  className?: string;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const entries = useWaterEntries(day);
  const goals = useWaterGoals();
  const quick = useQuickAmounts();
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<WaterEntry | null>(null);

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'water', error: caught, route: '/ernaehrung/wasser' });
      setError(tw.saveFailed);
    });
  };

  const action = showDetailsLink ? (
    <Link
      to={`/ernaehrung/wasser?tag=${day}`}
      aria-label={tw.details}
      title={tw.details}
      className="inline-flex size-touch items-center justify-center rounded-pill text-muted hover:bg-surface-2 hover:text-fg"
    >
      <ChevronRight aria-hidden="true" className="size-5" />
    </Link>
  ) : undefined;

  if (entries === undefined || goals === undefined) {
    return (
      <Card title={title} titleStyle="label" action={action} className={className}>
        <div aria-busy="true">
          <Skeleton className="h-28" />
        </div>
      </Card>
    );
  }

  const state = progress(dayTotal(entries, day), goals.goalOn(day));
  const last = entriesOf(entries, day)[0];
  // Über dem Ziel wächst die Skala mit, damit die Zielmarke sichtbar bleibt und nichts bei 100 % endet.
  const scale = Math.max(state.goalMl, state.totalMl, 1);
  const fill = (state.totalMl / scale) * 100;
  const mark = (state.goalMl / scale) * 100;

  return (
    <Card title={title} titleStyle="label" action={action} className={className}>
      <p className="flex flex-wrap items-baseline gap-x-2" aria-live="polite">
        <span className="text-value font-semibold tabular-nums">
          {formatMl(fmt, state.totalMl)}
        </span>
        <span className="text-muted tabular-nums">{tw.ofGoal(formatMl(fmt, state.goalMl))}</span>
      </p>
      <p
        className={cn(
          'mt-1 flex items-center gap-1.5 text-sm',
          state.reached ? 'font-semibold text-success' : 'text-muted',
        )}
      >
        {state.reached ? <Check aria-hidden="true" className="size-4" /> : null}
        {state.reached
          ? state.totalMl > state.goalMl
            ? tw.reachedOver(formatMl(fmt, state.totalMl - state.goalMl))
            : tw.reached
          : tw.remaining(formatMl(fmt, state.remainingMl))}
      </p>

      <div
        role="progressbar"
        aria-label={tw.meterLabel(formatMl(fmt, state.totalMl), formatMl(fmt, state.goalMl))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(state.ratio * 100))}
        className="relative mt-4 h-1.5"
      >
        <div className="h-full overflow-hidden rounded-pill bg-meter-track">
          <div
            className={cn(
              'h-full rounded-pill transition-[width] duration-240',
              state.reached ? 'bg-success' : 'bg-accent',
            )}
            style={{ width: `${String(fill)}%` }}
          />
        </div>
        {/* Zielmarke: am Ende, solange das Ziel offen ist; danach mittendrin. */}
        <span
          aria-hidden="true"
          className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-pill bg-fg/60"
          style={{ left: `${String(Math.min(mark, 99.5))}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quick.map((amount, index) => (
          <button
            key={`${String(index)}-${String(amount)}`}
            type="button"
            aria-label={tw.quickAdd(formatMl(fmt, amount))}
            className={QUICK}
            onClick={() => {
              run(() => addWater(rt, amount, { day }));
            }}
          >
            +{formatMl(fmt, amount)}
          </button>
        ))}
      </div>

      {customOpen ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const amount = parseAmount(custom);
            if (amount === null) {
              setError(tw.amountInvalid);
              return;
            }
            run(async () => {
              await addWater(rt, amount, { day });
              setCustom('');
              setCustomOpen(false);
            });
          }}
        >
          <label htmlFor={`wasser-menge-${day}`} className="sr-only">
            {tw.customLabel}
          </label>
          <input
            id={`wasser-menge-${day}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
            value={custom}
            placeholder={tw.customPlaceholder}
            onChange={(event) => {
              setCustom(event.target.value);
              setError(null);
            }}
            className={INPUT}
          />
          <Button type="submit" size="md">
            {tw.add}
          </Button>
          <IconButton
            label={tw.cancel}
            onClick={() => {
              setCustomOpen(false);
              setCustom('');
              setError(null);
            }}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </IconButton>
        </form>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              setCustomOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {tw.custom}
          </Button>
          {last ? (
            <IconButton
              label={tw.undoLast(formatMl(fmt, last.amountMl))}
              title={tw.undoLast(formatMl(fmt, last.amountMl))}
              onClick={() => {
                run(async () => {
                  await deleteWater(rt, last.id);
                  setRemoved(last);
                });
              }}
            >
              <RotateCcw aria-hidden="true" className="size-5" />
            </IconButton>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {removed ? (
        <Toast
          key={removed.id}
          message={tw.removed(formatMl(fmt, removed.amountMl))}
          durationMs={8000}
          onTimeout={() => {
            setRemoved(null);
          }}
          action={
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                const entry = removed;
                setRemoved(null);
                run(() => restoreWater(rt, entry.id));
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {tw.undo}
            </Button>
          }
        />
      ) : null}
    </Card>
  );
}
