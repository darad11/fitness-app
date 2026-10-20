import { Settings2 } from 'lucide-react';
import { Link } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, Meter, Skeleton } from '@/shared/ui';
import { setHabitDone } from '../service/habitService';
import { TaskCheckbox } from './TaskCheckbox';
import { useTodayTasks } from './useTodayTasks';

/**
 * Karte „Tagesaufgaben“ auf „Heute“ (AH-03, D-283): schlichte Liste zum Abhaken, jeden Tag neu,
 * darunter ein schmaler Balken mit „x von y erledigt“; Weg zur Verwaltung.
 */
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
          aria-label={t.tasks.manage}
          className="-my-2 -mr-2 inline-flex size-11 items-center justify-center rounded-pill text-accent-ink transition-colors duration-120 hover:bg-surface-2"
        >
          <Settings2 aria-hidden="true" className="size-5" />
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
