/**
 * Textnormalisierung für die Suche (data-model.md Abschnitt 1):
 * Kleinschreibung, ß als ss, Unicode-NFD ohne diakritische Zeichen, Satz- und Bindestriche
 * sowie mehrfache Leerzeichen entfernt. Umlaute stehen zusätzlich als ae, oe, ue im Suchschlüssel,
 * damit „Uebung" und „Ubung" beide „Übung" finden.
 */

const COMBINING_MARKS = /\p{M}+/gu;
const NON_ALPHANUMERIC = /[^\p{L}\p{N}]+/gu;
const VARIANT_SEPARATOR = '|';

export function normalizeText(input: string): string {
  return input
    .normalize('NFC')
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(NON_ALPHANUMERIC, ' ')
    .trim();
}

function transliterateUmlauts(input: string): string {
  return input
    .normalize('NFC')
    .toLocaleLowerCase('de')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');
}

export function searchVariants(input: string): string[] {
  const base = normalizeText(input);
  const transliterated = normalizeText(transliterateUmlauts(input));
  return base === transliterated ? [base] : [base, transliterated];
}

/** Gespeicherter Suchschlüssel, z. B. im Feld `nameNorm` eigener Übungen. */
export function searchKey(input: string): string {
  return searchVariants(input).join(VARIANT_SEPARATOR);
}

/** Jedes Wort der Suche muss in einer Variante des Schlüssels vorkommen (Leerzeichen ignoriert). */
export function matchesSearch(query: string, key: string): boolean {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const variants = key.split(VARIANT_SEPARATOR).map((variant) => variant.replace(/ /g, ''));
  return tokens.every((token) => variants.some((variant) => variant.includes(token)));
}
