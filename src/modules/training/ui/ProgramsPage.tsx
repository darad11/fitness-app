import { ChevronRight } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { t } from '@/shared/i18n/de';
import { Badge, PageHeader } from '@/shared/ui';
import { distinctDays } from '../calc/sampleTemplates';
import { useTrainingState } from '../data/useTrainingState';
import type { SampleTemplate } from '../model/program';

/**
 * Programme und Vorlagen (S-04): gebündelte Programme A, B, C mit Aktivierung (D-249) und die
 * Beispielvorlagen; eigene Programme folgen in M2.
 */
export function ProgramsPage() {
  const templates = useLoaderData<readonly SampleTemplate[]>();
  const state = useTrainingState();
  const programs = templates.filter((template) => template.program);
  const samples = templates.filter((template) => !template.program);
  return (
    <>
      <PageHeader title={t.programs.title} back={{ to: '/training', label: t.training.title }} />
      <section aria-labelledby="programme" className="mb-8">
        <h2 id="programme" className="eyebrow text-muted">
          {t.programs.programsTitle}
        </h2>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.programsIntro}</p>
        <TemplateList
          templates={programs}
          badge={(template) =>
            template.id === state?.activeProgramId ? (
              <Badge tone="success">{t.programs.activeBadge}</Badge>
            ) : (
              <Badge tone="neutral">{t.programs.programBadge}</Badge>
            )
          }
          description={(template) => template.description}
        />
      </section>
      <section aria-labelledby="beispielvorlagen">
        <h2 id="beispielvorlagen" className="eyebrow text-muted">
          {t.programs.samplesTitle}
        </h2>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.samplesIntro}</p>
        <TemplateList
          templates={samples}
          badge={() => <Badge tone="accent">{t.programs.sampleBadge}</Badge>}
        />
      </section>
    </>
  );
}

function TemplateList({
  templates,
  badge,
  description,
}: {
  templates: readonly SampleTemplate[];
  badge: (template: SampleTemplate) => React.ReactNode;
  description?: (template: SampleTemplate) => string | undefined;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {templates.map((template) => (
        <li key={template.id}>
          <Link
            to={`/training/vorlagen/${template.key}`}
            className="flex min-h-14 items-center gap-3 rounded-card bg-surface p-5 shadow-card hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{template.name}</span>
                {badge(template)}
              </span>
              <span className="mt-1 block text-sm text-muted">{describeTemplate(template)}</span>
              {description?.(template) ? (
                <span className="mt-2 line-clamp-3 block text-sm">{description(template)}</span>
              ) : null}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

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
