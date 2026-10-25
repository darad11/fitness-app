import { describe, expect, it } from 'vitest';
import type { FoodItem } from '../model/foodItem';
import {
  applyPieceWeights,
  cleanPieceGrams,
  isPieceCount,
  nextPieceWeights,
  pieceGramsOf,
  pieceServingId,
  stepPieces,
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
const KUERBIS = '00000000-0000-5000-8000-000000000004';

describe('Stückgewichte der Grundauswahl (D-362, Richtwerte D-365)', () => {
  it('rundet auf 0,1 g und lehnt 0, Negatives und über 5000 g ab', () => {
    expect(cleanPieceGrams(180)).toBe(180);
    expect(cleanPieceGrams(46.26)).toBe(46.3);
    expect(cleanPieceGrams(0)).toBeNull();
    expect(cleanPieceGrams(0.04)).toBeNull();
    expect(cleanPieceGrams(-3)).toBeNull();
    expect(cleanPieceGrams(5000.1)).toBeNull();
    expect(cleanPieceGrams(Number.NaN)).toBeNull();
  });

  it('nimmt das eigene Gewicht vor dem Richtwert, ohne Richtwert keines', () => {
    expect(pieceGramsOf(basic(EI, { unit: 'Stück', listPieceGrams: 51 }))).toBe(51);
    expect(pieceGramsOf(basic(EI, { unit: 'Stück', listPieceGrams: 51, ownPieceGrams: 60 }))).toBe(
      60,
    );
    expect(pieceGramsOf(basic(APFEL, { unit: 'Stück' }))).toBeUndefined();
    // Ein gemerktes Gewicht ohne Richtwert zählt nicht: ohne Richtwert nur Gramm.
    expect(pieceGramsOf(basic(KUERBIS, { unit: 'Stück', ownPieceGrams: 900 }))).toBeUndefined();
  });

  it('zählt in ganzen und halben Stück, zwischen 0,5 und 100', () => {
    expect(stepPieces(1, 1)).toBe(1.5);
    expect(stepPieces(1.5, 1)).toBe(2);
    expect(stepPieces(2, -1)).toBe(1.5);
    expect(stepPieces(0.5, -1)).toBe(0.5);
    expect(stepPieces(100, 1)).toBe(100);
    // Krumme Eingaben rasten auf halbe Stück ein.
    expect(stepPieces(1.3, 1)).toBe(2);
    expect(stepPieces(1.3, -1)).toBe(1);
    // Ohne gültige Anzahl: Plus beginnt bei 0,5, Minus bei 1.
    expect(stepPieces(null, 1)).toBe(0.5);
    expect(stepPieces(null, -1)).toBe(1);
    expect(stepPieces(0, 1)).toBe(0.5);
    expect([0.5, 1, 1.5, 2, 100].every(isPieceCount)).toBe(true);
    expect([0, -1, 0.3, 1.25, 100.5, Number.NaN].some(isPieceCount)).toBe(false);
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
    // Gewichte hier sind Testwerte, keine Richtwerte der Liste.
    const items = [
      basic(EI, { unit: 'Stück', listPieceGrams: 51 }),
      basic(APFEL, { unit: 'Stück', listPieceGrams: 150 }),
      basic(BROKKOLI),
      basic(KUERBIS, { unit: 'Stück' }),
    ];
    const [ei, apfel, brokkoli, kuerbis] = applyPieceWeights(items, {
      [APFEL]: 180,
      [BROKKOLI]: 300,
      [KUERBIS]: 900,
    });
    expect(ei?.servings[0]?.amount).toBe(51);
    expect(apfel?.basic?.ownPieceGrams).toBe(180);
    expect(apfel?.servings[0]).toMatchObject({ name: 'Stück', amount: 180 });
    // Ohne Einheit oder ohne Richtwert bleibt es bei Gramm, auch mit gespeichertem Wert.
    expect(brokkoli).toBe(items[2]);
    expect(kuerbis).toBe(items[3]);
    const [, ohne] = applyPieceWeights(items, { [APFEL]: -1 });
    expect(ohne?.basic?.ownPieceGrams).toBeUndefined();
    expect(ohne?.servings[0]).toMatchObject({ name: 'Stück', amount: 150 });
  });

  it('merkt sich nur Änderungen und entfernt den eigenen Wert beim Richtwert', () => {
    const ei = basic(EI, { unit: 'Stück', listPieceGrams: 51 });
    const apfel = basic(APFEL, { unit: 'Stück', listPieceGrams: 150 });
    expect(nextPieceWeights(undefined, apfel, 180)).toEqual({ [APFEL]: 180 });
    expect(nextPieceWeights({ [APFEL]: 180 }, apfel, 180)).toBeNull();
    expect(nextPieceWeights({ [APFEL]: 180 }, ei, 60)).toEqual({ [APFEL]: 180, [EI]: 60 });
    expect(nextPieceWeights({ [APFEL]: 180, [EI]: 60 }, ei, 51)).toEqual({ [APFEL]: 180 });
    expect(nextPieceWeights({ [APFEL]: 180 }, ei, 51)).toBeNull();
    // Zurücksetzen: gleich dem Richtwert entfällt der eigene Wert.
    expect(nextPieceWeights({ [APFEL]: 180 }, apfel, 150)).toEqual({});
    expect(nextPieceWeights(undefined, apfel, 0)).toBeNull();
    expect(nextPieceWeights(undefined, basic(BROKKOLI), 300)).toBeNull();
    expect(nextPieceWeights(undefined, basic(KUERBIS, { unit: 'Stück' }), 900)).toBeNull();
  });
});
