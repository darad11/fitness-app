import type { MealSlot } from '../model/nutrition';

/**
 * Mahlzeit nach Uhrzeit (D-275) für den schnellen Eintrag von „Heute“: bis 10:59 Frühstück,
 * 11 bis 14:59 Mittagessen, 17 bis 20:59 Abendessen, sonst Snacks. Im Eintragen-Fenster änderbar.
 */
export function mealSlotAt(hour: number): MealSlot {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snacks';
}
