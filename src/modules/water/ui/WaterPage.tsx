import { Pencil, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { tWater } from '@/shared/i18n/de-water';
import { addDays, dayKey, isValidDayKey, localTimeZone } from '@/shared/lib/time';
import {
  Button,
  Card,
  IconButton,
  PageHeader,
  SegmentedControl,
  Skeleton,
  StatTile,
  Toast,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { dayBars, entriesOf, parseAmount, validQuickAmounts, waterStats } from '../calc/water';
import { useQuickAmounts, useWaterEntries, useWaterGoals } from '../data/useWater';
import type { WaterEntry } from '../model/waterEntry';
import {
  deleteWater,
  restoreWater,
  saveQuickAmounts,
  setWaterGoal,
  updateWaterAmount,
} from '../service/waterService';
import { formatMl } from './format';
import { WaterCard } from './WaterCard';
import { WaterChart } from './WaterChart';

const tw = tWater;
const INPUT = 'field w-full min-w-0';
type Period = '7' | '30';
const PERIOD_OPTIONS = (['7', '30'] as const).map((value) => ({
  value,
  label: tw.periods[value],
}));

/**
 * Wasser (D-289): Tageskarte, Einträge des Tages zum Korrigieren, Tagesziel, Verlauf über 7 oder
 * 30 Tage und eigene Schnellmengen. `?tag=JJJJ-MM-TT` zeigt einen früheren Tag.
 */
export function WaterPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const now = useToday();
  const today = dayKey(now, localTimeZone());
  const [params] = useSearchParams();
  const requested = params.get('tag');
  const day =
    requested !== null && isValidDayKey(requested) && requested <= today ? requested : today;
  const [period, setPeriod] = useState<Period>('7');
  const history = useWaterEntries(addDays(today, -29));
  const dayEntries = useWaterEntries(day);
  const goals = useWaterGoals();
  const quick = useQuickAmounts();
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [removed, setRemoved] = useState<WaterEntry | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [quickInput, setQuickInput] = useState<string[] | null>(null);
  const [message, setMessage] = useState<{ area: string; text: string; ok?: boolean } | null>(null);

  const run = (area: string, action: () => Promise<unknown>) => {
    setMessage(null);
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'water', error: caught, route: '/ernaehrung/wasser' });
      setMessage({ area, text: tw.saveFailed });
    });
  };
  const note = (area: string) =>
    message?.area === area ? (
      <p
        role={message.ok ? 'status' : 'alert'}
        className={message.ok ? 'mt-2 text-sm text-success' : 'mt-2 text-sm text-danger'}
      >
        {message.text}
      </p>
    ) : null;

  const back = { to: '/ernaehrung', label: tw.back };
  if (history === undefined || dayEntries === undefined || goals === undefined) {
    return (
      <>
        <PageHeader title={tw.title} back={back} />
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </>
    );
  }

  const list = entriesOf(dayEntries, day);
  const currentGoal = goals.goalOn(today);
  const bars = dayBars(history, goals.goalOn, today, Number(period));
  const stats = waterStats(bars);
  const quickValues = quickInput ?? quick.map(String);
  const timeOf = (entry: WaterEntry) => {
    const logged = new Date(entry.loggedAt);
    return dayKey(logged, entry.tz) === entry.dayKey
      ? fmt.time(logged)
      : tw.addedLater(fmt.dayMonth(logged));
  };

  return (
    <>
      <PageHeader title={tw.title} back={back} />
      <div className="grid grid-cols-1 gap-4">
        <WaterCard
          day={day}
          title={day === today ? tw.today : fmt.weekdayDayMonth(new Date(`${day}T12:00:00`))}
          showDetailsLink={false}
        />

        <Card title={tw.entriesTitle}>
          {list.length === 0 ? (
            <p className="text-muted">{tw.entriesEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((entry) =>
                editing?.id === entry.id ? (
                  <li key={entry.id} className="py-3">
                    <form
                      className="grid gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const amount = parseAmount(editing.value);
                        if (amount === null) {
                          setMessage({ area: 'entries', text: tw.amountInvalid });
                          return;
                        }
                        run('entries', async () => {
                          await updateWaterAmount(rt, entry.id, amount);
                          setEditing(null);
                        });
                      }}
                    >
                      <label htmlFor={`wasser-${entry.id}`} className="text-sm text-muted">
                        {`${timeOf(entry)} · ${tw.customLabel}`}
                      </label>
                      <input
                        id={`wasser-${entry.id}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoFocus
                        value={editing.value}
                        onChange={(event) => {
                          setEditing({ id: entry.id, value: event.target.value });
                        }}
                        className={INPUT}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm">
                          {tw.save}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            run('entries', async () => {
                              await deleteWater(rt, entry.id);
                              setEditing(null);
                              setRemoved(entry);
                            });
                          }}
                        >
                          {tw.delete}
                        </Button>
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => {
                            setEditing(null);
                            setMessage(null);
                          }}
                        >
                          {tw.cancel}
                        </Button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li key={entry.id} className="flex min-h-12 items-center gap-3">
                    <span className="flex-1 text-muted tabular-nums">{timeOf(entry)}</span>
                    <span className="font-semibold tabular-nums">
                      {formatMl(fmt, entry.amountMl)}
                    </span>
                    <IconButton
                      label={tw.edit(formatMl(fmt, entry.amountMl))}
                      onClick={() => {
                        setEditing({ id: entry.id, value: String(entry.amountMl) });
                        setMessage(null);
                      }}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </IconButton>
                  </li>
                ),
              )}
            </ul>
          )}
          {note('entries')}
        </Card>

        <Card title={tw.goalTitle}>
          <p className="mb-3">
            {goals.custom(today)
              ? tw.goalCurrent(formatMl(fmt, currentGoal))
              : tw.goalDefault(formatMl(fmt, currentGoal))}
          </p>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = Number(goalInput.replace(/\./g, '').trim());
              if (!Number.isInteger(value) || value < 250 || value > 8000) {
                setMessage({ area: 'goal', text: tw.goalInvalid });
                return;
              }
              run('goal', async () => {
                await setWaterGoal(rt, value);
                setGoalInput('');
              });
            }}
          >
            <label htmlFor="wasser-ziel" className="sr-only">
              {tw.goalLabel}
            </label>
            <input
              id="wasser-ziel"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={goalInput}
              placeholder={tw.goalLabel}
              onChange={(event) => {
                setGoalInput(event.target.value);
              }}
              className={INPUT}
            />
            <Button type="submit">{tw.save}</Button>
          </form>
          {note('goal')}
          <p className="mt-3 text-sm text-muted">{tw.goalHint}</p>
        </Card>

        <Card title={tw.historyTitle}>
          <SegmentedControl
            legend={tw.periodLegend}
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
          {stats.daysWithData === 0 ? (
            <p className="mt-4 text-muted">{tw.historyEmpty}</p>
          ) : (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <StatTile
                  label={tw.average}
                  value={formatMl(fmt, stats.averageMl ?? 0)}
                  hint={tw.averageHint}
                />
                <StatTile
                  label={tw.reachedDays}
                  value={tw.reachedValue(stats.reachedDays, stats.daysWithData)}
                  hint={tw.reachedHint(stats.daysWithData)}
                />
              </dl>
              <div className="mt-4">
                <WaterChart bars={bars} goalMl={currentGoal} />
              </div>
              <p className="mt-2 text-sm text-muted">{tw.chartHint}</p>
              {stats.daysWithoutData > 0 ? (
                <p className="mt-1 text-sm text-muted">{tw.noDataDays(stats.daysWithoutData)}</p>
              ) : null}
            </>
          )}
        </Card>

        <Card title={tw.quickTitle}>
          <p className="mb-3 text-sm text-muted">{tw.quickHint}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const values = quickValues.map((value) => Number(value.trim()));
              if (!validQuickAmounts(values)) {
                setMessage({ area: 'quick', text: tw.quickInvalid });
                return;
              }
              run('quick', async () => {
                await saveQuickAmounts(rt, values);
                setQuickInput(null);
                setMessage({ area: 'quick', text: tw.quickSaved, ok: true });
              });
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              {quickValues.map((value, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={tw.quickLabel(index + 1)}
                  value={value}
                  onChange={(event) => {
                    const next = [...quickValues];
                    next[index] = event.target.value;
                    setQuickInput(next);
                  }}
                  className={`${INPUT} px-2 text-center`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit" size="sm">
                {tw.quickSave}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  run('quick', async () => {
                    await saveQuickAmounts(rt, null);
                    setQuickInput(null);
                    setMessage({ area: 'quick', text: tw.quickSaved, ok: true });
                  });
                }}
              >
                {tw.quickReset}
              </Button>
            </div>
          </form>
          {note('quick')}
        </Card>
      </div>
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
                run('entries', () => restoreWater(rt, entry.id));
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {tw.undo}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
