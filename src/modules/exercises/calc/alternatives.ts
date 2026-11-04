import type { Equipment, Exercise } from '../model/exercise';

export interface AlternativeOptions {
  /** Nur Übungen mit diesem Gerät (z. B. weil das geplante Gerät belegt ist). */
  equipment?: Equipment;
  limit?: number;
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

const shared = <T>(a: readonly T[], b: readonly T[]) => a.filter((x) => b.includes(x)).length;

/**
 * Alternativen zu einer Übung (AK-TRN-09, AK-PRG-03, TP-12): zuerst das Ziel und die
 * ausdrücklichen Alternativen der Bibliothek (D-507), danach gleiche Hauptmuskelgruppe,
 * geordnet nach Übereinstimmung von Hauptmuskeln, Erfassungsart, Kategorie, Gerät und
 * Nebenmuskeln; bei Gleichstand alphabetisch. Die Übung selbst ist nie dabei.
 */
export function findAlternatives(
  exercises: readonly Exercise[],
  original: Pick<
    Exercise,
    | 'id'
    | 'primaryMuscles'
    | 'secondaryMuscles'
    | 'equipment'
    | 'trackingMode'
    | 'category'
    | 'goal'
    | 'alternatives'
  >,
  options: AlternativeOptions = {},
): Exercise[] {
  const limit = options.limit ?? 8;
  const fits = (candidate: Exercise) =>
    candidate.id !== original.id &&
    (!options.equipment || candidate.equipment.includes(options.equipment));
  const explicit = [original.goal, ...(original.alternatives ?? [])].flatMap((key) => {
    const found = key === undefined ? undefined : exercises.find((e) => e.key === key);
    return found && fits(found) ? [found] : [];
  });
  const chosen = new Set(explicit.map((exercise) => exercise.id));
  const scored = exercises.flatMap((candidate) => {
    if (!fits(candidate) || chosen.has(candidate.id)) return [];
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
  return [...explicit, ...scored.map((entry) => entry.candidate)].slice(0, limit);
}
