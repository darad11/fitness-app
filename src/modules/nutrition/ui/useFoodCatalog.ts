import { useEffect, useMemo, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { buildFoodIndex, type FoodIndex } from '../calc/foodSearch';
import { loadBls } from '../data/bls';
import { useImportedCatalog } from '../data/catalogStore';
import { toFoodItem, toRecipeItem, useFoods, useRecipes } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';

export interface FoodCatalog {
  /** Eigene (nicht archivierte), BLS- und importierte Lebensmittel für die Suche. */
  index: FoodIndex<FoodItem>;
  /** Alle bekannten Lebensmittel nach ID, auch archivierte, z. B. für „Zuletzt verwendet“. */
  byId: ReadonlyMap<string, FoodItem>;
  own: readonly FoodItem[];
  blsFailed: boolean;
}

/**
 * Eigene Lebensmittel (reaktiv), der gebündelte BLS und importierte Daten (D-263);
 * `undefined` beim Laden.
 */
export function useFoodCatalog(): FoodCatalog | undefined {
  const { db } = useDb();
  const foods = useFoods();
  const recipes = useRecipes();
  const imported = useImportedCatalog();
  const [bls, setBls] = useState<readonly FoodItem[] | 'failed'>();
  useEffect(() => {
    let active = true;
    loadBls().then(
      (list) => {
        if (active) setBls(list);
      },
      (error: unknown) => {
        if (!active) return;
        setBls('failed');
        void logError(db, { area: 'nutrition', error, route: window.location.pathname });
      },
    );
    return () => {
      active = false;
    };
  }, [db]);
  // Den großen Teil (BLS und Import) nur neu aufbauen, wenn er sich ändert, nicht bei jeder
  // Änderung an eigenen Lebensmitteln.
  const generic = useMemo(() => {
    if (bls === undefined || imported === undefined) return undefined;
    const items = [...(bls === 'failed' ? [] : bls), ...(imported?.items ?? [])];
    return { items, index: buildFoodIndex(items) };
  }, [bls, imported]);
  return useMemo(() => {
    if (foods === undefined || recipes === undefined || generic === undefined) return undefined;
    // Rezepte zählen zu den eigenen Einträgen (D-267): Favoriten, Archiv, zuerst in der Suche.
    const own = [...recipes.map(toRecipeItem), ...foods.map(toFoodItem)];
    const ownIndex = buildFoodIndex(own.filter((f) => !f.archivedAt));
    return {
      index: { entries: [...ownIndex.entries, ...generic.index.entries] },
      byId: new Map([...generic.items, ...own].map((f) => [f.id, f])),
      own,
      blsFailed: bls === 'failed',
    };
  }, [foods, recipes, generic, bls]);
}
