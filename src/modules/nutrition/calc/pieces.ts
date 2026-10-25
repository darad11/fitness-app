import { stableId } from '@/shared/lib/uuid';
import { PIECE_GRAMS_MAX } from '../model/basicFood';
import type { FoodItem } from '../model/foodItem';

/**
 * Stückgewichte der Grundauswahl (Phase Ernährung §6, D-362): Eines aus der Liste (z. B. Ei 51 g)
 * oder ein eigenes, das sich die App je Lebensmittel merkt. Das eigene gilt vor dem aus der Liste.
 */

/** Gültiges Stückgewicht in g, auf 0,1 g gerundet; `null` bei 0, negativ oder über 5000 g. */
export function cleanPieceGrams(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 && rounded <= PIECE_GRAMS_MAX ? rounded : null;
}

/** Geltendes Stückgewicht: eigenes vor dem aus der Liste; ohne beides `undefined`. */
export function pieceGramsOf(food: FoodItem): number | undefined {
  return food.basic?.ownPieceGrams ?? food.basic?.listPieceGrams;
}

/** Feste ID der Stück-Portion je Lebensmittel, auf allen Geräten gleich. */
export function pieceServingId(foodId: string): string {
  return stableId(`piece:${foodId}`);
}

/**
 * Lebensmittel mit einer Portion „1 Stück = … g“ (bzw. Scheibe, Zehe …) an erster Stelle. Ohne
 * Einheit oder ohne gültiges Gewicht bleibt es unverändert.
 */
export function withPiece(food: FoodItem, grams: number): FoodItem {
  const unit = food.basic?.unit;
  const clean = cleanPieceGrams(grams);
  if (!unit || clean === null) return food;
  const id = pieceServingId(food.id);
  return {
    ...food,
    servings: [{ id, name: unit, amount: clean }, ...food.servings.filter((s) => s.id !== id)],
  };
}

/**
 * Eigene Stückgewichte (Einstellung `pieceWeights`) auf die Grundauswahl anwenden; Einträge mit
 * geltendem Gewicht bekommen die Stück-Portion. Ungültige oder fremde Einträge zählen nicht.
 */
export function applyPieceWeights(
  items: readonly FoodItem[],
  weights: Readonly<Record<string, number>> = {},
): FoodItem[] {
  return items.map((item) => {
    const basic = item.basic;
    if (!basic?.unit) return item;
    const own = weights[item.id];
    const clean = own === undefined ? null : cleanPieceGrams(own);
    const withOwn: FoodItem =
      clean === null ? item : { ...item, basic: { ...basic, ownPieceGrams: clean } };
    const grams = pieceGramsOf(withOwn);
    return grams === undefined ? withOwn : withPiece(withOwn, grams);
  });
}

/**
 * Neue gemerkte Gewichte, wenn für ein Lebensmittel ein Stückgewicht gewählt wird: Gleich dem
 * Wert aus der Liste wird der eigene Eintrag entfernt (die Liste gilt wieder), sonst gesetzt.
 * `null`, wenn sich nichts ändert.
 */
export function nextPieceWeights(
  weights: Readonly<Record<string, number>> | undefined,
  food: FoodItem,
  grams: number,
): Record<string, number> | null {
  const clean = cleanPieceGrams(grams);
  if (clean === null || !food.basic?.unit) return null;
  const current = weights ?? {};
  const listed = food.basic.listPieceGrams;
  if (clean === listed) {
    if (!(food.id in current)) return null;
    const { [food.id]: _removed, ...rest } = current;
    return rest;
  }
  if (current[food.id] === clean) return null;
  return { ...current, [food.id]: clean };
}
