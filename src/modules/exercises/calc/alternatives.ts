import type { Equipment, Exercise } from '../model/exercise';

export interface AlternativeOptions {
  /** Nur Übungen mit diesem Gerät (z. B. weil das geplante Gerät belegt ist). */
  equipment?: Equipment;
  limit?: number;
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

const shared = <T>(a: readonly T[], b: readonly T[]) => a.filter((x) => b.includes(x)).length;

/**
 * Alternativen zu einer Übung (AK-TRN-09, AK-PRG-03, TP-12): gleiche Hauptmuskelgruppe,
 * geordnet nach Übereinstimmung von Hauptmuskeln, Erfassungsart, Kategorie, Gerät und
 * Nebenmuskeln; bei Gleichstand alphabetisch. Die Übung selbst ist nie dabei.
 */
export function findAlternatives(
  exercises: readonly Exercise[],
  original: Pick<
    Exercise,
    'id' | 'primaryMuscles' | 'secondaryMuscles' | 'equipment' | 'trackingMode' | 'category'
  >,
  options: AlternativeOptions = {},
): Exercise[] {
  const limit = options.limit ?? 8;
  const scored = exercises.flatMap((candidate) => {
    if (candidate.id === original.id) return [];
    if (options.equipment && !candidate.equipment.includes(options.equipment)) return [];
    const primary = shared(candidate.primaryMuscles, original.primaryMuscles);
    if (primary === 0) return [];
    const score =
      primary * 10 +
      (candidate.trackingMode === original.trackingMode ? 3 : 0) +
      (candidate.category === original.category ? 2 : 0) +
      shared(candidate.equipment, original.equipment) +
      shared(candidate.secondaryMuscles, original.secondaryMuscles);
    return [{ candidate, score }];
  });
  scored.sort((a, b) => b.score - a.score || collator.compare(a.candidate.name, b.candidate.name));
  return scored.slice(0, limit).map((entry) => entry.candidate);
}
