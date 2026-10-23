import { useEffect, useState } from 'react';
import { useCompletedSessions } from '@/modules/training';
import { loadWaterReached } from '@/modules/water';
import { logError, useDb } from '@/shared/db';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card, Meter, SettingsLink, Skeleton } from '@/shared/ui';
import { applyAutoDone, applyWaterAutoDoneToday, setHabitDone } from '../service/habitService';
import { TaskCheckbox } from './TaskCheckbox';
import { useTodayTasks } from './useTodayTasks';

/** So viele Aufgaben zeigt die Karte zuerst; der Rest per „weitere anzeigen“. */
const VISIBLE = 6;

/**
 * Karte „Tagesaufgaben“ auf „Heute“ (AH-03, D-283): schlichte Liste zum Abhaken, jeden Tag neu,
 * darunter ein schmaler Balken mit „x von y erledigt“; Weg zur Verwaltung.
 */
export function TasksCard({ className }: { className?: string }) {
  const rt = useDb();
  const tasks = useTodayTasks();
  const [expanded, setExpanded] = useState(false);
  const sessions = useCompletedSessions();
  const trainedToday =
    tasks !== undefined &&
    (sessions ?? []).some(
      (session) =>
        dayKey(new Date(session.endedAt ?? session.startedAt), localTimeZone()) === tasks.today,
    );
  // D-285: Aufgaben „mit Training abhaken“, sobald heute ein Training abgeschlossen ist.
  useEffect(() => {
    if (!tasks || !trainedToday) return;
    const logged = new Set(
      tasks.logs.filter((log) => log.dayKey === tasks.today).map((log) => log.habitId),
    );
    applyAutoDone(rt, tasks.active, tasks.today, (id) => logged.has(id), true).catch(
      (error: unknown) => {
        void logError(rt.db, { area: 'habits', error, route: '/heute' });
      },
    );
  }, [rt, tasks, trainedToday]);
  // D-289: Aufgaben „mit Wasserziel abhaken“, wenn das Ziel heute schon erreicht ist (z. B. auf
  // einem anderen Gerät eingetragen). Beim Eintragen selbst hakt der Wasser-Dienst ab.
  const waterPending =
    tasks?.active.some(
      (habit) =>
        habit.autoDone === 'water' &&
        !tasks.logs.some((log) => log.habitId === habit.id && log.dayKey === tasks.today),
    ) ?? false;
  useEffect(() => {
    if (!tasks || !waterPending) return;
    loadWaterReached(rt.db, tasks.today)
      .then((reached) => (reached ? applyWaterAutoDoneToday(rt, tasks.today) : 0))
      .catch((error: unknown) => {
        void logError(rt.db, { area: 'habits', error, route: '/heute' });
      });
  }, [rt, tasks, waterPending]);
  const hidden = tasks ? Math.max(0, tasks.active.length - VISIBLE) : 0;
  const shown = tasks ? (expanded ? tasks.active : tasks.active.slice(0, VISIBLE)) : [];
  return (
    <Card
      title={t.tasks.title}
      titleStyle="label"
      className={className}
      action={<SettingsLink to="/heute/aufgaben" label={t.tasks.manage} />}
    >
      {tasks === undefined ? (
        <div aria-busy="true">
          <Skeleton className="h-16" />
        </div>
      ) : tasks.active.length === 0 && tasks.listed.length > 0 ? (
        <p className="text-muted">{t.tasks.noneDueToday}</p>
      ) : tasks.active.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">{t.tasks.emptyCard}</p>
          <ButtonLink to="/heute/aufgaben" size="sm" variant="quiet" className="-ml-4">
            {t.tasks.add}
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {shown.map((habit) => (
              <li key={habit.id}>
                <TaskCheckbox
                  label={habit.name}
                  checked={tasks.doneIds.has(habit.id)}
                  onChange={(checked) => {
                    setHabitDone(rt, habit.id, tasks.today, checked).catch((error: unknown) => {
                      void logError(rt.db, { area: 'habits', error, route: '/heute' });
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          {hidden > 0 ? (
            <Button
              size="sm"
              variant="quiet"
              className="-ml-3"
              aria-expanded={expanded}
              onClick={() => {
                setExpanded((open) => !open);
              }}
            >
              {expanded ? t.tasks.showLess : t.tasks.showMore(hidden)}
            </Button>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <Meter
              className="h-1.5 flex-1"
              label={t.tasks.progressLabel}
              value={tasks.status.total === 0 ? 0 : tasks.status.done / tasks.status.total}
            />
            <p className="shrink-0 text-sm text-muted tabular-nums">
              {tasks.status.complete
                ? t.tasks.todayDone
                : t.tasks.todayProgress(tasks.status.done, tasks.status.total)}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
