import { describe, expect, it } from 'vitest';
import { formatRest, formatTargetRange } from './format';

describe('Anzeige von Zielen und Pausen', () => {
  it('zeigt Wiederholungs- und Zeitbereiche', () => {
    expect(formatTargetRange({ repsMin: 6, repsMax: 8 })).toEqual({ kind: 'reps', text: '6–8' });
    expect(formatTargetRange({ repsMin: 10, repsMax: 10 })).toEqual({ kind: 'reps', text: '10' });
    expect(formatTargetRange({ durationMinSec: 30, durationMaxSec: 45 })).toEqual({
      kind: 'time',
      text: '30–45 s',
    });
    expect(formatTargetRange({})).toBeNull();
  });

  it('zeigt Pausen in Sekunden oder Minuten', () => {
    expect(formatRest(0)).toBe('0 s');
    expect(formatRest(45)).toBe('45 s');
    expect(formatRest(60)).toBe('1:00 min');
    expect(formatRest(75)).toBe('1:15 min');
    expect(formatRest(150)).toBe('2:30 min');
  });
});
