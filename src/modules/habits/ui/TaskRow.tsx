import { ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { Link, useLocation } from 'react-router';
import { tTasks } from '@/shared/i18n/de-tasks';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { tWater } from '@/shared/i18n/de-water';
import { cn } from '@/shared/lib/cn';
import { Mark } from '@/shared/ui';
import { weekdaysOn } from '../calc/days';
import type { Habit } from '../model/habit';

/** Rhythmus unter dem Namen: „Täglich“ oder „Mo · Mi · Fr“, dazu die Regel zum Abhaken. */
export function rhythm(habit: Habit, today: string): string {
  const days = weekdaysOn(habit, today);
  const names = tTaskStats.detail.weekdayNames;
  const parts = [
    days && days.length < 7
      ? days.map((day) => names[day - 1] ?? '').join(' · ')
      : tTasks.tasks.rhythmDaily,
    habit.autoDone === 'training'
      ? tTasks.tasks.rhythmTraining
      : habit.autoDone === 'water'
        ? tWater.autoRhythm
        : null,
  ].filter((part): part is string => part !== null);
  return parts.join(' · ');
}

/**
 * Zeile einer Tagesaufgabe (F6, D-335, Vorlage V1), gleich auf „Heute“ und „Tagesaufgaben“: links
 * das Abhakfeld (sichtbar 20 px, Tippfläche 44 px), ein Tipp darauf hakt nur ab; der Rest der
 * Zeile öffnet die Detailansicht mit Wochentagen und Einstellungen, rechts ein Chevron in
 * `--fg-faint`. Unter dem Namen der Rhythmus. Erledigt: Name gedämpft, nicht durchgestrichen.
 * Screenreader hören „… abhaken“ und „… bearbeiten“; der Rhythmus beschreibt den Link.
 * Heute nicht fällige Aufgaben (nur auf „Tagesaufgaben“) lassen sich nicht abhaken.
 */
export function TaskRow({
  habit,
  today,
  checked,
  due = true,
  onChange,
}: {
  habit: Habit;
  today: string;
  checked: boolean;
  /** Heute fällig; sonst blasses Feld ohne Bedienung. */
  due?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  const { pathname } = useLocation();
  const line = rhythm(habit, today);
  return (
    <div className="flex items-center">
      {/* Unsichtbares Kontrollkästchen über der ganzen Tippfläche (44 px), wie beim Schalter. */}
      <span className="relative -ml-3 flex size-touch shrink-0 items-center justify-center">
        <input
          type="checkbox"
          aria-label={
            due ? tTasks.tasks.checkLabel(habit.name) : tTasks.tasks.checkLabelNotDue(habit.name)
          }
          checked={checked}
          disabled={!due}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
          className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-default"
        />
        <Mark state={checked ? 'done' : due ? 'open' : 'notDue'} size="lg" peer />
      </span>
      <Link
        to={`/heute/aufgaben/${habit.id}`}
        state={{ back: pathname }}
        aria-label={tTasks.tasks.editLabel(habit.name)}
        aria-describedby={`${id}-rhythmus`}
        className="-mr-2 ml-1 flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-input py-2 pr-2"
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn('block break-words', checked ? 'text-muted' : 'font-semibold text-fg')}
          >
            {habit.name}
          </span>
          <span id={`${id}-rhythmus`} className="block text-sm text-muted">
            {line}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
      </Link>
    </div>
  );
}
