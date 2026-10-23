import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { tWater } from '@/shared/i18n/de-water';
import { loadWaterReached } from '@/modules/water';
import { Button, Card, Chip, Switch } from '@/shared/ui';
import { weekdaysOn } from '../calc/days';
import { HABIT_NAME_MAX, type Habit, type HabitAutoDone } from '../model/habit';
import {
  applyWaterAutoDoneToday,
  endHabit,
  removeHabit,
  renameHabit,
  setHabitAutoDone,
  setHabitWeekdays,
} from '../service/habitService';

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Pausieren oder Löschen; „Tagesaufgaben“ zeigt danach den Hinweis mit „Rückgängig“. */
export interface TaskChange {
  kind: 'paused' | 'removed';
  before: Habit;
}

interface Draft {
  name: string;
  weekdays: number[];
  auto: HabitAutoDone | null;
}

function draftOf(habit: Habit, today: string): Draft {
  return {
    name: habit.name,
    weekdays: [...(weekdaysOn(habit, today) ?? ALL_DAYS)],
    auto: habit.autoDone ?? null,
  };
}

/**
 * Einstellungen einer Aufgabe in der Detailansicht (F6, D-335; vorher eine aufklappende Zeile auf
 * „Tagesaufgaben“, D-283, D-285, D-289): Name, Wochentage, höchstens eine Regel zum Abhaken,
 * Speichern; Pausieren und Löschen führen zurück zu „Tagesaufgaben“, dort mit „Rückgängig“.
 */
export function TaskSettings({ habit, today }: { habit: Habit; today: string }) {
  const rt = useDb();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => draftOf(habit, today));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const run = (action: () => Promise<unknown>) => {
    setError(null);
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'habits', error: caught, route: '/heute/aufgaben' });
      setError(t.tasks.saveFailed);
    });
  };
  const edit = (next: Draft) => {
    setDraft(next);
    setSaved(false);
  };
  const leave = (change: TaskChange) => {
    void navigate('/heute/aufgaben', { state: { taskChange: change } });
  };

  return (
    <Card title={t.tasks.settingsTitle}>
      <form
        className="grid grid-cols-1 gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft.name.trim();
          if (next.length === 0) {
            setError(t.tasks.nameMissing);
            return;
          }
          const before = draftOf(habit, today);
          run(async () => {
            if (next !== habit.name) await renameHabit(rt, habit.id, next);
            if (draft.weekdays.join() !== before.weekdays.join()) {
              await setHabitWeekdays(rt, habit.id, draft.weekdays);
            }
            if (draft.auto !== before.auto) {
              await setHabitAutoDone(rt, habit.id, draft.auto);
              // Ist das Wasserziel heute schon erreicht, gleich abhaken (D-289).
              if (draft.auto === 'water' && (await loadWaterReached(rt.db, today))) {
                await applyWaterAutoDoneToday(rt, today);
              }
            }
            setSaved(true);
          });
        }}
      >
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-muted">{t.tasks.nameLabel}</span>
          <input
            type="text"
            value={draft.name}
            maxLength={HABIT_NAME_MAX}
            autoComplete="off"
            onChange={(event) => {
              edit({ ...draft, name: event.target.value });
            }}
            className="field w-full min-w-0"
          />
        </label>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-muted">
            {t.tasks.weekdaysLegend}
          </legend>
          <div className="grid grid-cols-7 gap-1">
            {ALL_DAYS.map((day) => {
              const on = draft.weekdays.includes(day);
              const name = tTaskStats.detail.weekdayNames[day - 1] ?? '';
              return (
                <Chip
                  key={day}
                  pressed={on}
                  fill
                  aria-label={t.tasks.weekdayToggle(name)}
                  onClick={() => {
                    const next = on
                      ? draft.weekdays.filter((d) => d !== day)
                      : [...draft.weekdays, day].sort((a, b) => a - b);
                    if (next.length === 0) return;
                    edit({ ...draft, weekdays: next });
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
          checked={draft.auto === 'training'}
          onChange={(checked) => {
            edit({ ...draft, auto: checked ? 'training' : null });
          }}
        />
        <Switch
          label={tWater.auto}
          hint={tWater.autoHint}
          checked={draft.auto === 'water'}
          onChange={(checked) => {
            edit({ ...draft, auto: checked ? 'water' : null });
          }}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm">
            {t.tasks.save}
          </Button>
          <p role="status" className="text-sm text-muted">
            {saved ? t.tasks.saved : ''}
          </p>
          {/* Pausieren und Löschen bleiben zusammen, rechtsbündig; ist die Zeile zu schmal,
              rücken beide gemeinsam in die nächste (F6 §9). */}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="quiet"
              onClick={() => {
                run(async () => {
                  await endHabit(rt, habit.id);
                  leave({ kind: 'paused', before: habit });
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
                  leave({ kind: 'removed', before: habit });
                });
              }}
            >
              {t.tasks.remove}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted">{t.tasks.removeHint}</p>
      </form>
    </Card>
  );
}
