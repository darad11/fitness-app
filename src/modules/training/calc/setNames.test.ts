import { describe, expect, it } from 'vitest';
import { setNamesOf, setPositions } from './setNames';

const sets = (...types: ('warmup' | 'working' | 'drop')[]) => types.map((type) => ({ type }));

describe('Namen der Sätze (D-537)', () => {
  it('zählt je Typ: ein Aufwärmsatz ohne Zahl, danach „Arbeitssatz 1 von 3“', () => {
    expect(setNamesOf(sets('warmup', 'working', 'working', 'working'))).toEqual([
      'Aufwärmsatz',
      'Arbeitssatz 1 von 3',
      'Arbeitssatz 2 von 3',
      'Arbeitssatz 3 von 3',
    ]);
  });

  it('zählt mehrere Aufwärmsätze und Drop-Sätze, ein einziger Arbeitssatz bleibt ohne Zahl', () => {
    expect(setNamesOf(sets('warmup', 'warmup', 'working', 'drop', 'drop'))).toEqual([
      'Aufwärmsatz 1 von 2',
      'Aufwärmsatz 2 von 2',
      'Arbeitssatz',
      'Drop-Satz 1 von 2',
      'Drop-Satz 2 von 2',
    ]);
    expect(setNamesOf([])).toEqual([]);
  });

  it('gibt die Stelle je Typ zurück, so wie die Ziffern in der Satzliste', () => {
    const list = sets('warmup', 'working', 'working', 'drop', 'working');
    expect(setPositions(list).map(({ position }) => position)).toEqual([
      { type: 'warmup', n: 1, total: 1 },
      { type: 'working', n: 1, total: 3 },
      { type: 'working', n: 2, total: 3 },
      { type: 'drop', n: 1, total: 1 },
      { type: 'working', n: 3, total: 3 },
    ]);
    expect(setPositions(list)[2]?.set).toBe(list[2]);
  });
});
