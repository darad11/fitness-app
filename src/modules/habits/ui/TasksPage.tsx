import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { Button, Card, PageHeader, Skeleton, StatTile, Toast } from '@/shared/ui';
import { recentDays } from '../calc/streak';
import { HABIT_NAME_MAX, type Habit } from '../model/habit';
import {
  addHabit,
  endHabit,
  moveHabit,
  renameHabit,
  reopenHabit,
  setHabitDone,
} from '../service/habitService';
import { TaskCheckbox } from './TaskCheckbox';
import { useTodayTasks } from './useTodayTasks';

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg';

/** Tagesaufgaben verwalten (AH-03, AH-04): anlegen, umbenennen, ordnen, beenden; Serie und Übersicht. */
export function TasksPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const tasks = useTodayTasks();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [ended, setEnded] = useState<Habit | null>(null);
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

  return (
    <>
      <PageHeader title={t.tasks.title} back={{ to: '/heute', label: t.nav.today }} />
      {tasks === undefined ? (
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-4">
          <dl className="grid grid-cols-2 gap-3">
            <StatTile
              label={t.tasks.streakLabel}
              value={fmt.number(tasks.streak.days)}
              unit={tasks.streak.days === 1 ? t.tasks.day : t.tasks.days}
              hint={
                tasks.streak.days > 0 && !tasks.streak.includesToday
                  ? t.tasks.streakOpen
                  : undefined
              }
            />
            <StatTile
              label={t.tasks.todayLabel}
              value={`${fmt.number(tasks.status.done)} / ${fmt.number(tasks.status.total)}`}
              hint={tasks.status.complete ? t.tasks.todayDone : undefined}
            />
          </dl>

          <Card title={t.tasks.addTitle}>
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
              <Button type="submit">
                <Plus aria-hidden="true" className="size-5" />
                {t.tasks.add}
              </Button>
            </form>
            {error ? (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </Card>

          <Card title={t.tasks.listTitle}>
            {tasks.active.length === 0 ? (
              <p className="text-muted">{t.tasks.emptyList}</p>
            ) : (
              <ul className="divide-y divide-line">
                {tasks.active.map((habit, index) => (
                  <li key={habit.id} className="py-2">
                    {editing?.id === habit.id ? (
                      <form
                        className="flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const next = editing.name.trim();
                          if (next.length === 0) return;
                          run(async () => {
                            await renameHabit(rt, habit.id, next);
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
                            setEditing({ id: habit.id, name: event.target.value });
                          }}
                          className={cn(INPUT, 'flex-1')}
                        />
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
                          {t.session.cancel}
                        </Button>
                      </form>
                    ) : (
                      <>
                        <TaskCheckbox
                          label={habit.name}
                          checked={tasks.doneIds.has(habit.id)}
                          onChange={(checked) => {
                            run(() => setHabitDone(rt, habit.id, tasks.today, checked));
                          }}
                        />
                        <div className="ml-10 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="quiet"
                            onClick={() => {
                              setEditing({ id: habit.id, name: habit.name });
                            }}
                          >
                            {t.tasks.rename}
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            disabled={index === 0}
                            aria-label={`${t.session.moveUp}, ${habit.name}`}
                            onClick={() => {
                              run(() => moveHabit(rt, habit.id, -1));
                            }}
                          >
                            <ChevronUp aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            disabled={index === tasks.active.length - 1}
                            aria-label={`${t.session.moveDown}, ${habit.name}`}
                            onClick={() => {
                              run(() => moveHabit(rt, habit.id, 1));
                            }}
                          >
                            <ChevronDown aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            className="text-danger"
                            aria-label={`${t.tasks.end}, ${habit.name}`}
                            onClick={() => {
                              run(async () => {
                                const result = await endHabit(rt, habit.id);
                                setEnded(result);
                              });
                            }}
                          >
                            {t.tasks.end}
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t.tasks.overviewTitle}>
            <ol className="flex flex-wrap gap-1.5" aria-label={t.tasks.overviewAria}>
              {recentDays(tasks.habits, tasks.logs, tasks.today, 14).map(({ dayKey, status }) => (
                <li
                  key={dayKey}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-pill text-xs font-semibold tabular-nums',
                    status.complete
                      ? 'bg-success-soft text-success'
                      : status.total === 0
                        ? 'bg-surface-2 text-muted'
                        : 'bg-surface-2 text-fg',
                  )}
                  title={t.tasks.dayTitle(
                    fmt.dayMonth(new Date(`${dayKey}T12:00:00`)),
                    status.done,
                    status.total,
                  )}
                >
                  <span className="sr-only">
                    {t.tasks.dayTitle(
                      fmt.dayMonth(new Date(`${dayKey}T12:00:00`)),
                      status.done,
                      status.total,
                    )}
                  </span>
                  <span aria-hidden="true">{dayKey.slice(8)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">{t.tasks.overviewHint}</p>
          </Card>

          {tasks.habits.some((habit) => habit.toDayKey !== undefined) ? (
            <Card title={t.tasks.endedTitle}>
              <ul className="divide-y divide-line">
                {tasks.habits
                  .filter((habit) => habit.toDayKey !== undefined)
                  .map((habit) => (
                    <li key={habit.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 flex-1 text-muted">{habit.name}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          run(() => reopenHabit(rt, habit.id));
                        }}
                      >
                        {t.tasks.reopen}
                      </Button>
                    </li>
                  ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
      {ended ? (
        <Toast
          message={t.tasks.ended(ended.name)}
          durationMs={10_000}
          onTimeout={() => {
            setEnded(null);
          }}
          action={
            <Button
              variant="onInk"
              size="sm"
              onClick={() => {
                const id = ended.id;
                setEnded(null);
                run(() => reopenHabit(rt, id));
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
