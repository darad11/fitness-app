import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { tWater } from '@/shared/i18n/de-water';
import { Button, Card, Chip, IconButton, PageHeader, Skeleton, Switch, Toast } from '@/shared/ui';
import { weekdaysOn } from '../calc/days';
import { loadWaterReached } from '@/modules/water';
import { HABIT_NAME_MAX, type Habit, type HabitAutoDone } from '../model/habit';
import {
  addHabit,
  applyWaterAutoDoneToday,
  endHabit,
  moveHabit,
  removeHabit,
  renameHabit,
  reopenHabit,
  setHabitAutoDone,
  setHabitWeekdays,
  undoHabitChange,
} from '../service/habitService';
import { TaskStats } from './TaskStats';
import { useHabitHistory } from './useHabitHistory';
import { useTodayTasks } from './useTodayTasks';
import type { InsightPeriod } from '../calc/insights';

const INPUT = 'field w-full min-w-0';

interface Editing {
  id: string;
  name: string;
  weekdays: number[];
  auto: HabitAutoDone | null;
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

function startEditing(habit: Habit, today: string): Editing {
  return {
    id: habit.id,
    name: habit.name,
    weekdays: [...(weekdaysOn(habit, today) ?? ALL_DAYS)],
    auto: habit.autoDone ?? null,
  };
}

interface Change {
  kind: 'paused' | 'removed';
  before: Habit;
}

/** Kurzinfo unter dem Namen: Wochentage und automatisches Abhaken. */
function summary(habit: Habit, today: string): string {
  const days = weekdaysOn(habit, today);
  const names = tTaskStats.detail.weekdayNames;
  const parts = [
    days ? days.map((day) => names[day - 1] ?? '').join(', ') : null,
    habit.autoDone === 'training'
      ? t.tasks.autoTrainingShort
      : habit.autoDone === 'water'
        ? tWater.autoShort
        : null,
  ].filter((part): part is string => part !== null);
  return parts.join(' · ');
}

/**
 * Tagesaufgaben verwalten (AH-03, D-283): hinzufügen, umbenennen, ordnen, pausieren, löschen;
 * pausierte wieder aufnehmen; Übersicht der letzten 14 Tage. Abgehakt wird auf „Heute“.
 */
export function TasksPage() {
  const rt = useDb();
  const tasks = useTodayTasks();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [change, setChange] = useState<Change | null>(null);
  const [showPaused, setShowPaused] = useState(false);
  const [period, setPeriod] = useState<InsightPeriod>('30d');
  const history = useHabitHistory();
  const run = (action: () => Promise<unknown>) => {
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'habits', error: caught, route: '/heute/aufgaben' });
      setError(t.tasks.saveFailed);
    });
  };
  const add = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(t.tasks.nameMissing);
      return;
    }
    setError(null);
    run(async () => {
      await addHabit(rt, trimmed);
      setName('');
    });
  };
  const paused =
    tasks?.habits.filter((habit) => habit.toDayKey !== undefined && !habit.removedAt) ?? [];

  return (
    <>
      <PageHeader title={t.tasks.title} back={{ to: '/heute', label: t.nav.today }} />
      {tasks === undefined ? (
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Card
            title={t.tasks.listTitle}
            action={
              <IconButton
                label={t.tasks.pausedToggle(paused.length)}
                aria-expanded={showPaused}
                aria-controls="pausierte-aufgaben"
                tone={showPaused ? 'tile' : 'default'}
                onClick={() => {
                  setShowPaused((open) => !open);
                }}
              >
                <Settings2 aria-hidden="true" className="size-5" />
              </IconButton>
            }
          >
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                add();
              }}
            >
              <label htmlFor="aufgabe-name" className="sr-only">
                {t.tasks.nameLabel}
              </label>
              <input
                id="aufgabe-name"
                type="text"
                value={name}
                maxLength={HABIT_NAME_MAX}
                placeholder={t.tasks.namePlaceholder}
                autoComplete="off"
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className={INPUT}
              />
              <Button type="submit" aria-label={t.tasks.add}>
                <Plus aria-hidden="true" className="size-5" />
                <span className="hidden sm:inline">{t.tasks.addShort}</span>
              </Button>
            </form>
            {error ? (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            {tasks.listed.length === 0 ? (
              <p className="mt-4 text-muted">{t.tasks.emptyList}</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-line">
                  {tasks.listed.map((habit, index) => (
                    <li key={habit.id}>
                      {editing?.id === habit.id ? (
                        <form
                          className="grid grid-cols-1 gap-2 py-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const next = editing.name.trim();
                            if (next.length === 0) {
                              setError(t.tasks.nameMissing);
                              return;
                            }
                            const before = startEditing(habit, tasks.today);
                            run(async () => {
                              if (next !== habit.name) await renameHabit(rt, habit.id, next);
                              if (editing.weekdays.join() !== before.weekdays.join()) {
                                await setHabitWeekdays(rt, habit.id, editing.weekdays);
                              }
                              if (editing.auto !== before.auto) {
                                await setHabitAutoDone(rt, habit.id, editing.auto);
                                // Ist das Wasserziel heute schon erreicht, gleich abhaken (D-289).
                                if (
                                  editing.auto === 'water' &&
                                  (await loadWaterReached(rt.db, tasks.today))
                                ) {
                                  await applyWaterAutoDoneToday(rt, tasks.today);
                                }
                              }
                              setEditing(null);
                            });
                          }}
                        >
                          <label htmlFor={`umbenennen-${habit.id}`} className="sr-only">
                            {t.tasks.nameLabel}
                          </label>
                          <input
                            id={`umbenennen-${habit.id}`}
                            type="text"
                            value={editing.name}
                            maxLength={HABIT_NAME_MAX}
                            autoFocus
                            onChange={(event) => {
                              setEditing({ ...editing, name: event.target.value });
                            }}
                            className={INPUT}
                          />
                          <fieldset>
                            <legend className="mb-1.5 text-sm font-semibold text-muted">
                              {t.tasks.weekdaysLegend}
                            </legend>
                            <div className="grid grid-cols-7 gap-1">
                              {ALL_DAYS.map((day) => {
                                const on = editing.weekdays.includes(day);
                                const name = tTaskStats.detail.weekdayNames[day - 1] ?? '';
                                return (
                                  <Chip
                                    key={day}
                                    pressed={on}
                                    fill
                                    aria-label={t.tasks.weekdayToggle(name)}
                                    onClick={() => {
                                      const next = on
                                        ? editing.weekdays.filter((d) => d !== day)
                                        : [...editing.weekdays, day].sort((a, b) => a - b);
                                      if (next.length === 0) return;
                                      setEditing({ ...editing, weekdays: next });
                                    }}
                                  >
                                    {name}
                                  </Chip>
                                );
                              })}
                            </div>
                            <p className="mt-1.5 text-sm text-muted">{t.tasks.weekdaysHint}</p>
                          </fieldset>
                          {/* Höchstens eine Regel: Training oder Wasserziel (D-285, D-289). */}
                          <Switch
                            label={t.tasks.autoTraining}
                            hint={t.tasks.autoTrainingHint}
                            checked={editing.auto === 'training'}
                            onChange={(checked) => {
                              setEditing({ ...editing, auto: checked ? 'training' : null });
                            }}
                          />
                          <Switch
                            label={tWater.auto}
                            hint={tWater.autoHint}
                            checked={editing.auto === 'water'}
                            onChange={(checked) => {
                              setEditing({ ...editing, auto: checked ? 'water' : null });
                            }}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="submit" size="sm">
                              {t.tasks.save}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditing(null);
                              }}
                            >
                              {t.tasks.cancel}
                            </Button>
                            <span className="flex-1" />
                            <Button
                              type="button"
                              size="sm"
                              variant="quiet"
                              onClick={() => {
                                run(async () => {
                                  await endHabit(rt, habit.id);
                                  setEditing(null);
                                  setChange({ kind: 'paused', before: habit });
                                });
                              }}
                            >
                              {t.tasks.pause}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="quietDanger"
                              onClick={() => {
                                run(async () => {
                                  await removeHabit(rt, habit.id);
                                  setEditing(null);
                                  setChange({ kind: 'removed', before: habit });
                                });
                              }}
                            >
                              {t.tasks.remove}
                            </Button>
                          </div>
                          <p className="text-sm text-muted">{t.tasks.removeHint}</p>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={t.tasks.editLabel(habit.name)}
                            className="min-h-12 min-w-0 flex-1 py-2 text-left"
                            onClick={() => {
                              setEditing(startEditing(habit, tasks.today));
                            }}
                          >
                            <span className="block">{habit.name}</span>
                            {summary(habit, tasks.today) ? (
                              <span className="block text-sm text-muted">
                                {summary(habit, tasks.today)}
                              </span>
                            ) : null}
                          </button>
                          <IconButton
                            label={`${t.session.moveUp}, ${habit.name}`}
                            disabled={index === 0}
                            onClick={() => {
                              run(() => moveHabit(rt, habit.id, -1));
                            }}
                          >
                            <ChevronUp aria-hidden="true" className="size-5" />
                          </IconButton>
                          <IconButton
                            label={`${t.session.moveDown}, ${habit.name}`}
                            disabled={index === tasks.listed.length - 1}
                            onClick={() => {
                              run(() => moveHabit(rt, habit.id, 1));
                            }}
                          >
                            <ChevronDown aria-hidden="true" className="size-5" />
                          </IconButton>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {showPaused ? (
              <section
                id="pausierte-aufgaben"
                aria-label={t.tasks.pausedTitle}
                className="mt-4 rounded-input bg-surface-2 px-3 py-2"
              >
                <h3 className="pt-1 text-sm font-semibold">{t.tasks.pausedTitle}</h3>
                {paused.length === 0 ? (
                  <p className="py-2 text-sm text-muted">{t.tasks.pausedEmpty}</p>
                ) : (
                  <>
                    <ul className="divide-y divide-line">
                      {paused.map((habit) => (
                        <li key={habit.id} className="flex items-center gap-2 py-2">
                          <span className="min-w-0 flex-1 truncate text-muted">{habit.name}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            aria-label={`${t.tasks.reopen}, ${habit.name}`}
                            onClick={() => {
                              run(() => reopenHabit(rt, habit.id));
                            }}
                          >
                            {t.tasks.reopenShort}
                          </Button>
                          <IconButton
                            label={`${t.tasks.remove}, ${habit.name}`}
                            tone="danger"
                            onClick={() => {
                              run(async () => {
                                await removeHabit(rt, habit.id);
                                setChange({ kind: 'removed', before: habit });
                              });
                            }}
                          >
                            <Trash2 aria-hidden="true" className="size-5" />
                          </IconButton>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-muted">{t.tasks.pausedHint}</p>
                  </>
                )}
              </section>
            ) : null}
          </Card>
          {history ? <TaskStats history={history} period={period} onPeriod={setPeriod} /> : null}
        </div>
      )}
      {change ? (
        <Toast
          message={
            change.kind === 'paused'
              ? t.tasks.paused(change.before.name)
              : t.tasks.removed(change.before.name)
          }
          durationMs={10_000}
          onTimeout={() => {
            setChange(null);
          }}
          action={
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                const before = change.before;
                setChange(null);
                run(() => undoHabitChange(rt, before));
              }}
            >
              {t.session.undoDiscard}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
