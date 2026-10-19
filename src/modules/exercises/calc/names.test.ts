import { describe, expect, it } from 'vitest';
import { findSameName, nameKey } from './names';

describe('Gleiche Namen (AK-EXL-03)', () => {
  it('vergleicht ohne Groß- und Kleinschreibung, Umlautschreibweise und Leerzeichen', () => {
    expect(nameKey('Beinpresse')).toBe(nameKey('bein presse'));
    expect(nameKey('Bankdrücken')).toBe(nameKey('BANKDRUECKEN'));
    expect(nameKey('Rudern')).not.toBe(nameKey('Rudern eng'));
  });

  it('findet Namen und Alias-Namen, aber nicht die Übung selbst', () => {
    const list = [
      { id: 'a', name: 'Bankdrücken mit Langhantel', aliases: ['Bench Press'] },
      { id: 'b', name: 'Hip Thrust', aliases: [] },
    ];
    expect(findSameName(list, 'bankdruecken mit langhantel')?.id).toBe('a');
    expect(findSameName(list, 'bench press')?.id).toBe('a');
    expect(findSameName(list, 'Hip Thrust', 'b')).toBeUndefined();
    expect(findSameName(list, '   ')).toBeUndefined();
  });
});
