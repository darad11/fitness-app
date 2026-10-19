import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { blsFoodId, loadBls } from '../data/bls';
import { listDayEntries, listMealTemplates } from '../data/nutritionRepository';
import {
  applyTemplate,
  createTemplateFromEntries,
  deleteTemplate,
  InvalidTemplateError,
  renameTemplate,
  restoreTemplate,
} from './mealTemplateService';
import { logFood, logQuick } from './nutritionService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

async function breakfast() {
  const bls = await loadBls();
  const oats = bls.find((f) => f.id === blsFoodId('C133000'));
  const banana = bls.find((f) => f.id === blsFoodId('F503100'));
  if (!oats || !banana) throw new Error('BLS');
  const at = (minute: number) => ({ now: () => new Date(`2026-10-19T07:0${String(minute)}:00Z`) });
  await logFood(
    rt,
    {
      food: oats,
      slot: 'breakfast',
      dayKey: '2026-10-19',
      quantity: { kind: 'amount', amount: 60 },
    },
    at(1),
  );
  await logFood(
    rt,
    {
      food: banana,
      slot: 'breakfast',
      dayKey: '2026-10-19',
      quantity: { kind: 'amount', amount: 120 },
    },
    at(2),
  );
  await logQuick(rt, { name: 'Kaffee', slot: 'breakfast', dayKey: '2026-10-19', kcal: 30 }, at(3));
  return listDayEntries(rt.db, '2026-10-19');
}

describe('Mahlzeit-Vorlagen (NU-11, D-268)', () => {
  it('speichert eine Mahlzeit als Vorlage und trägt sie an einem anderen Tag ein', async () => {
    const entries = await breakfast();
    const template = await createTemplateFromEntries(rt, '  Mein   Frühstück ', entries);
    expect(template.name).toBe('Mein Frühstück');
    expect(template.items.map((i) => [i.kind, i.nameSnapshot, i.amount, i.nutrients.kcal])).toEqual(
      [
        ['food', 'Hafer Flocken', 60, 208.8],
        ['food', 'Banane roh', 120, 94.8],
        ['quick', 'Kaffee', undefined, 30],
      ],
    );

    const created = await applyTemplate(
      rt,
      template,
      { slot: 'snacks', dayKey: '2026-10-20' },
      { now: () => new Date('2026-10-20T15:00:00Z') },
    );
    expect(created).toHaveLength(3);
    const day = await listDayEntries(rt.db, '2026-10-20');
    expect(day.map((e) => [e.slot, e.nameSnapshot, e.nutrients.kcal, e.isEstimated])).toEqual([
      ['snacks', 'Hafer Flocken', 208.8, false],
      ['snacks', 'Banane roh', 94.8, false],
      ['snacks', 'Kaffee', 30, true],
    ]);
    // Eigene IDs je Eintrag; die Vorlage bleibt unverändert.
    expect(new Set(day.map((e) => e.id)).size).toBe(3);
    expect((await listMealTemplates(rt.db))[0]?.items).toHaveLength(3);
  });

  it('benennt um, löscht und stellt wieder her; prüft Name und Einträge', async () => {
    const entries = await breakfast();
    const template = await createTemplateFromEntries(rt, 'Frühstück', entries);
    expect((await renameTemplate(rt, template.id, 'Wochentag')).name).toBe('Wochentag');
    await deleteTemplate(rt, template.id);
    expect(await listMealTemplates(rt.db)).toEqual([]);
    await restoreTemplate(rt, template.id);
    expect(await listMealTemplates(rt.db)).toHaveLength(1);

    const reason = (p: Promise<unknown>) =>
      p.then(
        () => 'ok',
        (e: unknown) => (e instanceof InvalidTemplateError ? e.reason : 'other'),
      );
    expect(await reason(createTemplateFromEntries(rt, ' ', entries))).toBe('name');
    expect(await reason(createTemplateFromEntries(rt, 'x'.repeat(61), entries))).toBe('name');
    expect(await reason(createTemplateFromEntries(rt, 'Leer', []))).toBe('items');
  });
});
