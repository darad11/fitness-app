import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  loadSettings,
  PIECE_WEIGHT_MAX,
  saveSettings,
  SETTINGS_ID,
  settingsDef,
} from '@/modules/settings';
import { getDoc, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { PIECE_GRAMS_MAX } from '../model/basicFood';
import type { FoodItem } from '../model/foodItem';
import { InvalidEntryError } from './nutritionService';
import { savePieceWeight } from './pieceWeightService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const food = (id: string, extra: Partial<NonNullable<FoodItem['basic']>> = {}): FoodItem => ({
  id,
  name: id,
  aliases: [],
  basis: 'g',
  per100: { kcal: 50, protein: 1, carbs: 10, fat: 0.5 },
  servings: [],
  source: 'bls',
  quality: 'verified',
  basic: { origin: 'bls', code: 'X', sourceName: id, unit: 'Stück', derived: [], ...extra },
});

// Gewichte hier sind Testwerte, keine Richtwerte der Liste.
const APFEL = food('00000000-0000-5000-8000-000000000002', { listPieceGrams: 150 });
const EI = food('00000000-0000-5000-8000-000000000001', { listPieceGrams: 51 });

describe('Stückgewicht merken (D-362, D-365)', () => {
  it('speichert das Gewicht je Lebensmittel in den Einstellungen', async () => {
    expect(await savePieceWeight(rt, APFEL, 180)).toBe(true);
    expect(await savePieceWeight(rt, EI, 60)).toBe(true);
    expect((await loadSettings(rt.db)).pieceWeights).toEqual({ [APFEL.id]: 180, [EI.id]: 60 });
  });

  it('schreibt nichts, wenn sich nichts ändert', async () => {
    await savePieceWeight(rt, APFEL, 180);
    const before = await getDoc(rt.db, settingsDef, SETTINGS_ID);
    expect(await savePieceWeight(rt, APFEL, 180)).toBe(false);
    expect(await savePieceWeight(rt, EI, 51)).toBe(false);
    expect((await getDoc(rt.db, settingsDef, SETTINGS_ID))?.hlc).toBe(before?.hlc);
  });

  it('entfernt den eigenen Wert, wenn er wieder dem aus der Liste entspricht', async () => {
    await savePieceWeight(rt, EI, 60);
    await savePieceWeight(rt, EI, 51);
    expect((await loadSettings(rt.db)).pieceWeights).toBeUndefined();
  });

  it('behält die übrigen Einstellungen und Felder einer neueren Version', async () => {
    await saveSettings(rt, { restDefaultSec: 120, waterQuickMl: [100, 200, 300, 400] });
    const stored = await rt.db.singletons.get(SETTINGS_ID);
    await rt.db.singletons.put({ ...stored!, futureField: 'bleibt' });
    await savePieceWeight(rt, APFEL, 180);
    const settings = await loadSettings(rt.db);
    expect(settings.restDefaultSec).toBe(120);
    expect(settings.waterQuickMl).toEqual([100, 200, 300, 400]);
    expect((await rt.db.singletons.get(SETTINGS_ID))?.futureField).toBe('bleibt');
  });

  it('lehnt ungültige Gewichte und Lebensmittel ohne Einheit oder Richtwert ab', async () => {
    await expect(savePieceWeight(rt, APFEL, 0)).rejects.toBeInstanceOf(InvalidEntryError);
    await expect(savePieceWeight(rt, APFEL, PIECE_WEIGHT_MAX + 1)).rejects.toBeInstanceOf(
      InvalidEntryError,
    );
    await expect(
      savePieceWeight(rt, { ...APFEL, basic: { ...APFEL.basic!, unit: undefined } }, 100),
    ).rejects.toBeInstanceOf(InvalidEntryError);
    await expect(
      savePieceWeight(rt, { ...APFEL, basic: { ...APFEL.basic!, listPieceGrams: undefined } }, 100),
    ).rejects.toBeInstanceOf(InvalidEntryError);
    expect((await loadSettings(rt.db)).pieceWeights).toBeUndefined();
    // Gleiche Grenze in der Ernährung und in der Einstellung, die das Gewicht speichert.
    expect(PIECE_GRAMS_MAX).toBe(PIECE_WEIGHT_MAX);
  });

  it('lehnt in den Einstellungen Schlüssel ab, die keine ID sind', async () => {
    await expect(saveSettings(rt, { pieceWeights: { apfel: 180 } })).rejects.toThrow();
    await expect(saveSettings(rt, { pieceWeights: { [APFEL.id]: -1 } })).rejects.toThrow();
  });
});
