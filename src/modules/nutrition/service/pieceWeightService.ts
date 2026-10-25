import { loadSettings, saveSettings } from '@/modules/settings';
import type { DbRuntime } from '@/shared/db';
import { cleanPieceGrams, nextPieceWeights } from '../calc/pieces';
import type { FoodItem } from '../model/foodItem';
import { InvalidEntryError } from './nutritionService';

/**
 * Merkt sich das Stückgewicht eines Grundnahrungsmittels (Phase Ernährung §6, D-362) in den
 * Einstellungen (`pieceWeights`, synchronisiert wie alle Einstellungen). Gleich dem Wert aus der
 * Liste entfällt der eigene Eintrag; unverändert wird nichts geschrieben. Geändert wird in einer
 * Transaktion, damit ein zweites Gerät oder Fenster kein anderes Gewicht überschreibt.
 */
export async function savePieceWeight(
  rt: DbRuntime,
  food: FoodItem,
  grams: number,
): Promise<boolean> {
  if (!food.basic?.unit || cleanPieceGrams(grams) === null) throw new InvalidEntryError('amount');
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
