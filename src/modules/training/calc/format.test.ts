import { describe, expect, it } from 'vitest';
import {
  formatRest,
  formatRestRemaining,
  formatTargetRange,
  keepNumbersTogether,
  restRemainingSec,
} from './format';

describe('Anzeige von Zielen und Pausen', () => {
  it('zeigt Wiederholungs- und Zeitbereiche', () => {
    expect(formatTargetRange({ repsMin: 6, repsMax: 8 })).toEqual({ kind: 'reps', text: '6–8' });
    expect(formatTargetRange({ repsMin: 10, repsMax: 10 })).toEqual({ kind: 'reps', text: '10' });
    expect(formatTargetRange({ durationMinSec: 30, durationMaxSec: 45 })).toEqual({
      kind: 'time',
      text: '30–45 s',
    });
    expect(formatTargetRange({ durationMinSec: 1800, durationMaxSec: 1800 })).toEqual({
      kind: 'time',
      text: '30:00 min',
    });
    expect(formatTargetRange({ durationMinSec: 45, durationMaxSec: 90 })).toEqual({
      kind: 'time',
      text: '45 s–1:30 min',
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

  it('rechnet die Restzeit aus dem Endzeitpunkt und zeigt Überziehung mit Plus (AK-TRN-11)', () => {
    const now = new Date('2026-10-18T10:00:00.000Z');
    expect(restRemainingSec('2026-10-18T10:01:30.000Z', now)).toBe(90);
    expect(restRemainingSec('2026-10-18T10:00:00.400Z', now)).toBe(1);
    expect(restRemainingSec('2026-10-18T09:59:18.000Z', now)).toBe(-42);
    expect(formatRestRemaining(90)).toBe('1:30');
    expect(formatRestRemaining(0)).toBe('+0:00');
    expect(formatRestRemaining(-42)).toBe('+0:42');
  });
});

describe('Zahlen bleiben beim Wort (E1, D-525)', () => {
  const nbsp = '\u00a0';
  it('Wort und Zahl mit geschütztem Leerzeichen, die übrigen Leerzeichen bleiben', () => {
    expect(keepNumbersTogether('Aufwärmsatz · Satz 1 von 5 · Ziel 10')).toBe(
      `Aufwärmsatz · Satz${nbsp}1 von${nbsp}5 · Ziel${nbsp}10`,
    );
    expect(keepNumbersTogether('Beinpresse, Aufwärmsatz 2 · Ziel 8–12')).toBe(
      `Beinpresse, Aufwärmsatz${nbsp}2 · Ziel${nbsp}8–12`,
    );
  });

  it('Zahl und Einheit bleiben zusammen, Wörter danach nicht', () => {
    expect(keepNumbersTogether('Ziel 30–45 s · Vorwert 60 kg × 8')).toBe(
      `Ziel${nbsp}30–45${nbsp}s · Vorwert${nbsp}60${nbsp}kg ×${nbsp}8`,
    );
    expect(keepNumbersTogether('Ziel 1:30 min')).toBe(`Ziel${nbsp}1:30${nbsp}min`);
    expect(keepNumbersTogether('Satz 1 von 5')).not.toContain(`1${nbsp}von`);
    expect(keepNumbersTogether('2 sehr lange Sätze')).toBe(`2 sehr lange Sätze`);
  });
});
