import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { dayTotal } from '../calc/water';
import { listWaterEntries } from '../data/waterRepository';
import {
  addWater,
  deleteWater,
  InvalidWaterError,
  loadWaterGoal,
  restoreWater,
  saveQuickAmounts,
  setWaterGoal,
  updateWaterAmount,
  waterReached,
} from './waterService';

let rt: DbRuntime;
// Ortszeit ohne „Z“: Der Kalendertag hängt von der lokalen Zeitzone ab, nicht von UTC.
const at = (local: string) => ({ now: () => new Date(local) });
const MONDAY = '2026-10-19';
const TUESDAY = '2026-10-20';

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const total = async (day: string) => dayTotal(await listWaterEntries(rt.db), day);

describe('Wasser speichern (D-289)', () => {
  it('Schnellmenge und eigene Menge zählen sofort zum heutigen Tag', async () => {
    const first = await addWater(rt, 250, { clock: at(`${TUESDAY}T07:30:00`) });
    await addWater(rt, 330, { clock: at(`${TUESDAY}T09:15:00`) });
    expect(first).toMatchObject({ dayKey: TUESDAY, amountMl: 250, type: 'water_entry' });
    expect(new Date(first.loggedAt).getHours()).toBe(7);
    expect(await total(TUESDAY)).toBe(580);
  });

  it('lehnt ungültige Mengen ab, ohne etwas zu speichern', async () => {
    for (const amount of [0, -250, 12.5, 6000, Number.NaN]) {
      await expect(addWater(rt, amount)).rejects.toBeInstanceOf(InvalidWaterError);
    }
    expect(await rt.db.waterLog.count()).toBe(0);
  });

  it('bearbeiten, löschen und wiederherstellen rechnen die Summe neu', async () => {
    const clock = at(`${TUESDAY}T08:00:00`);
    const a = await addWater(rt, 250, { clock });
    const b = await addWater(rt, 500, { clock });
    await updateWaterAmount(rt, a.id, 300, clock);
    expect(await total(TUESDAY)).toBe(800);
    await expect(updateWaterAmount(rt, a.id, 0)).rejects.toBeInstanceOf(InvalidWaterError);
    await deleteWater(rt, b.id);
    expect(await total(TUESDAY)).toBe(300);
    await restoreWater(rt, b.id, clock);
    expect(await total(TUESDAY)).toBe(800);
    // Löschen ist eine Markierung, kein Entfernen (Sync, Rückgängig).
    expect(await rt.db.waterLog.count()).toBe(2);
  });

  it('neuer Kalendertag beginnt bei 0, der Vortag bleibt erhalten; Nachtragen geht', async () => {
    await addWater(rt, 1500, { clock: at(`${MONDAY}T23:50:00`) });
    await addWater(rt, 200, { clock: at(`${TUESDAY}T00:10:00`) });
    expect(await total(MONDAY)).toBe(1500);
    expect(await total(TUESDAY)).toBe(200);
    // Für Montag nachgetragen, am Dienstag eingetragen: zählt zu Montag.
    const late = await addWater(rt, 250, { day: MONDAY, clock: at(`${TUESDAY}T08:00:00`) });
    expect(late.dayKey).toBe(MONDAY);
    expect(await total(MONDAY)).toBe(1750);
    expect(await total(TUESDAY)).toBe(200);
  });

  it('nichts davon landet im Ernährungstagebuch', async () => {
    await addWater(rt, 500);
    expect(await rt.db.foodLog.count()).toBe(0);
    expect(await rt.db.foods.count()).toBe(0);
  });
});

describe('Tagesziel', () => {
  it('ohne eigenes Ziel gilt der Standard; eine Änderung gilt ab heute', async () => {
    expect(await loadWaterGoal(rt.db, MONDAY)).toBe(2000);
    await setWaterGoal(rt, 2500, at(`${MONDAY}T12:00:00`));
    await setWaterGoal(rt, 3000, at(`${TUESDAY}T12:00:00`));
    expect(await loadWaterGoal(rt.db, MONDAY)).toBe(2500);
    expect(await loadWaterGoal(rt.db, TUESDAY)).toBe(3000);
    expect(await loadWaterGoal(rt.db, '2026-10-18')).toBe(2000);
    await expect(setWaterGoal(rt, 100)).rejects.toThrow();
  });

  it('erreicht, sobald die Summe das Ziel des Tages erreicht', async () => {
    await setWaterGoal(rt, 1000, at(`${TUESDAY}T06:00:00`));
    await addWater(rt, 750, { clock: at(`${TUESDAY}T07:00:00`) });
    expect(await waterReached(rt.db, TUESDAY)).toBe(false);
    await addWater(rt, 250, { clock: at(`${TUESDAY}T08:00:00`) });
    expect(await waterReached(rt.db, TUESDAY)).toBe(true);
  });
});

describe('Schnellmengen', () => {
  it('speichert vier eigene Werte und stellt den Standard wieder her', async () => {
    await saveQuickAmounts(rt, [200, 330, 500, 1000]);
    const settings = await rt.db.singletons.toArray();
    expect(settings[0]).toMatchObject({ waterQuickMl: [200, 330, 500, 1000] });
    await expect(saveQuickAmounts(rt, [1, 2, 3])).rejects.toBeInstanceOf(InvalidWaterError);
    await saveQuickAmounts(rt, null);
    expect((await rt.db.singletons.toArray())[0]?.waterQuickMl).toBeUndefined();
  });
});
