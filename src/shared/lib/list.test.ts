import { describe, expect, it } from 'vitest';
import { listDe } from './list';

describe('Aufzählung auf Deutsch (D-326)', () => {
  it('verbindet die letzten beiden mit „und“, davor mit Komma', () => {
    expect(listDe([])).toBe('');
    expect(listDe(['Salz'])).toBe('Salz');
    expect(listDe(['Zucker', 'Salz'])).toBe('Zucker und Salz');
    expect(listDe(['Zucker', 'gesättigte Fettsäuren', 'Ballaststoffe', 'Salz'])).toBe(
      'Zucker, gesättigte Fettsäuren, Ballaststoffe und Salz',
    );
  });
});
