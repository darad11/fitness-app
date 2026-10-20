import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, IconButton, PageHeader, Skeleton, Toast } from '@/shared/ui';
import { HABIT_NAME_MAX, type Habit } from '../model/habit';
import {
  addHabit,
  endHabit,
  moveHabit,
  removeHabit,
  renameHabit,
  reopenHabit,
  undoHabitChange,
} from '../service/habitService';
import { useTodayTasks } from './useTodayTasks';

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg';

interface Change {
  kind: 'paused' | 'removed';
  before: Habit;
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
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [change, setChange] = useState<Change | null>(null);
  const [showPaused, setShowPaused] = useState(false);
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
        <div className="grid gap-4">
          <Card
            title={t.tasks.listTitle}
            action={
              <IconButton
                label={t.tasks.pausedToggle(paused.length)}
                aria-expanded={showPaused}
                aria-controls="pausierte-aufgaben"
                className={showPaused ? 'bg-surface-2 text-fg' : undefined}
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
            {tasks.active.length === 0 ? (
              <p className="mt-4 text-muted">{t.tasks.emptyList}</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-line">
                  {tasks.active.map((habit, index) => (
                    <li key={habit.id}>
                      {editing?.id === habit.id ? (
                        <form
                          className="grid gap-2 py-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const next = editing.name.trim();
                            if (next.length === 0) {
                              setError(t.tasks.nameMissing);
                              return;
                            }
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
                            className={INPUT}
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
                              variant="quiet"
                              className="text-danger"
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
                              setEditing({ id: habit.id, name: habit.name });
                            }}
                          >
                            {habit.name}
                          </button>
                          <IconButton
                            label={`${t.session.moveUp}, ${habit.name}`}
                            disabled={index === 0}
                            className="disabled:opacity-30"
                            onClick={() => {
                              run(() => moveHabit(rt, habit.id, -1));
                            }}
                          >
                            <ChevronUp aria-hidden="true" className="size-5" />
                          </IconButton>
                          <IconButton
                            label={`${t.session.moveDown}, ${habit.name}`}
                            disabled={index === tasks.active.length - 1}
                            className="disabled:opacity-30"
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
                            className="text-danger"
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
              variant="onInk"
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
