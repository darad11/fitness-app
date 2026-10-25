import { loadSettings, saveSettings } from '@/modules/settings';
import type { DbRuntime } from '@/shared/db';
import { cleanPieceGrams, nextPieceWeights } from '../calc/pieces';
import type { FoodItem } from '../model/foodItem';
import { InvalidEntryError } from './nutritionService';

/**
 * Merkt sich das eigene Stückgewicht eines Grundnahrungsmittels mit Richtwert (D-362, D-365) in
 * den Einstellungen (`pieceWeights`, synchronisiert wie alle Einstellungen). Gleich dem Richtwert
 * entfällt der eigene Eintrag (zurückgesetzt); unverändert wird nichts geschrieben. Geändert wird
 * in einer Transaktion, damit ein zweites Gerät oder Fenster kein anderes Gewicht überschreibt.
 */
export async function savePieceWeight(
  rt: DbRuntime,
  food: FoodItem,
  grams: number,
): Promise<boolean> {
  const basic = food.basic;
  if (!basic?.unit || basic.listPieceGrams === undefined || cleanPieceGrams(grams) === null) {
    throw new InvalidEntryError('amount');
  }
  const before = await loadSettings(rt.db);
  if (nextPieceWeights(before.pieceWeights, food, grams) === null) return false;
  let changed = false;
  await saveSettings(rt, (current) => {
    const next = nextPieceWeights(current.pieceWeights, food, grams);
    if (next === null) return {};
    changed = true;
    return { pieceWeights: Object.keys(next).length > 0 ? next : undefined };
  });
  return changed;
}
