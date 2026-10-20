import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { sumEntries } from '../calc/nutrients';
import { BREAD, OATS } from '../testing/foods';
import { listDayEntries, listFoods, listTargets, toFoodItem } from '../data/nutritionRepository';
import {
  changeEntry,
  createFood,
  deleteEntry,
  InvalidEntryError,
  InvalidFoodError,
  InvalidTargetError,
  logFood,
  logQuick,
  restoreEntry,
  setFoodArchived,
  setFoodFavorite,
  setNutritionTarget,
  updateFood,
} from './nutritionService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const DAY = '2026-10-19';
const reason = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof InvalidFoodError || error instanceof InvalidEntryError
      ? error.reason
      : error instanceof InvalidTargetError
        ? 'target'
        : 'other';
  }
  return 'none';
};

describe('Eigene Lebensmittel (NU-10)', () => {
  const skyr = {
    name: '  Skyr  natur ',
    brand: 'Spar',
    basis: 'g' as const,
    per100: { kcal: 63, protein: 11, carbs: 4, fat: 0.2, sugar: 4 },
    servings: [{ name: 'Becher', amount: 450 }],
  };

  it('legt an, ändert, markiert als Favorit und archiviert', async () => {
    const food = await createFood(rt, skyr);
    expect(food).toMatchObject({
      name: 'Skyr natur',
      brand: 'Spar',
      source: 'custom',
      quality: 'user',
      nameNorm: 'skyr natur',
      servings: [{ name: 'Becher', amount: 450 }],
    });
    const updated = await updateFood(rt, food.id, { ...skyr, brand: '', servings: [] });
    expect(updated).not.toHaveProperty('brand');
    expect(updated.servings).toEqual([]);
    expect((await setFoodFavorite(rt, food.id, true)).favorite).toBe(true);
    const archived = await setFoodArchived(rt, food.id, true, {
      now: () => new Date('2026-10-19T10:00:00.000Z'),
    });
    expect(archived.archivedAt).toBe('2026-10-19T10:00:00.000Z');
    expect(await listFoods(rt.db)).toHaveLength(1);
  });

  it('verlangt Name und Pflichtwerte in gültigen Bereichen', async () => {
    expect(await reason(createFood(rt, { ...skyr, name: ' ' }))).toBe('name');
    expect(await reason(createFood(rt, { ...skyr, per100: { kcal: 63 } }))).toBe('core');
    expect(
      await reason(createFood(rt, { ...skyr, per100: { ...skyr.per100, protein: 101 } })),
    ).toBe('range');
    expect(
      await reason(createFood(rt, { ...skyr, servings: [{ name: 'Becher', amount: 0 }] })),
    ).toBe('serving');
    expect(await rt.db.foods.count()).toBe(0);
  });
});

