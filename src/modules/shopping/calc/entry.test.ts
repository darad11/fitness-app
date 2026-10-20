import { describe, expect, it } from 'vitest';
import type { ShoppingItem } from '../model/shoppingItem';
import { canMerge, findDuplicate, guessCategory, parseEntry, recentItems } from './entry';

const item = (over: Partial<ShoppingItem>): ShoppingItem => ({
  id: crypto.randomUUID(),
  type: 'shopping_item',
  schemaVersion: 1,
  createdAt: '2026-10-20T10:00:00.000Z',
  hlc: 'x',
  deletedAt: null,
  deviceId: 'a1b2c3d4',
  name: 'Reis',
  position: 0,
  ...over,
});

describe('Schnelleingabe (D-287)', () => {
  it.each([
    ['500 g Hähnchenbrust', { name: 'Hähnchenbrust', quantity: 500, unit: 'g' }],
    ['500g Hähnchenbrust', { name: 'Hähnchenbrust', quantity: 500, unit: 'g' }],
    ['6 Bananen', { name: 'Bananen', quantity: 6, unit: 'Stück' }],
    ['Reis 1 kg', { name: 'Reis', quantity: 1, unit: 'kg' }],
    ['Reis 1kg', { name: 'Reis', quantity: 1, unit: 'kg' }],
    ['2x Milch', { name: 'Milch', quantity: 2, unit: 'Stück' }],
    ['0,5 l Milch', { name: 'Milch', quantity: 0.5, unit: 'l' }],
    ['1 Flasche Olivenöl', { name: 'Olivenöl', quantity: 1, unit: 'Flasche' }],
    ['Magnesium 1 Packung', { name: 'Magnesium', quantity: 1, unit: 'Packung' }],
    ['  Äpfel  ', { name: 'Äpfel' }],
    ['7up', { name: '7up' }],
    ['100% Orangensaft', { name: '100% Orangensaft' }],
    ['2 3 Äpfel', { name: '2 3 Äpfel' }],
    ['0 Bananen', { name: '0 Bananen' }],
  ])('„%s“', (input, expected) => {
    expect(parseEntry(input)).toEqual(expected);
  });
});

describe('Kategorien aus dem Namen', () => {
  it.each([
    ['Bananen', 'produce'],
    ['Weintrauben', 'produce'],
    ['Hähnchenbrust', 'meat'],
    ['Hafermilch', 'dairy'],
    ['Eier', 'dairy'],
    ['Vollkornreis', 'grains'],
    ['Reis', 'grains'],
    ['Eistee', 'drinks'],
    ['TK Erbsen', 'frozen'],
    ['Magnesium', 'supplements'],
    ['Klopapier', 'household'],
  ])('%s → %s', (name, category) => {
    expect(guessCategory(name)).toBe(category);
  });

  it('ohne klares Wort keine Kategorie', () => {
    expect(guessCategory('Geschenk für Oma')).toBeUndefined();
  });
});

describe('Doppelte und „Zuletzt gekauft“', () => {
  it('findet offene Doppelte unabhängig von Groß- und Kleinschreibung', () => {
    const items = [
      item({ name: 'Reis', quantity: 1, unit: 'kg' }),
      item({ name: 'Milch', doneAt: '2026-10-20T11:00:00.000Z' }),
    ];
    expect(findDuplicate(items, ' reis ')?.name).toBe('Reis');
    expect(findDuplicate(items, 'Milch')).toBeUndefined();
    expect(canMerge(items[0]!, { name: 'Reis', quantity: 500, unit: 'g' })).toBe(false);
    expect(canMerge(items[0]!, { name: 'Reis', quantity: 2, unit: 'kg' })).toBe(true);
    expect(canMerge(items[0]!, { name: 'Reis' })).toBe(false);
  });

  it('zuletzt gekauft: nur entfernte, je Name einmal, nicht wenn noch auf der Liste', () => {
    const cleared = (name: string, at: string, extra: Partial<ShoppingItem> = {}) =>
      item({ name, doneAt: at, clearedAt: at, ...extra });
    const items = [
      cleared('Milch', '2026-10-18T10:00:00.000Z'),
      cleared('milch', '2026-10-19T10:00:00.000Z', { quantity: 2, unit: 'l' }),
      cleared('Reis', '2026-10-20T10:00:00.000Z'),
      cleared('Brot', '2026-10-17T10:00:00.000Z'),
      item({ name: 'Brot' }), // offen
      cleared('Skyr', '2026-10-16T10:00:00.000Z'),
      item({ name: 'Skyr', doneAt: '2026-10-20T11:00:00.000Z' }), // gekauft, noch auf der Liste
    ];
    expect(recentItems(items)).toEqual([
      { name: 'Reis', count: 1 },
      { name: 'milch', count: 2, quantity: 2, unit: 'l' },
    ]);
  });
});
