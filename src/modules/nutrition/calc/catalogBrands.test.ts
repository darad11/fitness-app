import { describe, expect, it } from 'vitest';
import { brandFromFirma, firmaText, isBrandFile, parseBrandFile } from './catalogBrands';

const counts = new Map([
  ['Alnatura', 5],
  ['Hügli', 3],
  ['Spar', 4],
]);
const brand = (text: string) => brandFromFirma(text, counts);

describe('Marken aus der Herstellerangabe (D-271)', () => {
  it('liest den Text nach „Firma:“ ohne Händlerzusatz', () => {
    expect(firmaText('Firma: Hofgut Buttermilch Händler: Handelshof GmbH\nAllergene: MIL')).toBe(
      'Hofgut Buttermilch',
    );
    expect(firmaText('Firma:\nAllergene: keine')).toBe('');
  });

  it('erkennt häufige Marken am ersten Wort', () => {
    expect(brand('Alnatura Aufstrich/Dip auf Basis von Kichererbsen')).toBe('Alnatura');
    expect(brand('Alnatura Mischung aus Gerste, Linsen und Kichererbsen')).toBe('Alnatura');
    expect(brand('Hügli Kuchen, tiefgekühlt')).toBe('Hügli');
    expect(brand('Spar Veggie rein pflanzlicher Brotaufstrich')).toBe('Spar');
  });

  it('kürzt Firmen mit Rechtsform', () => {
    expect(brand('Bahlsen GmbH & Co. KG Butterkeks für Kinder')).toBe('Bahlsen');
    expect(brand('HiPP GmbH Beikost nach dem 4. Monat')).toBe('HiPP');
    expect(brand('Storck Ges m.b.H Schokoladentoffees')).toBe('Storck');
    expect(brand('Wiberg GmbH, Frutarom Production GmbH Gewürzzubereitung')).toBe('Wiberg');
  });

  it('nimmt die Marke vor dem Komma', () => {
    expect(brand('Knorr, Unilever Basis, Trockenprodukt')).toBe('Knorr');
    expect(brand('FRECHE FREUNDE, erdbär GmbH gefriergetrocknete Erdbeeren')).toBe(
      'FRECHE FREUNDE',
    );
    expect(brand('babylove, dm-drogerie markt GmbH Beikost')).toBe('babylove');
    expect(brand('Molkerei Stainz, Berglandmilch')).toBe('Molkerei Stainz');
  });

  it('behält kurze Vorsätze', () => {
    expect(brand('ja! Natürlich Kichererbsenaufstrich')).toBe('ja! Natürlich');
    expect(brand('Dr. Oetker Original Pudding Pulver')).toBe('Dr. Oetker');
  });

  it('gibt ohne erkennbare Marke nichts zurück', () => {
    expect(brand('')).toBeUndefined();
    expect(brand('/')).toBeUndefined();
    expect(brand('backfertiger Teigling, tiefgekühlt')).toBeUndefined();
  });
});

describe('Markendatei', () => {
  const file = {
    fetchedAt: '2026-10-19 18:04',
    rows: [
      { code: 'H72S800', source: 'ÖNWT2.0', name: 'Hummus classic', firma: 'Firma: Alnatura Dip' },
      { code: 'H73Y800', source: 'ÖNWT2.0', name: 'Hummus  Tomate', firma: 'Firma: Alnatura Dip' },
      { code: '0003384', source: 'ÖNWT-HH', name: 'Bohnen mit Speck', firma: 'Firma:\nAllergene' },
      { code: 'bad code!', source: 'ÖNWT-HH', name: 'X', firma: 'Firma: Y' },
      { code: 'A1', name: 'ohne firma' },
    ],
  };

  it('wird erkannt und gelesen', () => {
    expect(isBrandFile(file)).toBe(true);
    expect(isBrandFile({ rows: [{ code: '1', name: 'x', kcal: 1 }] })).toBe(false);
    expect(parseBrandFile(file)).toEqual({
      fetchedAt: '2026-10-19 18:04',
      rows: [
        ['H72S800', 'Hummus classic', 'Alnatura'],
        ['H73Y800', 'Hummus Tomate', 'Alnatura'],
      ],
      withoutBrand: 1,
    });
    expect(parseBrandFile({ rows: [] })).toBeUndefined();
  });
});
