import { normalizeText } from '@/shared/lib/normalize';
import { CORE_NUTRIENTS, type Nutrients } from '../model/nutrition';
import { FALSE_FRIENDS, IRREGULAR_PLURALS, SYNONYM_GROUPS } from './foodTerms';

/** Was die Lebensmittelsuche von einem Eintrag braucht. */
export interface SearchableFood {
  id: string;
  name: string;
  aliases: readonly string[];
  brand?: string;
  /** Für das Erkennen von Dubletten; ohne Werte gilt ein Eintrag nie als Dublette. */
  per100?: Nutrients;
}

interface Entry<T> {
  item: T;
  name: string;
  nameWords: readonly string[];
  /**
   * Anfang des Namens: erstes Wort und die ersten zwei zusammengeschrieben. Dort steht meist das
   * Lebensmittel selbst („Tomate roh“, „Rind Hackfleisch“), weiter hinten Zutaten eines Gerichts
   * („Rührei mit Tomaten“).
   */
  firstWords: readonly string[];
  firstSet: ReadonlySet<string>;
  firstForms: ReadonlySet<string>;
  /** Wörter des Namens und je zwei benachbarte zusammengeschrieben („Hafer Flocken“). */
  nameSet: ReadonlySet<string>;
  /** Einzahlformen der Namenswörter („tomaten“ → „tomate“). */
  nameForms: ReadonlySet<string>;
  otherWords: readonly string[];
  otherSet: ReadonlySet<string>;
  otherForms: ReadonlySet<string>;
  branded: boolean;
  duplicateKey: string;
}

export interface FoodIndex<T> {
  entries: readonly Entry<T>[];
}

/**
 * Text für die Suche (D-356): klein, ß als ss, ohne Akzente und Umlautpunkte, Satzzeichen als
 * Leerzeichen, dazu „ae/oe/ue“ als „a/o/u“. So treffen sich „Äpfel“, „Aepfel“ und „Apfel“ ebenso
 * wie „Müsli“ und „Muesli“, für Eingabe und Lebensmittel gleich.
 */
