import { describe, expect, it } from 'vitest';
import { mealSlotAt } from './mealSlot';

describe('mealSlotAt (D-275)', () => {
  it('wählt die Mahlzeit nach der Stunde', () => {
    expect(mealSlotAt(7)).toBe('breakfast');
    expect(mealSlotAt(10)).toBe('breakfast');
    expect(mealSlotAt(11)).toBe('lunch');
    expect(mealSlotAt(14)).toBe('lunch');
    expect(mealSlotAt(15)).toBe('snacks');
    expect(mealSlotAt(17)).toBe('dinner');
    expect(mealSlotAt(20)).toBe('dinner');
    expect(mealSlotAt(21)).toBe('snacks');
    expect(mealSlotAt(2)).toBe('snacks');
  });
});
