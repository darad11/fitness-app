import { CircleCheck } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { ButtonLink, Card, Meter, SettingsLink } from '@/shared/ui';
import { weeklyProgress } from '../calc/goals';

/** Karte „Wochenziel“ auf „Heute“ (AK-DSH-05): „x von y Trainings diese Woche“ mit Balken. */
export function WeeklyGoalCard({
  sessions,
  target,
  today,
  className,
}: {
  sessions: readonly { dayKey: string }[];
  target: number | undefined;
  today: string;
  className?: string;
}) {
  if (target === undefined) {
    return (
      <Card title={t.goals.weeklyTitle} titleStyle="label" className={className}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">{t.goals.weeklyCardNone}</p>
          <ButtonLink to="/mehr/profil" size="sm" variant="secondary">
            {t.goals.weeklySet}
          </ButtonLink>
        </div>
      </Card>
    );
  }
  const progress = weeklyProgress(sessions, target, today);
  return (
    <Card
      title={t.goals.weeklyTitle}
      titleStyle="label"
      className={className}
      action={<SettingsLink to="/mehr/profil" label={t.goals.weeklyManage} />}
    >
      <p className="text-2xl font-semibold tabular-nums">
        {t.goals.weeklyProgress(progress.done, progress.target)}
      </p>
      <Meter
        className="mt-3"
        value={progress.target > 0 ? progress.done / progress.target : 0}
        label={t.goals.weeklyProgress(progress.done, progress.target)}
      />
      {progress.reached ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-success">
          <CircleCheck aria-hidden="true" className="size-4" />
          {t.goals.weeklyReached}
        </p>
      ) : null}
    </Card>
  );
}
