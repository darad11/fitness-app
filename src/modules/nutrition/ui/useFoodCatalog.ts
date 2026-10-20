import { useMemo } from 'react';
import { buildFoodIndex, type FoodIndex } from '../calc/foodSearch';
import { useImportedCatalog } from '../data/catalogStore';
import { toFoodItem, toRecipeItem, useFoods, useRecipes } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';

export interface FoodCatalog {
  /** Eigene (nicht archivierte) und importierte Lebensmittel für die Suche. */
  index: FoodIndex<FoodItem>;
  /** Alle bekannten Lebensmittel nach ID, auch archivierte, z. B. für „Zuletzt verwendet“. */
  byId: ReadonlyMap<string, FoodItem>;
  own: readonly FoodItem[];
}

/**
 * Eigene Lebensmittel und Rezepte (reaktiv) und importierte Lebensmitteldaten (D-263); der
 * gebündelte BLS 4.0 entfällt (D-279). `undefined` beim Laden.
 */
export function useFoodCatalog(): FoodCatalog | undefined {
  const foods = useFoods();
  const recipes = useRecipes();
  const imported = useImportedCatalog();
  // Den großen Teil (Import) nur neu aufbauen, wenn er sich ändert, nicht bei jeder Änderung an
  // eigenen Lebensmitteln.
  const generic = useMemo(() => {
    if (imported === undefined) return undefined;
    const items = imported?.items ?? [];
    return { items, index: buildFoodIndex(items) };
  }, [imported]);
  return useMemo(() => {
    if (foods === undefined || recipes === undefined || generic === undefined) return undefined;
    // Rezepte zählen zu den eigenen Einträgen (D-267): Favoriten, Archiv, zuerst in der Suche.
    const own = [...recipes.map(toRecipeItem), ...foods.map(toFoodItem)];
    const ownIndex = buildFoodIndex(own.filter((f) => !f.archivedAt));
    return {
      index: { entries: [...ownIndex.entries, ...generic.index.entries] },
      byId: new Map([...generic.items, ...own].map((f) => [f.id, f])),
      own,
    };
  }, [foods, recipes, generic]);
}
