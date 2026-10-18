import { Info } from 'lucide-react';
import { useLoaderData } from 'react-router';
import { t } from '@/shared/i18n/de';
import { Badge, Card, PageHeader } from '@/shared/ui';
import { formatRest, formatTargetRange } from '../calc/format';
import { distinctDays, summarizeSets } from '../calc/sampleTemplates';
import type { PlannedExercise, SampleTemplate } from '../model/program';
import { describeTemplate } from './ProgramsPage';

export interface SampleTemplateData {
  template: SampleTemplate;
  /** IDs der Übungen, die je Seite ausgeführt werden. */
  unilateral: readonly string[];
}

/** Beispielvorlage (S-49): schreibgeschützt, mit Etikett und Hinweis (AK-PRG-06). */
export function SampleTemplatePage() {
  const { template, unilateral } = useLoaderData<SampleTemplateData>();
  const days = distinctDays(template);
  const perSide = new Set(unilateral);
  return (
    <>
      <PageHeader
        title={template.name}
        subtitle={describeTemplate(template)}
        back={{ to: '/training/programme', label: t.programs.title }}
      />
      <div className="mb-6 flex items-start gap-3 rounded-card border border-line bg-surface p-4">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" />
        <div>
          <Badge className="mb-2">{t.programs.sampleBadge}</Badge>
          <p>{t.programs.sampleHint}</p>
        </div>
      </div>
      <div className="grid gap-4">
        <Card title={t.programs.schedule}>
          <ul className="space-y-1">
            {template.weeks.map((week) => (
              <li key={week.id}>
                {t.programs.week(week.name, week.days.map((day) => day.name).join(', '))}
              </li>
            ))}
          </ul>
          {template.repeat ? (
            <p className="mt-2 text-sm text-muted">{t.programs.scheduleRepeat}</p>
          ) : null}
        </Card>
        {days.map((day) => (
          <Card key={day.id} title={day.name}>
            <p className="-mt-2 mb-3 text-sm text-muted">
              {t.programs.exerciseCount(day.exercises.length)}
            </p>
            <ol className="divide-y divide-line">
              {day.exercises.map((exercise) => (
                <li key={exercise.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium">{exercise.nameSnapshot}</p>
                  <p className="text-sm text-muted">
                    {describeSets(exercise, perSide.has(exercise.exerciseId))}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </>
  );
}

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
    exercise.restSec !== undefined ? t.programs.rest(formatRest(exercise.restSec)) : null;
  return [sets, target, rest].filter(Boolean).join(' · ');
}
