import { describe, expect, it } from 'vitest';
import { createFormatters, NBSP, parseDecimal, resolveLocale } from './format';

describe('resolveLocale', () => {
  it.each([
    [['de-AT'], 'de-AT'],
    [['de-AT', 'en-US'], 'de-AT'],
    [['de-CH'], 'de-CH'],
    [['de-LI'], 'de-CH'],
    [['de-DE'], 'de-DE'],
    [['de'], 'de-DE'],
    [['de-LU'], 'de-DE'],
    [['en-US', 'de-AT'], 'de-AT'],
    [['en-AT'], 'de-AT'],
    [['fr-CH'], 'de-CH'],
    [['en-US'], 'de-DE'],
    [[], 'de-DE'],
    [['kein gültiges tag!'], 'de-DE'],
  ] as const)('Gerätesprachen %j ergeben %s', (languages, expected) => {
    expect(resolveLocale('auto', languages)).toBe(expected);
  });

  it('nimmt eine ausdrückliche Wahl vor der Gerätesprache', () => {
    expect(resolveLocale('de-CH', ['de-AT'])).toBe('de-CH');
  });
});

describe('createFormatters', () => {
  const jan17 = new Date('2026-01-17T12:00:00Z');
  const oct18Evening = new Date('2026-10-18T19:05:00Z');

  it('zeigt für de-AT „Jänner" und für de-DE „Januar" (AK-SET-04)', () => {
    expect(createFormatters('de-AT', 'Europe/Vienna').dayMonthYear(jan17)).toBe('17. Jänner 2026');
    expect(createFormatters('de-DE', 'Europe/Berlin').dayMonthYear(jan17)).toBe('17. Januar 2026');
  });

  it('formatiert Wochentag, Datum und 24-Stunden-Zeit', () => {
    const f = createFormatters('de-AT', 'Europe/Vienna');
    expect(f.weekdayDayMonth(oct18Evening)).toBe('Sonntag, 18. Oktober');
    expect(f.time(oct18Evening)).toBe('21:05');
    expect(f.time(new Date('2026-10-18T07:05:00Z'))).toBe('09:05');
    expect(f.dateTimeShort(oct18Evening)).toBe('18.10.2026, 21:05');
  });

  it('nutzt die Tausendertrennung der Gerätesprache und immer ein Dezimalkomma', () => {
    // Das Trennzeichen kommt aus den Sprachdaten (ICU) und unterscheidet sich je nach Version:
    // de-CH liefert mit ICU 77 „’", mit ICU 78 „'". Geprüft wird deshalb die Art des Zeichens.
    const group = (locale: string) =>
      new Intl.NumberFormat(locale).formatToParts(1234.5).find((p) => p.type === 'group')?.value;
    expect(group('de-DE')).toBe('.');
    expect(group('de-AT')).toMatch(/^\s$/u);
    expect(["'", '’']).toContain(group('de-CH'));
    for (const locale of ['de-DE', 'de-AT', 'de-CH'] as const) {
      expect(createFormatters(locale).number(1234.5)).toBe(`1${group(locale) ?? ''}234,5`);
    }
  });

  it('zeigt Lasten bis 0,25 kg genau ohne überflüssige Nullen', () => {
    const f = createFormatters('de-DE');
    expect(f.loadKg(72.5)).toBe(`72,5${NBSP}kg`);
    expect(f.loadKg(72.25)).toBe(`72,25${NBSP}kg`);
    expect(f.loadKg(70)).toBe(`70${NBSP}kg`);
  });

  it('zeigt Körpergewicht mit einer Nachkommastelle', () => {
    const f = createFormatters('de-AT');
    expect(f.bodyWeightKg(78.44)).toBe(`78,4${NBSP}kg`);
    expect(f.bodyWeightKg(80)).toBe(`80,0${NBSP}kg`);
  });
});

describe('parseDecimal', () => {
  it.each([
    ['62,5', 62.5],
    ['62.5', 62.5],
    [' 62,5 ', 62.5],
    ['62', 62],
    [',5', 0.5],
    ['62,', 62],
    ['0', 0],
  ])('liest %j als %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(['', 'abc', '1.234,5', '6,2,5', '-5', '5kg', '+5'])('lehnt %j ab', (input) => {
    expect(parseDecimal(input)).toBeNull();
  });

  it('erlaubt negative Werte nur auf Wunsch', () => {
    expect(parseDecimal('-2,5', { allowNegative: true })).toBe(-2.5);
  });
});
