import { describe, expect, it } from 'vitest';
import { appInfo, resolveAppEnv } from './env';
import { fnv1a32 } from './hash';

describe('Umgebung', () => {
  it('erkennt Vercel-Umgebungen und fällt sonst auf „local" zurück', () => {
    expect(resolveAppEnv('production')).toBe('production');
    expect(resolveAppEnv('preview')).toBe('preview');
    expect(resolveAppEnv('unbekannt')).toBe('local');
  });

  it('übernimmt die Version aus package.json', () => {
    expect(appInfo.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('fnv1a32', () => {
  it.each([
    ['', '811c9dc5'],
    ['a', 'e40c292c'],
    ['foobar', 'bf9cf968'],
  ])('liefert den Referenzwert für %j', (input, expected) => {
    expect(fnv1a32(input)).toBe(expected);
  });
});
