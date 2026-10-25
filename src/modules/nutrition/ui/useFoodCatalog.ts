import { useEffect, useMemo, useState } from 'react';
import { useSettings } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { buildFoodIndex, type FoodIndex } from '../calc/foodSearch';
import { applyPieceWeights } from '../calc/pieces';
import { loadBasicFoods } from '../data/basicFoods';
import { useImportedCatalog } from '../data/catalogStore';
import { toFoodItem, toRecipeItem, useFoods, useRecipes } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';

export interface FoodCatalog {
  /** Eigene (nicht archivierte) Lebensmittel, Grundauswahl und importierte Daten für die Suche. */
  index: FoodIndex<FoodItem>;
  /** Alle bekannten Lebensmittel nach ID, auch archivierte, z. B. für „Zuletzt verwendet“. */
  byId: ReadonlyMap<string, FoodItem>;
  own: readonly FoodItem[];
  /** Die Grundauswahl ließ sich nicht laden; gesucht wird dann ohne sie. */
  basicFailed: boolean;
}

/** Suchindizes der importierten Lebensmittel je Import (die Liste kommt aus einem Zwischenspeicher). */
const importedIndexes = new WeakMap<readonly FoodItem[], FoodIndex<FoodItem>>();

/**
 * Suchindex der importierten Lebensmittel, einmal je Import für alle Seiten (C-04): Vorher baute
 * jede Seite mit Suche ihn beim Öffnen neu auf, für tausende Einträge.
 */
export function importedIndex(items: readonly FoodItem[]): FoodIndex<FoodItem> {
  let index = importedIndexes.get(items);
  if (!index) {
    index = buildFoodIndex(items);
    importedIndexes.set(items, index);
  }
  return index;
}

/** Grundauswahl (D-362), einmal je Sitzung geladen; `'failed'`, wenn das Laden scheitert. */
function useBasicFoods(): readonly FoodItem[] | 'failed' | undefined {
  const { db } = useDb();
  const [basic, setBasic] = useState<readonly FoodItem[] | 'failed'>();
  useEffect(() => {
    let active = true;
    loadBasicFoods().then(
      (list) => {
        if (active) setBasic(list);
      },
      (error: unknown) => {
        if (!active) return;
        setBasic('failed');
        void logError(db, { area: 'nutrition', error, route: window.location.pathname });
      },
    );
    return () => {
      active = false;
    };
  }, [db]);
  return basic;
}

/**
 * Eigene Lebensmittel und Rezepte (reaktiv), die Grundauswahl aus dem BLS 4.0 mit den gemerkten
 * Stückgewichten (D-362) und importierte Lebensmitteldaten (D-263). Reihenfolge im Index: eigene,
 * Grundauswahl, Import; bei gleichem Rang gewinnt in der Suche der frühere. `undefined` beim Laden.
 */
export function useFoodCatalog(): FoodCatalog | undefined {
  const foods = useFoods();
  const recipes = useRecipes();
  const imported = useImportedCatalog();
  const basicFoods = useBasicFoods();
  const settings = useSettings();
  const settingsLoaded = settings !== undefined;
  const pieceWeights = settings?.pieceWeights;
  // Grundauswahl und Import nur neu aufbauen, wenn sie sich ändern (oder ein Stückgewicht), nicht
  // bei jeder Änderung an eigenen Lebensmitteln.
  const basic = useMemo(() => {
    if (basicFoods === undefined || !settingsLoaded) return undefined;
    const items = basicFoods === 'failed' ? [] : applyPieceWeights(basicFoods, pieceWeights);
    return { items, index: buildFoodIndex(items), failed: basicFoods === 'failed' };
  }, [basicFoods, settingsLoaded, pieceWeights]);
  const generic = useMemo(() => {
    if (imported === undefined) return undefined;
    const items = imported?.items ?? [];
    return { items, index: importedIndex(items) };
  }, [imported]);
  return useMemo(() => {
    if (
      foods === undefined ||
      recipes === undefined ||
      basic === undefined ||
      generic === undefined
    ) {
      return undefined;
    }
    // Rezepte zählen zu den eigenen Einträgen (D-267): Favoriten, Archiv, zuerst in der Suche.
    const own = [...recipes.map(toRecipeItem), ...foods.map(toFoodItem)];
    const ownIndex = buildFoodIndex(own.filter((f) => !f.archivedAt));
    return {
      index: { entries: [...ownIndex.entries, ...basic.index.entries, ...generic.index.entries] },
      byId: new Map([...generic.items, ...basic.items, ...own].map((f) => [f.id, f])),
      own,
      basicFailed: basic.failed,
    };
  }, [foods, recipes, basic, generic]);
}
