import { describe, expect, it } from 'vitest';
import { fieldsFor, formatSetValues, toDisplay, toStored } from './fields';
import { formatClock } from './format';

const n = (value: number) => String(value).replace('.', ',');

describe('Felder je Erfassungsart (D-241)', () => {
  it('liefert passende Felder und Einheiten', () => {
    expect(fieldsFor('weight_reps').map((f) => f.label)).toEqual(['weightKg', 'reps']);
    expect(fieldsFor('reps').map((f) => f.label)).toEqual(['reps']);
    expect(fieldsFor('time').map((f) => f.label)).toEqual(['durationSec']);
    expect(fieldsFor('weight_time').map((f) => f.label)).toEqual(['weightKg', 'durationSec']);
    expect(fieldsFor('time_distance', 'm').map((f) => f.label)).toEqual([
      'durationMin',
      'distanceM',
    ]);
    expect(fieldsFor('time_distance').map((f) => f.label)).toEqual(['durationMin', 'distanceKm']);
    expect(fieldsFor('assisted_reps').map((f) => f.label)).toEqual(['assistKg', 'reps']);
  });

  it('rechnet zwischen Anzeige und Speicher um', () => {
    const [minutes, km] = fieldsFor('time_distance', 'km');
    expect(toStored(minutes!, 12.5)).toBe(750);
    expect(toStored(km!, 2.5)).toBe(2500);
    expect(toDisplay(km!, 2500)).toBe(2.5);
    const [, reps] = fieldsFor('weight_reps');
    expect(toStored(reps!, 8)).toBe(8);
  });

  it('zeigt Sätze kurz an', () => {
    expect(formatSetValues({ weightKg: 62.5, reps: 8 }, 'weight_reps', undefined, n)).toBe(
      '62,5 × 8',
    );
    expect(formatSetValues({ reps: 12 }, 'reps', undefined, n)).toBe('12 Wdh.');
    expect(formatSetValues({ durationSec: 45 }, 'time', undefined, n)).toBe('45 s');
    expect(formatSetValues({ weightKg: 24, durationSec: 40 }, 'weight_time', undefined, n)).toBe(
      '24 kg · 40 s',
    );
    expect(formatSetValues({ durationSec: 600, distanceM: 2500 }, 'time_distance', 'km', n)).toBe(
      '10 min · 2,5 km',
    );
    expect(formatSetValues({ durationSec: 480, distanceM: 2000 }, 'time_distance', 'm', n)).toBe(
      '8 min · 2000 m',
    );
    expect(formatSetValues({ assistKg: 20, reps: 6 }, 'assisted_reps', undefined, n)).toBe(
      '−20 kg × 6',
    );
    expect(formatSetValues({ weightKg: 60 }, 'weight_reps', undefined, n)).toBe('60 × –');
  });

  it('zeigt die laufende Dauer', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(754)).toBe('12:34');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatClock(-5)).toBe('0:00');
  });
});