export function foldText(text: string): string {
  return normalizeText(text).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

function words(text: string): string[] {
  return foldText(text).split(' ').filter(Boolean);
}

/**
 * Wörter mit Umlaut („ae“ wird „ä“): Zwei Buchstaben wie „öl“ sind ohne Umlaut mehrdeutig
 * („ol“ steckt in Oliven und Karfiol), mit Umlaut nicht.
 */
function umlautWords(text: string): string[] {
  return text
    .normalize('NFC')
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Mögliche Einzahl eines Wortes: unregelmäßige Formen aus der Liste, sonst ohne „-n“, „-e“ oder
 * „-s“ am Ende (Tomaten, Bananen, Nüsse, Pilze, Kiwis). „-er“ fällt nur über die Liste weg (Eier),
 * damit „Butter“ nicht zu „Butt“ wird. Unsinnige Formen („banan“) schaden nicht: Sie werden nur
 * mit echten Wörtern verglichen, nie untereinander.
 */
export function singularForms(word: string): string[] {
  const forms: string[] = [];
  const irregular = IRREGULAR_PLURALS[word];
  if (irregular) forms.push(irregular);
  if (word.length >= 4 && /[nes]$/.test(word)) forms.push(word.slice(0, -1));
  return forms;
}

/** Synonyme je Begriff (gefaltet, Mehrzahl über `singularForms`), in beide Richtungen. */
const SYNONYMS: ReadonlyMap<string, readonly (readonly string[])[]> = (() => {
  const map = new Map<string, (readonly string[])[]>();
  for (const group of SYNONYM_GROUPS) {
    const members = group.map((term) => words(term));
    for (const member of members) {
      const key = member.join(' ');
      const others = members.filter((other) => other.join(' ') !== key);
      map.set(key, [...(map.get(key) ?? []), ...others]);
    }
  }
  return map;
})();

/** Einwortige Synonyme für zusammengesetzte Wörter („Erdäpfelpüree“ → „Kartoffelpüree“). */
const COMPOUND_HEADS = [...SYNONYMS.keys()].filter((key) => !key.includes(' ') && key.length >= 4);

const FALSE_FRIEND_WORDS = FALSE_FRIENDS.map(foldText);

/** Falsche Freunde, die ein Wort enthalten („apfel“ → erdapfel, granatapfel, apfelsine). */
function masksFor(word: string): readonly string[] {
  return FALSE_FRIEND_WORDS.filter((term) => term.length > word.length && term.includes(word));
}

function joinedPairs(list: readonly string[]): string[] {
  return list.slice(1).map((word, i) => `${list[i] ?? ''}${word}`);
}

function beginning(list: readonly string[]): string[] {
  return list.length > 1 ? [list[0] ?? '', `${list[0] ?? ''}${list[1] ?? ''}`] : [...list];
}

function duplicateKeyOf(item: SearchableFood): string {
  if (!item.per100) return `id:${item.id}`;
  const per100 = item.per100;
  const values = CORE_NUTRIENTS.map((nutrient) => {
    const value = per100[nutrient];
    if (value === undefined) return '';
    return nutrient === 'kcal'
      ? String(Math.round(value))
      : (Math.round(value * 10) / 10).toFixed(1);
  });
  return [foldText(item.name), foldText(item.brand ?? ''), ...values].join('|');
}

export function buildFoodIndex<T extends SearchableFood>(items: readonly T[]): FoodIndex<T> {
  return {
    entries: items.map((item) => {
      const nameWords = words(item.name);
      const otherWords = [...(item.brand ? [item.brand] : []), ...item.aliases].flatMap(words);
      const firstWords = beginning(nameWords);
      return {
        item,
        name: item.name,
        nameWords,
        firstWords,
        firstSet: new Set(firstWords),
        firstForms: new Set(firstWords.flatMap(singularForms)),
        nameSet: new Set([...nameWords, ...joinedPairs(nameWords)]),
        nameForms: new Set(nameWords.flatMap(singularForms)),
        otherWords,
        otherSet: new Set([...otherWords, ...joinedPairs(otherWords)]),
        otherForms: new Set(otherWords.flatMap(singularForms)),
        branded: item.brand !== undefined && item.brand.trim() !== '',
        duplicateKey: duplicateKeyOf(item),
      };
    }),
  };
}

/**
 * Eine Alternative für einen Teil der Eingabe: ein oder mehrere Wörter, die alle passen müssen.
 * Synonyme und Einzahlformen zählen wie das eingegebene Wort.
 */
interface Alternative {
  words: readonly string[];
  /** Nur bei zwei Buchstaben mit Umlaut („öl“): Vergleich mit Umlaut statt gefaltet. */
  umlaut?: string;
}

function alternativesFor(token: string, umlaut: string | undefined): Alternative[] {
  const short = umlaut?.length === 2 && /[äöü]/.test(umlaut);
  const alternatives: Alternative[] = [{ words: [token], ...(short ? { umlaut } : {}) }];
  for (const key of [token, ...singularForms(token)]) {
    for (const other of SYNONYMS.get(key) ?? []) alternatives.push({ words: other });
  }
  // Zusammengesetzte Wörter: Beginnt die Eingabe mit einem Synonym, auch mit dem anderen Begriff
  // suchen, mit und ohne Fugenlaut („erdapfelpuree“ → „kartoffelpuree“, „paradeisersalat“ →
  // „tomatensalat“).
  for (const head of COMPOUND_HEADS) {
    if (!token.startsWith(head) || token.length - head.length < 3) continue;
    const rest = token.slice(head.length).replace(/^(en|er|n|s|e)(?=.{3})/, '');
    for (const other of SYNONYMS.get(head) ?? []) {
      if (other.length !== 1) continue;
      for (const joint of ['', 'n', 'en', 's', 'er', 'e']) {
        alternatives.push({ words: [`${other[0] ?? ''}${joint}${rest}`] });
      }
    }
  }
  return alternatives;
}

/** Teile der Eingabe; zwei Wörter, die zusammen ein Synonym sind („saure Sahne“), bleiben zusammen. */
function parseQuery(query: string): Alternative[][] {
  const tokens = words(query);
  // Gleiche Trennung wie `words`, deshalb gehören die Umlautformen Wort für Wort dazu.
  const umlauts = umlautWords(query);
  const umlautOf = (i: number) => (umlauts.length === tokens.length ? umlauts[i] : undefined);
  const parts: Alternative[][] = [];
  for (let i = 0; i < tokens.length; i++) {
    const first = tokens[i] ?? '';
    const second = tokens[i + 1];
    if (second !== undefined) {
      const pairSynonyms = [first, ...singularForms(first)].flatMap((a) =>
        [second, ...singularForms(second)].flatMap((b) => SYNONYMS.get(`${a} ${b}`) ?? []),
      );
      if (pairSynonyms.length > 0) {
        parts.push([
          { words: [first, second] },
          ...pairSynonyms.map((other) => ({ words: other })),
        ]);
        i++;
        continue;
      }
    }
    parts.push(alternativesFor(first, umlautOf(i)));
  }
  return parts;
}

/** Beste Stufe von `wordLevel`. */
const TOP_LEVEL = 8;

/**
 * Stufe, wie gut ein Wort zu einem Eintrag passt (0 = gar nicht). Einzahl, Mehrzahl und Synonyme
 * zählen wie das eingegebene Wort.
 * 8 ganzes Wort am Anfang des Namens („Milch 3,5 %“ für „Milch“) · 7 Grundwort am Anfang
 * („Buttermilch“ für „Milch“, „Olivenöl“ für „Öl“, „Hühnerei“, „Erdbeere“; D-357) · 6 ganzes Wort
 * weiter hinten im Namen („Rührei mit Tomaten“) · 5 ganzes Wort in Marke oder Suchbegriff ·
 * 4 Wortanfang im Namen oder Grundwort weiter hinten · 3 dasselbe in Marke oder Suchbegriff ·
 * 2 Wortteil mitten im Wort (ab fünf Buchstaben).
 */
function wordLevel<T extends SearchableFood>(
  word: string,
  entry: Entry<T>,
  umlaut: string | undefined,
  masks: readonly string[],
): number {
  if (umlaut !== undefined) return umlautLevel(umlaut, entry);
  const forms = singularForms(word);
  const exact = (set: ReadonlySet<string>) => set.has(word) || forms.some((f) => set.has(f));
  // Wortende: auch über die Einzahl („Nüsse“ → Walnuss, „Beeren“ → Erdbeere), aber nur bei
  // längeren Wörtern, damit aus „Reis“ kein „rei“ in „Brei“ wird.
  const ends = [word, ...(word.length >= 5 ? forms.filter((form) => form.length >= 4) : [])];
  const unmasked = (w: string) => !masks.some((mask) => w.includes(mask));
  const head = (w: string) =>
    ends.some((end) => end.length >= 3 && w.length - end.length >= 2 && w.endsWith(end)) &&
    unmasked(w);
  const partial = (w: string) => (w.startsWith(word) && unmasked(w)) || head(w);
  if (exact(entry.firstSet) || entry.firstForms.has(word)) return TOP_LEVEL;
  if (entry.firstWords.some(head)) return 7;
  if (exact(entry.nameSet) || entry.nameForms.has(word)) return 6;
  if (exact(entry.otherSet) || entry.otherForms.has(word)) return 5;
  if (entry.nameWords.some(partial)) return 4;
  if (entry.otherWords.some(partial)) return 3;
  // Wortteil mitten im Wort erst ab fünf Buchstaben: „eis“ steckt in Speisequark und Fleisch.
  if (word.length >= 5) {
    const inside = (w: string) => w.includes(word) && unmasked(w);
    if (entry.nameWords.some(inside) || entry.otherWords.some(inside)) return 2;
  }
  return 0;
}

interface UmlautWords {
  name: readonly string[];
  first: readonly string[];
  other: readonly string[];
}

/** Wörter mit Umlaut je Eintrag, erst bei der ersten kurzen Eingabe mit Umlaut berechnet. */
const umlautCache = new WeakMap<object, UmlautWords>();

function umlautWordsOf(item: SearchableFood): UmlautWords {
  let found = umlautCache.get(item);
  if (!found) {
    const name = umlautWords(item.name);
    found = {
      name,
      first: beginning(name),
      other: [...(item.brand ? [item.brand] : []), ...item.aliases].flatMap(umlautWords),
    };
    umlautCache.set(item, found);
  }
  return found;
}

/** Wie `wordLevel` für zwei Buchstaben mit Umlaut („öl“): ganzes Wort, Anfang oder Grundwort. */
function umlautLevel<T extends SearchableFood>(umlaut: string, entry: Entry<T>): number {
  const own = umlautWordsOf(entry.item);
  const head = (w: string) => w.length - umlaut.length >= 2 && w.endsWith(umlaut);
  const partial = (w: string) => w.startsWith(umlaut) || head(w);
  if (own.first.includes(umlaut)) return TOP_LEVEL;
  if (own.first.some(head)) return 7;
  if (own.name.includes(umlaut)) return 6;
  if (own.other.includes(umlaut)) return 5;
  if (own.name.some(partial)) return 4;
  if (own.other.some(partial)) return 3;
  return 0;
}

/**
 * Beste Stufe eines Teils über alle Alternativen; `literal`, wenn das eingegebene Wort selbst
 * (oder seine Einzahl) sie erreicht, nicht erst ein Synonym. Bei sonst gleichem Rang und gleich
 * langem Namen steht das wörtlich Gefundene vorn.
 */
function partLevel<T extends SearchableFood>(
  alternatives: readonly Alternative[],
  entry: Entry<T>,
  masks: (word: string) => readonly string[],
): { level: number; literal: boolean } {
  let best = 0;
  let literal = false;
  alternatives.forEach((alternative, i) => {
    if (best === TOP_LEVEL && !(i === 0 && !literal)) return;
    let level = Infinity;
    for (const word of alternative.words) {
      level = Math.min(level, wordLevel(word, entry, alternative.umlaut, masks(word)));
      if (level === 0) break;
    }
    if (level > best) {
      best = level;
      literal = i === 0;
    }
  });
  return { level: best, literal };
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

/**
 * Lebensmittelsuche für jede Datenquelle (NU-08, Phase Ernährung §1, D-356): Jeder Teil der
 * Eingabe muss passen, als ganzes Wort, über Einzahl/Mehrzahl, Umlautschreibweise oder Synonym,
 * als Grundwort, Wortanfang oder Wortteil (Stufen bei `wordLevel`). Rang: schlechtester Teil
 * zuerst, dann lose Lebensmittel vor Markenprodukten, dann die Summe aller Teile, dann kürzere
 * Namen, dann wörtlich Gefundenes vor Synonymen. Gleiche Einträge aus mehreren Quellen (Name, Marke und Pflichtwerte gleich)
 * erscheinen nur einmal, der erste im Index gewinnt (eigene vor importierten).
 */
export function searchFoods<T extends SearchableFood>(
  index: FoodIndex<T>,
  query: string,
  limit = 50,
): T[] {
  const parts = parseQuery(query);
  if (parts.length === 0) return [];
  const maskCache = new Map<string, readonly string[]>();
  const masks = (word: string) => {
    let found = maskCache.get(word);
    if (!found) {
      found = masksFor(word);
      maskCache.set(word, found);
    }
    return found;
  };
  const ranked: {
    entry: Entry<T>;
    min: number;
    sum: number;
    literal: number;
    order: number;
  }[] = [];
  index.entries.forEach((entry, order) => {
    let min = Infinity;
    let sum = 0;
    let literal = 0;
    for (const part of parts) {
      const fit = partLevel(part, entry, masks);
      if (fit.level === 0) return;
      min = Math.min(min, fit.level);
      sum += fit.level;
      if (fit.literal) literal++;
    }
    ranked.push({ entry, min, sum, literal, order });
  });
  ranked.sort(
    (a, b) =>
      b.min - a.min ||
      Number(a.entry.branded) - Number(b.entry.branded) ||
      b.sum - a.sum ||
      a.entry.name.length - b.entry.name.length ||
      b.literal - a.literal ||
      collator.compare(a.entry.name, b.entry.name) ||
      a.order - b.order,
  );
  const seen = new Set<string>();
  const result: T[] = [];
  for (const { entry } of ranked) {
    if (seen.has(entry.duplicateKey)) continue;
    seen.add(entry.duplicateKey);
    result.push(entry.item);
    if (result.length >= limit) break;
  }
  return result;
}
