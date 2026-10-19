import type { ActivityLevel, Direction, NutritionTarget, TargetInputs } from '../model/nutrition';
import { TARGET_LIMITS } from '../model/nutrition';

/**
 * Vorschlag für Tagesziele (D-262): Grundumsatz nach Mifflin-St Jeor, mal Aktivitätsfaktor,
 * dann Anpassung für die Richtung. Eiweiß 1,8 g je kg, Fett 30 % der Energie, der Rest
 * Kohlenhydrate. Ein Vorschlag, keine individuelle Empfehlung; frei anpassbar.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const DIRECTION_KCAL: Record<Direction, number> = { lose: -500, maintain: 0, gain: 300 };
export const PROTEIN_PER_KG = 1.8;
export const FAT_SHARE = 0.3;

export interface TargetValues {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function ageInYear(birthYear: number, now: Date): number {
  return now.getFullYear() - birthYear;
}

/** Grundumsatz (BMR) in kcal pro Tag. */
export function basalMetabolicRate(inputs: TargetInputs, now: Date): number {
  const age = ageInYear(inputs.birthYear, now);
  const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * age;
  return base + (inputs.sex === 'male' ? 5 : -161);
}

export function suggestTarget(inputs: TargetInputs, now: Date): TargetValues {
  const tdee = basalMetabolicRate(inputs, now) * ACTIVITY_FACTORS[inputs.activity];
  const kcal = clamp(
    Math.round((tdee + DIRECTION_KCAL[inputs.direction]) / 10) * 10,
    TARGET_LIMITS.kcal.min,
    TARGET_LIMITS.kcal.max,
  );
  const proteinG = Math.round(PROTEIN_PER_KG * inputs.weightKg);
  const fatG = Math.round((kcal * FAT_SHARE) / 9);
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  return { kcal, proteinG, carbsG, fatG };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Aktives Ziel: jüngstes `effectiveFrom` ohne `endedAt` (wie bei den übrigen Zielen). */
export function activeTarget<T extends Pick<NutritionTarget, 'effectiveFrom' | 'endedAt' | 'hlc'>>(
  targets: readonly T[],
): T | undefined {
  return targets
    .filter((t) => t.endedAt === undefined)
    .sort(
      (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.hlc.localeCompare(a.hlc),
    )[0];
}

/**
 * Ziel, das an einem Tag galt: das mit dem jüngsten `effectiveFrom` bis zu diesem Tag. Ein neues
 * Ziel beendet das vorige am selben Tag, daher reicht der Beginn.
 */
export function targetOn<T extends Pick<NutritionTarget, 'effectiveFrom' | 'hlc'>>(
  targets: readonly T[],
  dayKey: string,
): T | undefined {
  return targets
    .filter((t) => t.effectiveFrom <= dayKey)
    .sort(
      (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.hlc.localeCompare(a.hlc),
    )[0];
}
