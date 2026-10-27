import { ExternalLink } from 'lucide-react';
import { tExerciseMedia } from '@/shared/i18n/de-exercise-media';
import { Skeleton } from '@/shared/ui';
import { useGuide } from '../data/media';
import type { Exercise } from '../model/exercise';
import type { ExerciseGuide } from '../model/media';

/**
 * Ausführung einer Übung (Leitlinien Kapitel 4, D-398): kurze Beschreibung, Ausgangsposition,
 * Schritte, Technik, häufige Fehler, Sicherheit und die Quellen. Je Basisübung eigens geschrieben,
 * nur aus belegten Quellen; fehlt ein Beleg, steht das ehrlich da. `compact` für die Übungsinfo
 * im Training: Beschreibung, Ausgangsposition und Schritte, ohne Quellen.
 */
export function ExerciseGuideView({
  exercise,
  compact = false,
}: {
  exercise: Pick<Exercise, 'source' | 'key'>;
  compact?: boolean;
}) {
  const state = useGuide(exercise.source === 'core' ? exercise.key : undefined);
  if (exercise.source === 'custom') {
    return <p className="text-muted">{tExerciseMedia.guideCustom}</p>;
  }
  if (state.status === 'loading') {
    return (
      <div aria-busy="true" className="grid gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (state.status === 'failed') return <p className="text-muted">{tExerciseMedia.guideFailed}</p>;
  if (!state.guide) return <p className="text-muted">{tExerciseMedia.guideMissing}</p>;
  return <Guide guide={state.guide} checked={state.checked} compact={compact} />;
}

function Points({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <section>
      <h3 className="eyebrow mb-1.5 text-muted">{title}</h3>
      <List className={ordered ? 'grid list-decimal gap-1.5 pl-5' : 'grid list-disc gap-1.5 pl-5'}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </section>
  );
}

function formatChecked(date: string): string {
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}.${month}.${year}` : date;
}

function Guide({
  guide,
  checked,
  compact,
}: {
  guide: ExerciseGuide;
  checked: string;
  compact: boolean;
}) {
  return (
    <div className="grid gap-4" data-guide="ja">
      <p>{guide.summary}</p>
      <Points title={tExerciseMedia.setupTitle} items={guide.setup} />
      <Points title={tExerciseMedia.stepsTitle} items={guide.steps} ordered />
      {compact ? null : (
        <>
          <Points title={tExerciseMedia.cuesTitle} items={guide.cues} />
          {guide.mistakes ? (
            <Points title={tExerciseMedia.mistakesTitle} items={guide.mistakes} />
          ) : null}
          {guide.safety ? <Points title={tExerciseMedia.safetyTitle} items={guide.safety} /> : null}
          <p className="text-sm text-muted">{tExerciseMedia.disclaimer}</p>
          <section>
            <h3 className="eyebrow mb-1.5 text-muted">{tExerciseMedia.sourcesTitle}</h3>
            <ul className="grid gap-1 text-sm">
              {guide.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted underline underline-offset-2 hover:text-fg"
                  >
                    {source.title}
                    <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
            {guide.sourceNote ? (
              <p className="mt-1 text-caption text-muted">{guide.sourceNote}</p>
            ) : null}
            <p className="mt-1 text-caption text-muted">
              {tExerciseMedia.sourcesChecked(formatChecked(checked))}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