describe('Protokoll (NU-05, NU-09, NU-15, NU-20)', () => {
  it('protokolliert nach Gramm oder Portion mit eingefrorenen Werten', async () => {
    const food = toFoodItem(
      await createFood(rt, {
        name: 'Skyr',
        basis: 'g',
        per100: { kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
        servings: [{ name: 'Becher', amount: 450 }],
      }),
    );
    const byGram = await logFood(rt, {
      food,
      slot: 'breakfast',
      dayKey: DAY,
      quantity: { kind: 'amount', amount: 150 },
    });
    expect(byGram).toMatchObject({
      kind: 'food',
      foodId: food.id,
      amount: 150,
      nutrients: { kcal: 94.5, protein: 16.5, carbs: 6, fat: 0.3 },
      isEstimated: false,
    });
    const byServing = await logFood(rt, {
      food,
      slot: 'snacks',
      dayKey: DAY,
      quantity: { kind: 'serving', servingId: food.servings[0]!.id, count: 0.5 },
    });
    expect(byServing).toMatchObject({
      amount: 225,
      servingSnapshot: { name: 'Becher', count: 0.5 },
      nutrients: { kcal: 141.8 },
    });
    // Änderung am Lebensmittel wirkt nicht zurück.
    await updateFood(rt, food.id, {
      name: 'Skyr',
      basis: 'g',
      per100: { kcal: 100, protein: 11, carbs: 4, fat: 0.2 },
    });
    const entries = await listDayEntries(rt.db, DAY);
    expect(entries.map((e) => e.nutrients.kcal)).toEqual([94.5, 141.8]);
    expect(sumEntries(entries).sums.kcal).toBe(236.3);
  });

  it('nimmt Schnelleinträge als Schätzung und lehnt ungültige Mengen ab', async () => {
    const quick = await logQuick(rt, { slot: 'lunch', dayKey: DAY, kcal: 650.4, protein: 30 });
    expect(quick).toMatchObject({
      kind: 'quick',
      nameSnapshot: 'Schnelleintrag',
      nutrients: { kcal: 650, protein: 30 },
      isEstimated: true,
    });
    expect(await reason(logQuick(rt, { slot: 'lunch', dayKey: DAY, kcal: -1 }))).toBe('kcal');
    const bls = BREAD;
    expect(
      await reason(
        logFood(rt, {
          food: bls,
          slot: 'lunch',
          dayKey: DAY,
          quantity: { kind: 'amount', amount: 0 },
        }),
      ),
    ).toBe('amount');
  });

  it('ändert Menge, Portionen und Mahlzeit anteilig und löscht mit Rückgängig', async () => {
    const bls = OATS;
    const entry = await logFood(rt, {
      food: bls,
      slot: 'breakfast',
      dayKey: DAY,
      quantity: { kind: 'amount', amount: 50 },
    });
    expect(entry.nutrients.kcal).toBe(174);
    const changed = await changeEntry(rt, entry.id, { amount: 80, slot: 'snacks' });
    expect(changed).toMatchObject({ amount: 80, slot: 'snacks', nutrients: { kcal: 278.4 } });
    await deleteEntry(rt, entry.id);
    expect(await listDayEntries(rt.db, DAY)).toHaveLength(0);
    await restoreEntry(rt, entry.id);
    expect(await listDayEntries(rt.db, DAY)).toHaveLength(1);
  });
});

describe('Ziele (NU-01, NU-17)', () => {
  it('setzt Ziele datiert, ändert bei gleichen Werten nichts und prüft Grenzen', async () => {
    const at = { now: () => new Date('2026-10-19T08:00:00.000Z') };
    const first = await setNutritionTarget(
      rt,
      { kcal: 2400, proteinG: 150, carbsG: 250, fatG: 80 },
      { method: 'manual' },
      at,
    );
    expect(first).toMatchObject({ effectiveFrom: DAY, kcal: 2400, method: 'manual' });
    const same = await setNutritionTarget(
      rt,
      { kcal: 2400, proteinG: 150, carbsG: 250, fatG: 80 },
      { method: 'manual' },
      at,
    );
    expect(same.id).toBe(first.id);
    const inputs = {
      sex: 'male' as const,
      birthYear: 1990,
      heightCm: 180,
      weightKg: 80,
      activity: 'moderate' as const,
      direction: 'maintain' as const,
    };
    const computed = await setNutritionTarget(
      rt,
      { kcal: 2710, proteinG: 144, carbsG: 331, fatG: 90 },
      { method: 'computed', inputs },
      at,
    );
    expect(computed.inputsSnapshot).toEqual(inputs);
    const all = await listTargets(rt.db);
    expect(all).toHaveLength(2);
    expect(all.find((t) => t.id === first.id)?.endedAt).toBe('2026-10-19T08:00:00.000Z');
    expect(
      await reason(
        setNutritionTarget(
          rt,
          { kcal: 500, proteinG: 0, carbsG: 0, fatG: 0 },
          { method: 'manual' },
        ),
      ),
    ).toBe('target');
  });
});
