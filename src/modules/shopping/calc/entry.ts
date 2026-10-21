import type { ShoppingCategory, ShoppingItem } from '../model/shoppingItem';

/**
 * Schnelleingabe der Einkaufsliste (D-287), lokal und nachvollziehbar, ohne KI:
 * „500 g Hähnchenbrust“, „6 Bananen“, „Reis 1 kg“, „2x Milch“, „0,5 l Milch“. Was nicht eindeutig
 * passt, bleibt unverändert als Name stehen.
 */
export interface ParsedEntry {
  name: string;
  quantity?: number;
  unit?: string;
}

const UNIT_WORDS: Record<string, string> = {
  g: 'g',
  gr: 'g',
  gramm: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  liter: 'l',
  stk: 'Stück',
  'stk.': 'Stück',
  stück: 'Stück',
  x: 'Stück',
  packung: 'Packung',
  packungen: 'Packung',
  pkg: 'Packung',
  pck: 'Packung',
  flasche: 'Flasche',
  flaschen: 'Flasche',
  dose: 'Dose',
  dosen: 'Dose',
};
const UNIT_PATTERN = Object.keys(UNIT_WORDS)
  .sort((a, b) => b.length - a.length)
  .map((word) => word.replace('.', '\\.'))
  .join('|');
const NUMBER = '(\\d{1,5}(?:[.,]\\d{1,3})?)';
// Menge vorne: „500 g Reis“, „500g Reis“, „2x Milch“, „6 Bananen“.
const LEADING = new RegExp(`^${NUMBER}\\s*(${UNIT_PATTERN})?\\s+(.+)$`, 'iu');
const LEADING_X = new RegExp(`^${NUMBER}\\s*x\\s*(.+)$`, 'iu');
// Menge hinten: „Reis 1 kg“, „Reis 1kg“, „Bananen 6“.
const TRAILING = new RegExp(`^(.+?)\\s+${NUMBER}\\s*(${UNIT_PATTERN})?$`, 'iu');

function toNumber(text: string): number {
  return Number(text.replace(',', '.'));
}

function cleanName(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function build(name: string, amount: string, unitWord: string | undefined): ParsedEntry | null {
  const quantity = toNumber(amount);
  const cleaned = cleanName(name);
  if (!Number.isFinite(quantity) || quantity <= 0 || cleaned.length === 0) return null;
  if (/^\d/.test(cleaned)) return null; // „2 3 Äpfel“: lieber nichts raten
  const unit = unitWord ? UNIT_WORDS[unitWord.toLowerCase()] : 'Stück';
  return { name: cleaned, quantity, ...(unit ? { unit } : {}) };
}

export function parseEntry(input: string): ParsedEntry {
  const text = cleanName(input);
  const x = LEADING_X.exec(text);
  if (x?.[1] && x[2]) {
    const parsed = build(x[2], x[1], 'x');
    if (parsed) return parsed;
  }
  const leading = LEADING.exec(text);
  if (leading?.[1] && leading[3]) {
    const parsed = build(leading[3], leading[1], leading[2]);
    if (parsed) return parsed;
  }
  const trailing = TRAILING.exec(text);
  if (trailing?.[1] && trailing[2]) {
    const parsed = build(trailing[1], trailing[2], trailing[3]);
    if (parsed) return parsed;
  }
  return { name: text };
}

/** Schlüssel für Doppelte: klein, ohne Akzente außer Umlauten, ohne Mehrfach-Leerzeichen. */
export function nameKey(name: string): string {
  return cleanName(name).toLocaleLowerCase('de');
}

/**
 * Kategorie aus dem Namen, nur bei klaren Wörtern (D-287); sonst keine. Reihenfolge zählt:
 * „Weintrauben“ ist Obst, nicht Getränk; „Reis“ ist kein „Eis“, „Eistee“ ein Getränk.
 */
const CATEGORY_WORDS: [ShoppingCategory, string[]][] = [
  [
    'produce',
    [
      'apfel',
      'äpfel',
      'banane',
      'birne',
      'beere',
      'erdbeer',
      'heidelbeer',
      'himbeer',
      'traube',
      'weintraube',
      'orange',
      'zitrone',
      'limette',
      'kiwi',
      'mango',
      'ananas',
      'avocado',
      'obst',
      'gemüse',
      'brokkoli',
      'karfiol',
      'blumenkohl',
      'salat',
      'tomate',
      'paradeiser',
      'gurke',
      'karotte',
      'möhre',
      'zwiebel',
      'knoblauch',
      'kartoffel',
      'erdäpfel',
      'paprika',
      'spinat',
      'zucchini',
      'pilz',
      'champignon',
      'kraut',
      'kohl',
      'lauch',
      'sellerie',
      'kürbis',
      'ingwer',
    ],
  ],
  [
    'meat',
    [
      'hähnchen',
      'huhn',
      'hühner',
      'pute',
      'truthahn',
      'rind',
      'schwein',
      'fleisch',
      'faschiert',
      'hack',
      'steak',
      'lachs',
      'thunfisch',
      'fisch',
      'garnele',
      'shrimp',
      'wurst',
      'schinken',
      'speck',
      'salami',
      'kabeljau',
      'forelle',
    ],
  ],
  [
    'dairy',
    [
      'milch',
      'joghurt',
      'jogurt',
      'skyr',
      'topfen',
      'quark',
      'käse',
      'mozzarella',
      'feta',
      'butter',
      'sahne',
      'obers',
      'schlagobers',
      'rahm',
      'eier',
      'tofu',
    ],
  ],
  [
    'grains',
    [
      'reis',
      'nudel',
      'pasta',
      'spaghetti',
      'brot',
      'semmel',
      'gebäck',
      'toast',
      'hafer',
      'haferflocken',
      'flocken',
      'mehl',
      'müsli',
      'couscous',
      'quinoa',
      'bulgur',
      'tortilla',
      'wrap',
      'cornflakes',
      'linsen',
      'bohnen',
      'kichererbsen',
    ],
  ],
  [
    'drinks',
    [
      'wasser',
      'mineral',
      'saft',
      'cola',
      'limo',
      'limonade',
      'kaffee',
      'tee',
      'bier',
      'wein',
      'sprudel',
      'eistee',
    ],
  ],
  ['frozen', ['tiefkühl', 'tk', 'gefroren', 'eis', 'eiswürfel', 'pizza']],
  [
    'supplements',
    [
      'magnesium',
      'protein',
      'whey',
      'kreatin',
      'creatin',
      'vitamin',
      'omega',
      'zink',
      'kollagen',
      'elektrolyt',
      'supplement',
    ],
  ],
  [
    'household',
    [
      'klopapier',
      'toilettenpapier',
      'küchenrolle',
      'spülmittel',
      'waschmittel',
      'müllsack',
      'müllsäcke',
      'zahnpasta',
      'zahnbürste',
      'shampoo',
      'duschgel',
      'seife',
      'schwamm',
      'tabs',
      'reiniger',
      'taschentücher',
      'alufolie',
      'frischhaltefolie',
      'backpapier',
    ],
  ],
];

function matches(word: string, keyword: string): boolean {
  if (word === keyword || word.startsWith(keyword)) return true;
  // Zusammensetzungen hinten („Vollkornreis“, „Hafermilch“) erst ab vier Buchstaben.
  return keyword.length >= 4 && word.endsWith(keyword);
}

export function guessCategory(name: string): ShoppingCategory | undefined {
  const words = nameKey(name)
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length > 0);
  for (const [category, keywords] of CATEGORY_WORDS) {
    if (words.some((word) => keywords.some((keyword) => matches(word, keyword)))) return category;
  }
  return undefined;
}

