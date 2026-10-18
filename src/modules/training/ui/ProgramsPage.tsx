import { ChevronRight } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { t } from '@/shared/i18n/de';
import { Badge, PageHeader } from '@/shared/ui';
import { distinctDays } from '../calc/sampleTemplates';
import type { SampleTemplate } from '../model/program';

/** Programme und Vorlagen (S-04). In M1 nur die Beispielvorlagen; eigene Programme folgen in M2. */
export function ProgramsPage() {
  const templates = useLoaderData<readonly SampleTemplate[]>();
  return (
    <>
      <PageHeader title={t.programs.title} back={{ to: '/training', label: t.training.title }} />
      <section aria-labelledby="beispielvorlagen">
        <h2 id="beispielvorlagen" className="eyebrow text-muted">
          {t.programs.samplesTitle}
        </h2>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.samplesIntro}</p>
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
                    <Badge tone="accent">{t.programs.sampleBadge}</Badge>
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {describeTemplate(template)}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function describeTemplate(template: SampleTemplate): string {
  return [
    t.programs.levels[template.level],
    t.programs.locations[template.location],
    t.programs.daysPerWeek(template.daysPerWeek),
    t.programs.dayCount(distinctDays(template).length),
  ].join(' · ');
}
