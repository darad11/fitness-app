import { searchVariants } from '@/shared/lib/normalize';

/** Vergleichsschlüssel eines Namens: ohne Groß- und Kleinschreibung, Umlautschreibweise und Leerzeichen. */
export function nameKey(name: string): string {
  const variants = searchVariants(name);
  return (variants[variants.length - 1] ?? '').replace(/ /g, '');
}

/** Übung mit gleichem Namen (AK-EXL-03), ohne die Übung selbst; Alias-Namen zählen mit. */
export function findSameName<T extends { id: string; name: string; aliases: readonly string[] }>(
  exercises: readonly T[],
  name: string,
  exceptId?: string,
): T | undefined {
  const key = nameKey(name);
  if (!key) return undefined;
  return exercises.find(
    (exercise) =>
      exercise.id !== exceptId &&
      [exercise.name, ...exercise.aliases].some((candidate) => nameKey(candidate) === key),
  );
}
