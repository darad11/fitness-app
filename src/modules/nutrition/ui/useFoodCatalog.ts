import { useEffect, useMemo, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { buildFoodIndex, type FoodIndex } from '../calc/foodSearch';
import { loadBls } from '../data/bls';
import { toFoodItem, useFoods } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';

export interface FoodCatalog {
  /** Eigene (nicht archivierte) und BLS-Lebensmittel für die Suche. */
  index: FoodIndex<FoodItem>;
  /** Alle bekannten Lebensmittel nach ID, auch archivierte, z. B. für „Zuletzt verwendet“. */
  byId: ReadonlyMap<string, FoodItem>;
  own: readonly FoodItem[];
  blsFailed: boolean;
}

/** Eigene Lebensmittel (reaktiv) und der gebündelte BLS; `undefined` beim Laden. */
export function useFoodCatalog(): FoodCatalog | undefined {
  const { db } = useDb();
  const foods = useFoods();
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
  return useMemo(() => {
    if (foods === undefined || bls === undefined) return undefined;
    const own = foods.map(toFoodItem);
    const generic = bls === 'failed' ? [] : bls;
    const searchable = [...own.filter((f) => !f.archivedAt), ...generic];
    return {
      index: buildFoodIndex(searchable),
      byId: new Map([...generic, ...own].map((f) => [f.id, f])),
      own,
      blsFailed: bls === 'failed',
    };
  }, [foods, bls]);
}
