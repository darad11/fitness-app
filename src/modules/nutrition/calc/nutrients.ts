import { CORE_NUTRIENTS, NUTRIENTS, type Nutrient, type Nutrients } from '../model/nutrition';

/** Nährwerte für eine Menge aus den Werten je 100 g bzw. 100 ml; fehlende bleiben fehlend. */
export function scaleNutrients(per100: Nutrients, amount: number): Nutrients {
  const factor = amount / 100;
  const result: Nutrients = {};
  for (const nutrient of NUTRIENTS) {
    const value = per100[nutrient];
    if (value !== undefined) result[nutrient] = round(value * factor, nutrient === 'kcal' ? 1 : 2);
  }
  return result;
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export interface DayTotals {
  /** Summen; ein Nährwert fehlt in einem Eintrag, zählt er dort als 0, steht aber in `incomplete`. */
  sums: Record<Nutrient, number>;
  /** Nährwerte, die in mindestens einem Eintrag fehlen (NU-22). */
  incomplete: Nutrient[];
  /** Mindestens ein Eintrag ist geschätzt (Schnelleintrag). */
  estimated: boolean;
  count: number;
}

/** Tagessumme (AK: Summen stimmen mit einer Handrechnung überein). */
export function sumEntries(
  entries: readonly { nutrients: Nutrients; isEstimated: boolean }[],
): DayTotals {
  const sums = Object.fromEntries(NUTRIENTS.map((n) => [n, 0])) as Record<Nutrient, number>;
  const incomplete = new Set<Nutrient>();
  let estimated = false;
  for (const entry of entries) {
    for (const nutrient of NUTRIENTS) {
      const value = entry.nutrients[nutrient];
      if (value === undefined) incomplete.add(nutrient);
      else sums[nutrient] += value;
    }
    if (entry.isEstimated) estimated = true;
  }
  for (const nutrient of NUTRIENTS) sums[nutrient] = round(sums[nutrient], 1);
  return {
    sums,
    incomplete: NUTRIENTS.filter((n) => incomplete.has(n)),
    estimated,
    count: entries.length,
  };
}

/** Fehlende Pflichtwerte eines Lebensmittels (kcal, Eiweiß, Kohlenhydrate, Fett). */
export function missingCore(per100: Nutrients): Nutrient[] {
  return CORE_NUTRIENTS.filter((n) => per100[n] === undefined);
}

/**
 * Plausibilität der Energie (data-model.md 4): kcal ≈ 4 × Eiweiß + 4 × Kohlenhydrate + 9 × Fett,
 * Toleranz max(15 %, 20 kcal). Liefert die berechnete Energie, wenn der Wert davon abweicht.
 */
export function kcalMismatch(per100: Nutrients): number | null {
  const { kcal, protein, carbs, fat } = per100;
  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return null;
  }
  const computed = 4 * protein + 4 * carbs + 9 * fat;
  const tolerance = Math.max(0.15 * computed, 20);
  return Math.abs(kcal - computed) > tolerance ? Math.round(computed) : null;
}

/** kcal aus Kilojoule (1 kcal = 4,184 kJ), z. B. wenn nur kJ auf der Packung stehen. */
export function kjToKcal(kj: number): number {
  return Math.round(kj / 4.184);
}
