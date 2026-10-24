import { expect, it } from 'vitest';
import type { FoodItem } from '../model/foodItem';
import { importedIndex } from './useFoodCatalog';

const item = (id: string, name: string): FoodItem =>
  ({
    id,
    name,
    aliases: [],
    basis: 'g',
    per100: { kcal: 100, protein: 1, carbs: 1, fat: 1 },
    servings: [],
    source: 'import',
  }) as unknown as FoodItem;

it('baut den Suchindex der importierten Lebensmittel je Import nur einmal (C-04)', () => {
  const items = Object.freeze([item('a', 'Topfen'), item('b', 'Haferflocken')]);
  const first = importedIndex(items);
  expect(first.entries).toHaveLength(2);
  // Dieselbe Liste (ein Import): derselbe Index für jede Seite, die ihn braucht.
  expect(importedIndex(items)).toBe(first);
  // Ein neuer Import ist eine neue Liste und bekommt einen neuen Index.
  expect(importedIndex(Object.freeze([...items]))).not.toBe(first);
});
