import { describe, expect, it } from 'vitest';
import { addDays, dayKey, isoWeekday, isValidDayKey, isValidTimeZone, startOfWeek } from './time';

describe('dayKey', () => {
  it('nutzt das lokale Datum, nicht UTC', () => {
    expect(dayKey(new Date('2026-10-17T21:59:59Z'), 'Europe/Vienna')).toBe('2026-10-17');
    expect(dayKey(new Date('2026-10-17T22:30:00Z'), 'Europe/Vienna')).toBe('2026-10-18');
    expect(dayKey(new Date('2026-10-18T02:00:00Z'), 'America/New_York')).toBe('2026-10-17');
  });

  it('bleibt am Tag der Zeitumstellung korrekt', () => {
    // 25.10.2026: Ende der Sommerzeit in Wien (03:00 MESZ → 02:00 MEZ)
    expect(dayKey(new Date('2026-10-24T22:30:00Z'), 'Europe/Vienna')).toBe('2026-10-25');
    expect(dayKey(new Date('2026-10-25T00:30:00Z'), 'Europe/Vienna')).toBe('2026-10-25');
    expect(dayKey(new Date('2026-10-25T22:59:00Z'), 'Europe/Vienna')).toBe('2026-10-25');
    expect(dayKey(new Date('2026-10-25T23:00:00Z'), 'Europe/Vienna')).toBe('2026-10-26');
  });
});

describe('Kalenderhilfen', () => {
  it('prüft Tage und Zeitzonen', () => {
    expect(isValidDayKey('2028-02-29')).toBe(true);
    expect(isValidDayKey('2026-02-29')).toBe(false);
    expect(isValidDayKey('2026-13-01')).toBe(false);
    expect(isValidDayKey('2026-1-01')).toBe(false);
    expect(isValidTimeZone('Europe/Vienna')).toBe(true);
    expect(isValidTimeZone('Mars/Basis')).toBe(false);
  });

  it('beginnt Wochen am Montag (D-212)', () => {
    expect(isoWeekday('2026-10-12')).toBe(1);
    expect(isoWeekday('2026-10-18')).toBe(7);
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12');
    expect(startOfWeek('2026-10-12')).toBe('2026-10-12');
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28');
  });

  it('rechnet Tage über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(() => addDays('2026-02-30', 1)).toThrow();
  });
});