export function isOpen(item: ShoppingItem): boolean {
  return item.doneAt === undefined && item.clearedAt === undefined;
}

/** Offener Artikel mit demselben Namen, falls vorhanden. */
export function findDuplicate(
  items: readonly ShoppingItem[],
  name: string,
): ShoppingItem | undefined {
  const key = nameKey(name);
  return items.find((item) => isOpen(item) && nameKey(item.name) === key);
}

/** Mengen lassen sich addieren, wenn beide eine Menge mit derselben Einheit haben. */
export function canMerge(existing: ShoppingItem, entry: ParsedEntry): boolean {
  return (
    existing.quantity !== undefined &&
    entry.quantity !== undefined &&
    (existing.unit ?? '') === (entry.unit ?? '')
  );
}

export interface RecentItem {
  name: string;
  quantity?: number;
  unit?: string;
  category?: ShoppingCategory;
  count: number;
}

/**
 * „Zuletzt gekauft“: entfernte Artikel („Gekaufte entfernen“), je Name einmal, nicht wenn der Name
 * noch auf der Liste steht (offen oder gekauft); zuletzt gekaufte zuerst, höchstens `limit`.
 */
export function recentItems(items: readonly ShoppingItem[], limit = 8): RecentItem[] {
  const onList = new Set(
    items.filter((item) => item.clearedAt === undefined).map((item) => nameKey(item.name)),
  );
  const byName = new Map<string, { item: ShoppingItem; at: string; count: number }>();
  for (const item of items) {
    if (item.clearedAt === undefined) continue;
    const key = nameKey(item.name);
    if (onList.has(key)) continue;
    const at = item.clearedAt;
    const known = byName.get(key);
    if (!known) byName.set(key, { item, at, count: 1 });
    else {
      known.count += 1;
      if (at > known.at) {
        known.item = item;
        known.at = at;
      }
    }
  }
  return [...byName.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map(({ item, count }) => ({
      name: item.name,
      count,
      ...(item.quantity !== undefined ? { quantity: item.quantity } : {}),
      ...(item.unit !== undefined ? { unit: item.unit } : {}),
      ...(item.category !== undefined ? { category: item.category } : {}),
    }));
}

const SUGGESTION_MAX = 4;

/**
 * Vorschläge zum Getippten: Namen, die mit dem Getippten beginnen, zuerst, dann solche, in denen
 * es vorkommt; ohne Doppelte, ohne offene Artikel und ohne den genau getippten Namen.
 */
export function matchSuggestions(
  names: readonly string[],
  openNames: readonly string[],
  text: string,
): string[] {
  const query = parseEntry(text).name.toLocaleLowerCase('de');
  if (query.length === 0) return [];
  const skip = new Set(openNames.map((name) => name.toLocaleLowerCase('de')));
  skip.add(query);
  const unique = new Map<string, string>();
  for (const name of names) {
    const key = name.toLocaleLowerCase('de');
    if (!skip.has(key) && !unique.has(key) && key.includes(query)) unique.set(key, name);
  }
  return [...unique.entries()]
    .sort(([a], [b]) => Number(!a.startsWith(query)) - Number(!b.startsWith(query)))
    .slice(0, SUGGESTION_MAX)
    .map(([, name]) => name);
}
