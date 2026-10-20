import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { recipeTotals } from '../calc/recipe';
import { BANANA, OATS } from '../testing/foods';
import { listDayEntries, listRecipes, toRecipeItem } from '../data/nutritionRepository';
import type { FoodItem } from '../model/foodItem';
import { logFood, logQuick } from './nutritionService';
import {
  createRecipe,
  deleteRecipe,
  ingredientFrom,
  InvalidRecipeError,
  restoreRecipe,
  setRecipeArchived,
  updateRecipe,
  withAmount,
} from './recipeService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

// Feste Testlebensmittel mit den früheren BLS-Werten (D-279).
// eslint-disable-next-line @typescript-eslint/require-await
async function bls(code: 'C133000' | 'F503100'): Promise<FoodItem> {
  return code === 'C133000' ? OATS : BANANA;
}

const reason = async (promise: Promise<unknown> | (() => unknown)) => {
  try {
    await (typeof promise === 'function' ? promise() : promise);
  } catch (error) {
    return error instanceof InvalidRecipeError ? error.reason : 'other';
  }
  return 'ok';
};

describe('Rezepte (M7, D-267)', () => {
  it('rechnet Summe, Portion und je 100 g aus den eingefrorenen Zutaten', async () => {
    const oats = ingredientFrom(await bls('C133000'), { kind: 'amount', amount: 80 });
    const banana = ingredientFrom(await bls('F503100'), { kind: 'amount', amount: 120 });
    expect(oats).toMatchObject({
      nameSnapshot: 'Hafer Flocken',
      basisSnapshot: 'g',
      amount: 80,
      per100Snapshot: { kcal: 348, protein: 13.22 },
    });
    const totals = recipeTotals([oats, banana], 2);
    expect(totals.grams).toBe(200);
    expect(totals.total.kcal).toBe(373.2);
    expect(totals.perServing).toMatchObject({ kcal: 186.6, protein: 6.1, carbs: 30.9, fat: 2.9 });
    expect(totals.per100.kcal).toBe(186.6);
    expect(totals.missing).toEqual([]);

    // Fehlt einer Zutat ein Wert, fehlt er in der Summe.
    const quick = { ...banana, id: crypto.randomUUID(), per100Snapshot: { kcal: 50 } };
    const partial = recipeTotals([oats, quick], 1);
    expect(partial.total.kcal).toBe(338.4);
    expect(partial.total.protein).toBeUndefined();
    expect(partial.missing).toEqual([
      'protein',
      'carbs',
      'sugar',
      'fat',
      'saturatedFat',
      'fiber',
      'salt',
    ]);
  });

  it('speichert, ändert, archiviert, löscht und stellt wieder her', async () => {
    const oats = ingredientFrom(await bls('C133000'), { kind: 'amount', amount: 80 });
    const banana = ingredientFrom(await bls('F503100'), { kind: 'amount', amount: 120 });
    const recipe = await createRecipe(rt, {
      name: '  Overnight   Oats ',
      servings: 2,
      ingredients: [oats, banana],
      steps: 'Über Nacht ziehen lassen.',
    });
    expect(recipe).toMatchObject({
      name: 'Overnight Oats',
      nameNorm: 'overnight oats',
      servings: 2,
    });
    const changed = await updateRecipe(rt, recipe.id, {
      name: 'Overnight Oats',
      servings: 1,
      ingredients: [withAmount(oats, 60)],
      steps: '',
    });
    expect(changed.ingredients).toHaveLength(1);
    expect(changed.ingredients[0]?.amount).toBe(60);
    expect(changed.steps).toBeUndefined();
    await setRecipeArchived(rt, recipe.id, true, { now: () => new Date('2026-10-19T12:00:00Z') });
    expect((await listRecipes(rt.db))[0]?.archivedAt).toBe('2026-10-19T12:00:00.000Z');
    await deleteRecipe(rt, recipe.id);
    expect(await listRecipes(rt.db)).toEqual([]);
    await restoreRecipe(rt, recipe.id);
    expect(await listRecipes(rt.db)).toHaveLength(1);
  });

  it('prüft Name, Portionen, Zutaten, Mengen und Zubereitung', async () => {
    const oats = ingredientFrom(await bls('C133000'), { kind: 'amount', amount: 80 });
    const base = { name: 'Test', servings: 2, ingredients: [oats] };
    expect(await reason(createRecipe(rt, { ...base, name: ' ' }))).toBe('name');
    expect(await reason(createRecipe(rt, { ...base, servings: 0 }))).toBe('servings');
    expect(await reason(createRecipe(rt, { ...base, servings: 1.5 }))).toBe('servings');
    expect(await reason(createRecipe(rt, { ...base, ingredients: [] }))).toBe('ingredients');
    expect(await reason(createRecipe(rt, { ...base, steps: 'x'.repeat(5001) }))).toBe('steps');
    expect(await reason(() => withAmount(oats, 0))).toBe('amount');
    expect(
      await reason(async () =>
        ingredientFrom(await bls('C133000'), { kind: 'amount', amount: 6000 }),
      ),
    ).toBe('amount');
  });

  it('trägt ein Rezept portionsweise mit eingefrorenen Werten ein', async () => {
    const oats = ingredientFrom(await bls('C133000'), { kind: 'amount', amount: 80 });
    const banana = ingredientFrom(await bls('F503100'), { kind: 'amount', amount: 120 });
    const recipe = await createRecipe(rt, {
      name: 'Oats',
      servings: 2,
      ingredients: [oats, banana],
    });
    const item = toRecipeItem(recipe);
    expect(item).toMatchObject({ source: 'recipe', basis: 'g', per100: { kcal: 186.6 } });
    expect(item.servings).toEqual([expect.objectContaining({ name: 'Portion', amount: 100 })]);
    // Rezepte sind keine Zutaten anderer Rezepte.
    expect(await reason(() => ingredientFrom(item, { kind: 'amount', amount: 50 }))).toBe(
      'ingredients',
    );
    const entry = await logFood(rt, {
      food: item,
      slot: 'breakfast',
      dayKey: '2026-10-19',
      quantity: { kind: 'serving', servingId: item.servings[0]!.id, count: 1 },
    });
    expect(entry).toMatchObject({
      kind: 'recipe',
      foodId: recipe.id,
      nameSnapshot: 'Oats',
      amount: 100,
      servingSnapshot: { name: 'Portion', count: 1 },
      nutrients: { kcal: 186.6 },
      isEstimated: false,
    });
    // Rezept ändern wirkt nicht zurück.
    await updateRecipe(rt, recipe.id, { name: 'Oats', servings: 1, ingredients: [oats] });
    await logQuick(rt, { slot: 'snacks', dayKey: '2026-10-19', kcal: 100 });
    const [first] = await listDayEntries(rt.db, '2026-10-19');
    expect(first?.nutrients.kcal).toBe(186.6);
  });
});
