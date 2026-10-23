import { t } from '@/shared/i18n/de';
import { tagClasses } from '@/shared/ui';
import type { Muscle } from '../model/exercise';

/**
 * Hauptmuskeln als Etiketten (FORM, D-315), z. B. unter dem Namen einer Übung. Screenreader hören
 * eine Zeile „Hauptmuskeln: Brust, Trizeps“; die Etiketten selbst sind nur Bild.
 */
export function MuscleTags({
  muscles,
  className,
}: {
  muscles: readonly Muscle[];
  className?: string;
}) {
  if (muscles.length === 0) return null;
  const names = muscles.map((muscle) => t.exercises.muscles[muscle]);
  return (
    <p className={className}>
      <span className="sr-only">{`${t.session.info.primary}: ${names.join(', ')}`}</span>
      <span aria-hidden="true" className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <span key={name} className={tagClasses()}>
            {name}
          </span>
        ))}
      </span>
    </p>
  );
}
