import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeText, searchKey, searchVariants } from './normalize';

describe('normalizeText', () => {
  it('schreibt klein und entfernt diakritische Zeichen', () => {
    expect(normalizeText('Bankdrücken')).toBe('bankdrucken');
    expect(normalizeText('Crème')).toBe('creme');
  });

  it('ersetzt ß durch ss', () => {
    expect(normalizeText('Straße')).toBe('strasse');
  });

  it('entfernt Binde- und Satzzeichen sowie mehrfache Leerzeichen', () => {
    expect(normalizeText('  Kurzhantel-Rudern   (einarmig) ')).toBe('kurzhantel rudern einarmig');
    expect(normalizeText('T–Bar/Rudern')).toBe('t bar rudern');
  });

  it('behandelt zerlegte Umlaute wie zusammengesetzte', () => {
    expect(normalizeText('U\u0308bung')).toBe('ubung');
  });
});

describe('Suchschlüssel', () => {
  it('enthält Umlaute zusätzlich als ae, oe, ue', () => {
    expect(searchVariants('Übung')).toEqual(['ubung', 'uebung']);
    expect(searchVariants('Kniebeuge')).toEqual(['kniebeuge']);
    expect(searchKey('Schulterdrücken')).toBe('schulterdrucken|schulterdruecken');
  });

  it.each([
    ['uebung', 'Übung', true],
    ['ubung', 'Übung', true],
    ['Übung', 'Übung', true],
    ['t bar', 'T-Bar-Rudern', true],
    ['tbar', 'T-Bar-Rudern', true],
    ['langhantel bank', 'Bankdrücken mit Langhantel', true],
    ['strasse', 'Straße', true],
    ['straße', 'Straße', true],
    ['kreuz', 'Kniebeuge', false],
    ['', 'Kniebeuge', true],
  ])('„%s" findet „%s": %s', (query, name, expected) => {
    expect(matchesSearch(query, searchKey(name))).toBe(expected);
  });
});
