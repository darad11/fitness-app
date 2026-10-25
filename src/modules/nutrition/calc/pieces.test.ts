import { describe, expect, it } from 'vitest';
import type { FoodItem } from '../model/foodItem';
import {
  applyPieceWeights,
  cleanPieceGrams,
  nextPieceWeights,
  pieceGramsOf,
  pieceServingId,
  withPiece,
} from './pieces';

const basic = (id: string, extra: Partial<NonNullable<FoodItem['basic']>> = {}): FoodItem => ({
  id,
  name: id,
  aliases: [],
  basis: 'g',
  per100: { kcal: 50, protein: 1, carbs: 10, fat: 0.5 },
  servings: [],
  source: 'bls',
  quality: 'verified',
  basic: { origin: 'bls', code: 'X', sourceName: id, derived: [], ...extra },
});

const EI = '00000000-0000-5000-8000-000000000001';
const APFEL = '00000000-0000-5000-8000-000000000002';
const BROKKOLI = '00000000-0000-5000-8000-000000000003';

describe('Stückgewichte der Grundauswahl (D-362)', () => {
  it('rundet auf 0,1 g und lehnt 0, Negatives und über 5000 g ab', () => {
    expect(cleanPieceGrams(180)).toBe(180);
    expect(cleanPieceGrams(46.26)).toBe(46.3);
    expect(cleanPieceGrams(0)).toBeNull();
    expect(cleanPieceGrams(0.04)).toBeNull();
    expect(cleanPieceGrams(-3)).toBeNull();
    expect(cleanPieceGrams(5000.1)).toBeNull();
    expect(cleanPieceGrams(Number.NaN)).toBeNull();
  });

  it('nimmt das eigene Gewicht vor dem aus der Liste', () => {
    expect(pieceGramsOf(basic(EI, { unit: 'Stück', listPieceGrams: 51 }))).toBe(51);
    expect(pieceGramsOf(basic(EI, { unit: 'Stück', listPieceGrams: 51, ownPieceGrams: 60 }))).toBe(
      60,
    );
    expect(pieceGramsOf(basic(APFEL, { unit: 'Stück' }))).toBeUndefined();
  });

  it('legt eine Stück-Portion mit fester ID an, nur mit Einheit', () => {
    const ei = withPiece(basic(EI, { unit: 'Stück' }), 51);
    expect(ei.servings).toEqual([{ id: pieceServingId(EI), name: 'Stück', amount: 51 }]);
    expect(withPiece(ei, 60).servings).toEqual([
      { id: pieceServingId(EI), name: 'Stück', amount: 60 },
    ]);
    expect(withPiece(basic(BROKKOLI), 300).servings).toEqual([]);
    expect(withPiece(basic(APFEL, { unit: 'Scheibe' }), 0).servings).toEqual([]);
  });

  it('wendet gemerkte Gewichte an und überspringt ungültige', () => {
    const items = [
      basic(EI, { unit: 'Stück', listPieceGrams: 51 }),
      basic(APFEL, { unit: 'Stück' }),
      basic(BROKKOLI),
    ];
    const [ei, apfel, brokkoli] = applyPieceWeights(items, { [APFEL]: 180, [BROKKOLI]: 300 });
    expect(ei?.servings[0]?.amount).toBe(51);
    expect(apfel?.basic?.ownPieceGrams).toBe(180);
    expect(apfel?.servings[0]).toMatchObject({ name: 'Stück', amount: 180 });
    // Ohne Einheit bleibt es bei Gramm, auch wenn ein Wert gespeichert wäre.
    expect(brokkoli).toBe(items[2]);
    const [, ohne] = applyPieceWeights(items, { [APFEL]: -1 });
    expect(ohne?.servings).toEqual([]);
  });

  it('merkt sich nur Änderungen und entfernt den eigenen Wert, wenn er der Liste entspricht', () => {
    const ei = basic(EI, { unit: 'Stück', listPieceGrams: 51 });
    const apfel = basic(APFEL, { unit: 'Stück' });
    expect(nextPieceWeights(undefined, apfel, 180)).toEqual({ [APFEL]: 180 });
    expect(nextPieceWeights({ [APFEL]: 180 }, apfel, 180)).toBeNull();
    expect(nextPieceWeights({ [APFEL]: 180 }, ei, 60)).toEqual({ [APFEL]: 180, [EI]: 60 });
    expect(nextPieceWeights({ [APFEL]: 180, [EI]: 60 }, ei, 51)).toEqual({ [APFEL]: 180 });
    expect(nextPieceWeights({ [APFEL]: 180 }, ei, 51)).toBeNull();
    expect(nextPieceWeights(undefined, apfel, 0)).toBeNull();
    expect(nextPieceWeights(undefined, basic(BROKKOLI), 300)).toBeNull();
  });
});
