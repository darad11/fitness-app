import { Flame } from 'lucide-react';
import { Link } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, Skeleton } from '@/shared/ui';
import { setHabitDone } from '../service/habitService';
import { TaskCheckbox } from './TaskCheckbox';
import { useTodayTasks } from './useTodayTasks';

/** Karte „Tagesaufgaben“ auf „Heute“ (AH-03): abhaken, Serie, Weg zur Verwaltung. */
export function TasksCard({ className }: { className?: string }) {
  const rt = useDb();
  const tasks = useTodayTasks();
  return (
    <Card
      title={t.tasks.title}
      className={className}
      action={
        <Link
          to="/heute/aufgaben"
          className="inline-flex min-h-11 items-center font-semibold text-accent-ink"
        >
          {t.tasks.manage}
        </Link>
      }
    >
      {tasks === undefined ? (
        <div aria-busy="true">
          <Skeleton className="h-16" />
        </div>
      ) : tasks.active.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">{t.tasks.emptyCard}</p>
          <ButtonLink to="/heute/aufgaben" size="sm" variant="secondary">
            {t.tasks.add}
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {tasks.active.map((habit) => (
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
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Flame
              aria-hidden="true"
              className={tasks.streak.days > 0 ? 'size-4 text-warning' : 'size-4'}
            />
            <span>
              {t.tasks.streak(tasks.streak.days)}
              {' · '}
              {tasks.status.complete
                ? t.tasks.todayDone
                : t.tasks.todayProgress(tasks.status.done, tasks.status.total)}
            </span>
          </p>
        </>
      )}
    </Card>
  );
}
