import { describe, expect, it } from 'vitest';
import { addDays } from '@/shared/lib/time';
import { laterDay, shouldShowReturn } from './returnFlow';

const TODAY = '2026-11-05';

describe('Auslöser des Rückkehr-Flows (D-319)', () => {
  it('erscheint ab 14 Tagen ohne Eintrag, vorher nicht', () => {
    expect(shouldShowReturn(addDays(TODAY, -14), TODAY, null)).toBe(true);
    expect(shouldShowReturn(addDays(TODAY, -40), TODAY, null)).toBe(true);
    expect(shouldShowReturn(addDays(TODAY, -13), TODAY, null)).toBe(false);
    expect(shouldShowReturn(TODAY, TODAY, null)).toBe(false);
  });

  it('erscheint einmal je Rückkehr: nicht erneut für denselben letzten Eintrag', () => {
    const last = addDays(TODAY, -20);
    expect(shouldShowReturn(last, TODAY, last)).toBe(false);
    expect(shouldShowReturn(last, addDays(TODAY, 3), last)).toBe(false);
    // Neuer Eintrag nach der Rückkehr, dann wieder 14 Tage Pause: erscheint erneut.
    const later = addDays(TODAY, 1);
    expect(shouldShowReturn(later, addDays(later, 14), last)).toBe(true);
  });

  it('erscheint beim ersten Start ohne Einträge nicht', () => {
    expect(shouldShowReturn(null, TODAY, null)).toBe(false);
  });

  it('nimmt den jüngeren Tag aus Einträgen und Schritten', () => {
    expect(laterDay('2026-10-01', '2026-10-20')).toBe('2026-10-20');
    expect(laterDay(null, '2026-10-20')).toBe('2026-10-20');
    expect(laterDay('2026-10-01', null)).toBe('2026-10-01');
    expect(laterDay(null, null)).toBeNull();
  });
});
