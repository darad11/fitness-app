import { t } from '@/shared/i18n/de';
import type { Day, PlannedExercise, SampleTemplate } from '../model/program';
import { estimateDay, roundMinutes } from './duration';
import { formatRest, formatTargetRange } from './format';
import { distinctDays, summarizeSets } from './sampleTemplates';

/**
 * Beschreibungen von Programmen, Tagen und Übungen als Text. Eigene Datei ohne Seitenimporte,
 * damit „Heute“ (ActiveProgramCard) die Seiten „Programme“ und „Vorlage“ nicht mitlädt (D-307).
 */

/** Z. B. „2 Aufwärmsätze, 3 Sätze je Seite · 6–8 Wdh. · Pause 2:30 min". */
export function describeSets(exercise: PlannedExercise, perSide: boolean): string {
  const summary = summarizeSets(exercise);
  const sets = [
    summary.warmup > 0 ? t.programs.warmupSets(summary.warmup) : null,
    t.programs.workingSets(summary.working) + (perSide ? ` ${t.programs.perSide}` : ''),
    summary.drop > 0 ? t.programs.dropSets(summary.drop) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const range = formatTargetRange(summary.target);
  const dropRange = summary.dropTarget ? formatTargetRange(summary.dropTarget) : null;
  const target = range
    ? (range.kind === 'reps' ? t.programs.reps(range.text) : range.text) +
      (dropRange
        ? `, Drop ${dropRange.kind === 'reps' ? t.programs.reps(dropRange.text) : dropRange.text}`
        : '')
    : null;
  const rest =
    exercise.restSec === undefined
      ? null
      : exercise.restSec === 0
        ? t.programs.noRest
        : t.programs.rest(formatRest(exercise.restSec));
  return [sets, target, rest].filter(Boolean).join(' · ');
}

/** Tagesvorschau: „5 Übungen · 17 Sätze · ca. 50 min" (Schritt D). */
export function describeDay(day: Pick<Day, 'exercises'>, restDefaultSec: number): string {
  const estimate = estimateDay(day, restDefaultSec);
  return [
    t.programs.exerciseCount(estimate.exercises),
    t.programs.setCount(estimate.sets),
    t.programs.estimate(roundMinutes(estimate.seconds)),
  ].join(' · ');
}

/** Z. B. „Anfänger · Studio · 3 Tage/Woche · 4 Wochen, 12 Trainingstage“. */
export function describeTemplate(template: SampleTemplate): string {
  const days = template.program
    ? t.programs.weekCount(template.weeks.length) +
      ', ' +
      t.programs.dayCount(template.weeks.reduce((sum, week) => sum + week.days.length, 0))
    : t.programs.dayCount(distinctDays(template).length);
  return [
    t.programs.levels[template.level],
    t.programs.locations[template.location],
    t.programs.daysPerWeek(template.daysPerWeek),
    days,
  ].join(' · ');
}
