import { normalizeText, searchKey, searchVariants } from '@/shared/lib/normalize';
import type { Equipment, Muscle } from '../model/exercise';

/** Was die Suche von einer Übung braucht (AK-EXL-02). */
export interface SearchableExercise {
  name: string;
  aliases: readonly string[];
  primaryMuscles: readonly Muscle[];
  equipment: readonly Equipment[];
}

export interface ExerciseFilter {
  query?: string;
  muscle?: Muscle;
  equipment?: Equipment;
}

interface IndexEntry<T> {
  exercise: T;
  /** Suchschlüssel des Namens, danach der Alias-Namen. */
  keys: string[];
  /** Namensvarianten ohne Leerzeichen, für „beginnt mit". */
  nameStarts: string[];
}

export interface ExerciseSearchIndex<T> {
  entries: readonly IndexEntry<T>[];
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

/** Einmal je Liste aufbauen; die Suche selbst normalisiert dann nur noch die Eingabe. */
export function buildSearchIndex<T extends SearchableExercise>(
  exercises: readonly T[],
): ExerciseSearchIndex<T> {
  return {
    entries: exercises.map((exercise) => ({
      exercise,
      keys: [exercise.name, ...exercise.aliases].map(searchKey),
      nameStarts: searchVariants(exercise.name).map((variant) => variant.replace(/ /g, '')),
    })),
  };
}

/** Prüft, ob alle Wörter der Suche in einem einzelnen Namen oder Alias vorkommen. */
function tokensMatch(tokens: readonly string[], key: string): boolean {
  const variants = key.split('|').map((variant) => variant.replace(/ /g, ''));
  return tokens.every((token) => variants.some((variant) => variant.includes(token)));
}

/**
 * Sucht und filtert. Rang: Name beginnt mit der Suche, dann Treffer im Namen, dann im Alias;
 * innerhalb eines Rangs alphabetisch. Ohne Suchtext alphabetisch.
 */
export function searchExercises<T extends SearchableExercise>(
  index: ExerciseSearchIndex<T>,
  filter: ExerciseFilter,
): T[] {
  const normalized = normalizeText(filter.query ?? '');
  const tokens = normalized.split(' ').filter(Boolean);
  const compact = tokens.join('');
  const ranked: { exercise: T; rank: number }[] = [];
  for (const entry of index.entries) {
    const { exercise } = entry;
    if (filter.muscle && !exercise.primaryMuscles.includes(filter.muscle)) continue;
    if (filter.equipment && !exercise.equipment.includes(filter.equipment)) continue;
    if (tokens.length === 0) {
      ranked.push({ exercise, rank: 0 });
      continue;
    }
    const [nameKey = '', ...aliasKeys] = entry.keys;
    if (tokensMatch(tokens, nameKey)) {
      const starts = entry.nameStarts.some((variant) => variant.startsWith(compact));
      ranked.push({ exercise, rank: starts ? 0 : 1 });
    } else if (aliasKeys.some((key) => tokensMatch(tokens, key))) {
      ranked.push({ exercise, rank: 2 });
    }
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || collator.compare(a.exercise.name, b.exercise.name))
    .map((item) => item.exercise);
}

/** Alphabetischer Vergleich nach deutscher Sortierung, z. B. für Listen je Gruppe. */
export function compareExerciseNames(a: { name: string }, b: { name: string }): number {
  return collator.compare(a.name, b.name);
}
