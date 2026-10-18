import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { APP_NAMESPACE, isUuid, sha1, stableId, uuidv4, uuidv5 } from './uuid';

const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const utf8 = (text: string) => new TextEncoder().encode(text);

describe('sha1', () => {
  it.each([
    ['', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
    ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    ],
    ['Übung', 'dd40d45b43672300dc7f8c89b7d76d041b4494f4'],
  ])('berechnet den Referenzwert für %j', (input, expected) => {
    expect(hex(sha1(utf8(input)))).toBe(expected);
  });

  it('berechnet eine Million „a" korrekt (mehrere Blöcke)', () => {
    expect(hex(sha1(utf8('a'.repeat(1_000_000))))).toBe('34aa973cd4c4daa4f61eeb2bdbad27316534016f');
  });
});

describe('uuidv5', () => {
  it('stimmt mit Referenzwerten (Python uuid.uuid5) überein', () => {
    expect(uuidv5('www.example.com', DNS_NAMESPACE)).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
    expect(uuidv5('python.org', DNS_NAMESPACE)).toBe('886313e1-3b8a-5372-9b90-0c9aee199e5d');
  });

  it('bildet deterministische IDs im Namensraum der App', () => {
    expect(APP_NAMESPACE).toBe('a9f1c5d1-6d1e-4d1d-b94d-d8ca701b9904');
    expect(stableId('singleton:settings')).toBe('3b4e83d2-1b96-5236-a5e7-cd8bc0fc9153');
    expect(stableId('core-exercise:bench_press')).toBe('b9532544-f4a0-51b3-ab6d-a5744d406b37');
    expect(stableId('a')).not.toBe(stableId('b'));
  });

  it('lehnt einen ungültigen Namensraum ab', () => {
    expect(() => uuidv5('x', 'kein-namensraum')).toThrow();
  });
});

describe('uuidv4', () => {
  it('erzeugt gültige, verschiedene UUIDs der Version 4', () => {
    const a = uuidv4();
    const b = uuidv4();
    expect(isUuid(a)).toBe(true);
    expect(a[14]).toBe('4');
    expect(a).not.toBe(b);
  });

  it('besteht die UUID-Prüfung von Zod (Version 4 und 5)', () => {
    const schema = z.uuid();
    expect(schema.safeParse(uuidv4()).success).toBe(true);
    expect(schema.safeParse(stableId('singleton:settings')).success).toBe(true);
  });
});
