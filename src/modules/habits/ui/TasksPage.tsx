import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, IconButton, PageHeader, Skeleton, Toast } from '@/shared/ui';
import { HABIT_NAME_MAX } from '../model/habit';
import {
  addHabit,
  moveHabit,
  removeHabit,
  reopenHabit,
  setHabitDone,
  undoHabitChange,
} from '../service/habitService';
import { TaskRow } from './TaskRow';
import type { TaskChange } from './TaskSettings';
import { TaskStats } from './TaskStats';
import { useHabitHistory } from './useHabitHistory';
import { useTodayTasks } from './useTodayTasks';
import type { InsightPeriod } from '../calc/insights';

const INPUT = 'field w-full min-w-0';

/**
 * Tagesaufgaben (AH-03, D-283): hinzufügen, abhaken, ordnen; pausierte wieder aufnehmen;
 * Fortschritt darunter. Zeilen wie auf „Heute“ (F6, D-335): Abhakfeld links, der Rest der Zeile
 * öffnet die Detailansicht mit Wochentagen und Einstellungen (umbenennen, pausieren, löschen).
 * Kommt man nach Pausieren oder Löschen von dort zurück, erscheint der Hinweis mit „Rückgängig“.
 */
export function TasksPage() {
  const rt = useDb();
  const tasks = useTodayTasks();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const incoming = (location.state as { taskChange?: TaskChange } | null)?.taskChange;
  const [change, setChange] = useState<TaskChange | null>(incoming ?? null);
  const [ordering, setOrdering] = useState(false);
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
  // Den Hinweis aus der Detailansicht nur einmal zeigen, nicht nach Neuladen oder Zurück.
  useEffect(() => {
    if (incoming) void navigate(location.pathname, { replace: true, state: null });
  }, [incoming, navigate, location.pathname]);

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
                      {ordering ? (
                        <div className="flex min-h-14 items-center gap-1">
                          <span className="min-w-0 flex-1 py-2 break-words">{habit.name}</span>
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
                      ) : (
                        <TaskRow
                          habit={habit}
                          today={tasks.today}
                          checked={tasks.doneIds.has(habit.id)}
                          due={tasks.active.some((item) => item.id === habit.id)}
                          onChange={(checked) => {
                            run(() => setHabitDone(rt, habit.id, tasks.today, checked));
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
                {tasks.listed.length > 1 ? (
                  <Button
                    size="sm"
                    variant="quiet"
                    className="-ml-3"
                    onClick={() => {
                      setOrdering((on) => !on);
                    }}
                  >
                    {ordering ? t.tasks.reorderDone : t.tasks.reorder}
                  </Button>
                ) : null}
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
