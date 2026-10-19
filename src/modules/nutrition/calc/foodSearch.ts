import { normalizeText, searchKey } from '@/shared/lib/normalize';

/** Was die Lebensmittelsuche von einem Eintrag braucht. */
export interface SearchableFood {
  id: string;
  name: string;
  aliases: readonly string[];
  brand?: string;
}

interface Entry<T> {
  item: T;
  name: string;
  /** Varianten ohne Leerzeichen: Name, dann Marke und Alias-Namen. */
  nameVariants: string[];
  otherVariants: string[];
}

export interface FoodIndex<T> {
  entries: readonly Entry<T>[];
}

const variants = (text: string) =>
  searchKey(text)
    .split('|')
    .map((v) => v.replace(/ /g, ''));

export function buildFoodIndex<T extends SearchableFood>(items: readonly T[]): FoodIndex<T> {
  return {
    entries: items.map((item) => ({
      item,
      name: item.name,
      nameVariants: variants(item.name),
      otherVariants: [...(item.brand ? [item.brand] : []), ...item.aliases].flatMap(variants),
    })),
  };
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

/**
 * Sucht in eigenen Lebensmitteln und im BLS (NU-08): jedes Wort muss im Namen, in der Marke
 * oder in einem Alias vorkommen. Rang: Name beginnt mit dem ersten Wort, Treffer im Namen, sonst
 * Alias; innerhalb eines Rangs kürzere Namen zuerst (Grundlebensmittel vor Gerichten).
 */
export function searchFoods<T extends SearchableFood>(
  index: FoodIndex<T>,
  query: string,
  limit = 50,
): T[] {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  const ranked: { item: T; rank: number; name: string }[] = [];
  for (const entry of index.entries) {
    const inName = tokens.every((t) => entry.nameVariants.some((v) => v.includes(t)));
    const inAny =
      inName ||
      tokens.every((t) =>
        [...entry.nameVariants, ...entry.otherVariants].some((v) => v.includes(t)),
      );
    if (!inAny) continue;
    const first = tokens[0] ?? '';
    const starts = entry.nameVariants.some((v) => v.startsWith(first));
    ranked.push({ item: entry.item, rank: inName ? (starts ? 0 : 1) : 2, name: entry.name });
  }
  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank || a.name.length - b.name.length || collator.compare(a.name, b.name),
    )
    .slice(0, limit)
    .map((r) => r.item);
}
