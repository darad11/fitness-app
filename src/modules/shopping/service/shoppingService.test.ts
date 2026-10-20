import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { parseEntry } from '../calc/entry';
import { listShoppingItems } from '../data/shoppingRepository';
import {
  addItem,
  addParsed,
  clearDone,
  deleteItem,
  InvalidItemError,
  mergeQuantity,
  restoreItem,
  setItemDone,
  undoClear,
  updateItem,
} from './shoppingService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

describe('Einkaufsliste speichern (D-287)', () => {
  it('legt an, rät die Kategorie, ergänzt Menge, löscht und stellt wieder her', async () => {
    const reis = await addParsed(rt, parseEntry('Reis 1 kg'));
    const apfel = await addItem(rt, { name: '  Äpfel ' });
    expect(reis).toMatchObject({ name: 'Reis', quantity: 1, unit: 'kg', category: 'grains' });
    expect(apfel).toMatchObject({ name: 'Äpfel', category: 'produce', position: 1 });
    expect(apfel).not.toHaveProperty('quantity');
    await expect(addItem(rt, { name: '   ' })).rejects.toBeInstanceOf(InvalidItemError);
    await expect(addItem(rt, { name: 'X', quantity: -1 })).rejects.toBeInstanceOf(InvalidItemError);

    const edited = await updateItem(rt, apfel.id, {
      name: 'Äpfel',
      quantity: 6,
      unit: 'Stück',
      category: null,
      note: 'grüne',
    });
    expect(edited).toMatchObject({ quantity: 6, unit: 'Stück', note: 'grüne' });
    expect(edited).not.toHaveProperty('category');
    const cleared = await updateItem(rt, apfel.id, { name: 'Äpfel', quantity: null, unit: '' });
    expect(cleared).not.toHaveProperty('quantity');
    expect(cleared).not.toHaveProperty('unit');

    expect((await mergeQuantity(rt, reis.id, 0.5)).quantity).toBe(1.5);

    await deleteItem(rt, reis.id);
    expect((await listShoppingItems(rt.db)).map((i) => i.name)).toEqual(['Äpfel']);
    await restoreItem(rt, reis.id);
    expect(await listShoppingItems(rt.db)).toHaveLength(2);
  });

  it('abhaken, wieder öffnen, nur Gekaufte entfernen mit Rückgängig', async () => {
    const a = await addItem(rt, { name: 'Milch' });
    const b = await addItem(rt, { name: 'Brot' });
    const done = await setItemDone(rt, a.id, true, { now: () => new Date('2026-10-20T10:00:00Z') });
    expect(done.doneAt).toBe('2026-10-20T10:00:00.000Z');
    expect(await setItemDone(rt, a.id, false)).not.toHaveProperty('doneAt');
    await setItemDone(rt, a.id, true);

    const ids = await clearDone(rt);
    expect(ids).toEqual([a.id]);
    const after = await listShoppingItems(rt.db);
    expect(after.find((i) => i.id === b.id)).not.toHaveProperty('clearedAt');
    expect(after.find((i) => i.id === a.id)?.clearedAt).toBeDefined();
    await undoClear(rt, ids);
    expect((await listShoppingItems(rt.db)).find((i) => i.id === a.id)).not.toHaveProperty(
      'clearedAt',
    );
  });

  it('bucht nichts in die Ernährung', async () => {
    await addItem(rt, { name: 'Hähnchenbrust', quantity: 500, unit: 'g' });
    expect(await rt.db.foodLog.count()).toBe(0);
  });
});
