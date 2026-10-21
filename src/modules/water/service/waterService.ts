import { applyWaterAutoDone } from '@/modules/habits';
import { listGoals, setGoal } from '@/modules/goals';
import { saveSettings } from '@/modules/settings';
import {
  insertDoc,
  logError,
  restoreDoc,
  softDeleteDoc,
  updateDoc,
  type AppDb,
  type DbRuntime,
} from '@/shared/db';
import { dayKey, localTimeZone, type DayKey } from '@/shared/lib/time';
import { dayTotal, validQuickAmounts, WATER_DEFAULT_GOAL_ML, waterGoalOn } from '../calc/water';
import { listWaterEntries, waterEntryDef } from '../data/waterRepository';
import { WATER_ENTRY_MAX_ML, type WaterEntry } from '../model/waterEntry';

export interface Clock {
  now?: () => Date;
}
const nowOf = (clock: Clock) => (clock.now ?? (() => new Date()))();

export class InvalidWaterError extends Error {
  override name = 'InvalidWaterError';
}

function checkAmount(amountMl: number): number {
  if (!Number.isInteger(amountMl) || amountMl <= 0 || amountMl > WATER_ENTRY_MAX_ML) {
    throw new InvalidWaterError('Menge ungültig');
  }
  return amountMl;
}

/** Ziel, das an einem Tag galt, oder der Standardwert. */
export async function loadWaterGoal(db: AppDb, day: DayKey): Promise<number> {
  const tz = localTimeZone();
  const goal = waterGoalOn(await listGoals(db), day, (iso) => dayKey(new Date(iso), tz));
  return goal?.value ?? WATER_DEFAULT_GOAL_ML;
}

/** Ist das Wasserziel an diesem Tag erreicht? */
export async function waterReached(db: AppDb, day: DayKey): Promise<boolean> {
  const total = dayTotal(await listWaterEntries(db, day), day);
  return total >= (await loadWaterGoal(db, day));
}

/**
 * Nach jeder Änderung von heute: Aufgaben „mit Wasserziel abhaken“ abhaken, sobald das Ziel
 * erreicht ist (D-289). Fehler hier dürfen das Eintragen nicht verhindern.
 */
async function afterChange(rt: DbRuntime, day: DayKey, clock: Clock): Promise<void> {
  const today = dayKey(nowOf(clock), localTimeZone());
  if (day !== today) return;
  try {
    if (await waterReached(rt.db, day)) await applyWaterAutoDone(rt, day);
  } catch (error) {
    void logError(rt.db, { area: 'water', error, route: '/ernaehrung/wasser' });
  }
}

/** Trinkmenge eintragen; ohne Tag zählt sie zu heute. Nachtragen für frühere Tage ist möglich. */
export async function addWater(
  rt: DbRuntime,
  amountMl: number,
  options: { day?: DayKey; clock?: Clock } = {},
): Promise<WaterEntry> {
  const clock = options.clock ?? {};
  const now = nowOf(clock);
  const tz = localTimeZone();
  const day = options.day ?? dayKey(now, tz);
  const entry = await insertDoc(rt, waterEntryDef, {
    dayKey: day,
    tz,
    loggedAt: now.toISOString(),
    amountMl: checkAmount(amountMl),
  });
  await afterChange(rt, day, clock);
  return entry;
}

/** Menge eines Eintrags korrigieren; Tag und Uhrzeit bleiben. */
export async function updateWaterAmount(
  rt: DbRuntime,
  id: string,
  amountMl: number,
  clock: Clock = {},
): Promise<WaterEntry> {
  const amount = checkAmount(amountMl);
  const entry = await updateDoc(rt, waterEntryDef, id, (current) => ({
    ...current,
    amountMl: amount,
  }));
  await afterChange(rt, entry.dayKey, clock);
  return entry;
}

/** Eintrag löschen (Löschmarkierung); „Rückgängig“ über `restoreWater`. */
export async function deleteWater(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, waterEntryDef, id, 'active');
}

export async function restoreWater(
  rt: DbRuntime,
  id: string,
  clock: Clock = {},
): Promise<WaterEntry> {
  const entry = await restoreDoc(rt, waterEntryDef, id);
  await afterChange(rt, entry.dayKey, clock);
  return entry;
}

/** Tagesziel ändern: gilt ab heute, frühere Tage behalten ihr Ziel (datierte Ziele, AK-SET-01). */
export function setWaterGoal(rt: DbRuntime, goalMl: number, clock: Clock = {}) {
  return setGoal(rt, 'water_daily', goalMl, clock);
}

/** Eigene Schnellmengen speichern; `null` stellt die Standardwerte wieder her. */
export async function saveQuickAmounts(
  rt: DbRuntime,
  values: readonly number[] | null,
): Promise<void> {
  if (values !== null && !validQuickAmounts(values)) {
    throw new InvalidWaterError('Schnellmengen ungültig');
  }
  await saveSettings(rt, { waterQuickMl: values === null ? undefined : [...values] });
}
