import { describe, expect, it } from 'vitest';
import { entryNameAndBrand } from './format';

describe('entryNameAndBrand (D-278)', () => {
  const lookup = (id: string) => (id === 'f1' ? 'Alnatura' : undefined);

  it('nimmt die Marke des Eintrags', () => {
    expect(entryNameAndBrand({ nameSnapshot: 'Skyr', brandSnapshot: 'Spar' })).toEqual({
      name: 'Skyr',
      brand: 'Spar',
    });
  });

  it('ältere Einträge: Marke aus den Lebensmitteldaten, Klammer am Namen entfällt', () => {
    expect(entryNameAndBrand({ nameSnapshot: 'Hummus (Alnatura)', foodId: 'f1' }, lookup)).toEqual({
      name: 'Hummus',
      brand: 'Alnatura',
    });
    expect(entryNameAndBrand({ nameSnapshot: 'Hummus', foodId: 'f1' }, lookup)).toEqual({
      name: 'Hummus',
      brand: 'Alnatura',
    });
  });

  it('ohne Marke bleibt der Name unverändert', () => {
    expect(entryNameAndBrand({ nameSnapshot: 'Altbrot (Roggen)', foodId: 'x' }, lookup)).toEqual({
      name: 'Altbrot (Roggen)',
    });
  });
});
