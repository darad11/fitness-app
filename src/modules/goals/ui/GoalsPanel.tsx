import { useState } from 'react';
import { useBodyWeights } from '@/modules/body';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Card, SelectField, Skeleton } from '@/shared/ui';
import { activeGoal } from '../calc/goals';
import { useGoals } from '../data/useGoals';
import { GOAL_LIMITS, type GoalKind } from '../model/goal';
import { removeGoal, setGoal } from '../service/goalService';

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';
const WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  value: String(n),
  label: t.goals.perWeek(n),
}));

/** Zielgewicht und Wochenziel mit Historie (S-33, AK-SET-01). */
export function GoalsPanel() {
  const rt = useDb();
  const fmt = useFormatters();
  const goals = useGoals();
  const weights = useBodyWeights();
  const latestWeight = weights?.[0];
  const [weightInput, setWeightInput] = useState('');
  const [weekly, setWeekly] = useState('3');
  const [error, setError] = useState<{ kind: GoalKind; message: string } | null>(null);
  if (!goals) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-40" />
      </div>
    );
  }
  const weightGoal = activeGoal(goals, 'body_weight');
  const weeklyGoal = activeGoal(goals, 'weekly_sessions');
  const run = (kind: GoalKind, action: () => Promise<unknown>) => {
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'goals', error: caught, route: '/mehr/profil' });
      setError({ kind, message: t.goals.saveFailed });
    });
  };
  const formatValue = (kind: GoalKind, value: number) =>
    kind === 'body_weight' ? fmt.bodyWeightKg(value) : t.goals.perWeek(value);

  return (
    <>
      <Card title={t.goals.weightTitle}>
        <p className="mb-3 text-muted">
          {weightGoal ? t.goals.current(fmt.bodyWeightKg(weightGoal.value)) : t.goals.weightNone}
        </p>
        {/* Zielgewicht ist ein Wunsch, keine Messung: das gemessene Gewicht steht daneben. */}
        <p className="-mt-2 mb-3 text-sm text-muted">
          {latestWeight
            ? t.goals.currentWeight(fmt.bodyWeightKg(latestWeight.weightKg))
            : t.goals.noCurrentWeight}
        </p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = parseDecimal(weightInput);
            if (
              value === null ||
              value < GOAL_LIMITS.body_weight.min ||
              value > GOAL_LIMITS.body_weight.max
            ) {
              setError({ kind: 'body_weight', message: t.goals.invalidWeight });
              return;
            }
            setError(null);
            run('body_weight', async () => {
              await setGoal(rt, 'body_weight', value);
              setWeightInput('');
            });
          }}
        >
          <label htmlFor="zielgewicht" className="sr-only">
            {t.goals.weightLabel}
          </label>
          <input
            id="zielgewicht"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={t.goals.weightPlaceholder}
            value={weightInput}
            onChange={(event) => {
              setWeightInput(event.target.value);
            }}
            className={`${INPUT} max-w-40`}
          />
          <Button type="submit">{weightGoal ? t.goals.change : t.goals.set}</Button>
          {weightGoal ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                run('body_weight', () => removeGoal(rt, 'body_weight'));
              }}
            >
              {t.goals.remove}
            </Button>
          ) : null}
        </form>
        {error?.kind === 'body_weight' ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error.message}
          </p>
        ) : null}
      </Card>

      <Card title={t.goals.weeklyTitle}>
        <p className="mb-3 text-muted">
          {weeklyGoal ? t.goals.current(t.goals.perWeek(weeklyGoal.value)) : t.goals.weeklyNone}
        </p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            run('weekly_sessions', () => setGoal(rt, 'weekly_sessions', Number(weekly)));
          }}
        >
          <div className="min-w-48">
            <SelectField
              label={t.goals.weeklyLabel}
              options={WEEKLY_OPTIONS}
              value={weekly}
              onChange={setWeekly}
            />
          </div>
          <Button type="submit">{weeklyGoal ? t.goals.change : t.goals.set}</Button>
          {weeklyGoal ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                run('weekly_sessions', () => removeGoal(rt, 'weekly_sessions'));
              }}
            >
              {t.goals.remove}
            </Button>
          ) : null}
        </form>
        {error?.kind === 'weekly_sessions' ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error.message}
          </p>
        ) : null}
      </Card>

      {goals.length > 0 ? (
        <Card title={t.goals.historyTitle}>
          <ul className="divide-y divide-line text-sm">
            {goals.map((goal) => (
              <li key={goal.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {t.goals.kinds[goal.kind]}: {formatValue(goal.kind, goal.value)}
                </span>
                <span className="text-muted tabular-nums">
                  {t.goals.since(fmt.dayMonthYear(new Date(`${goal.effectiveFrom}T12:00:00`)))}
                  {goal.endedAt
                    ? ` · ${t.goals.until(fmt.dayMonthYear(new Date(goal.endedAt)))}`
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
