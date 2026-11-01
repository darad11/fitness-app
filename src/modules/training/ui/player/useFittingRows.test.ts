import { describe, expect, it } from 'vitest';
import { fittingCount } from './useFittingRows';

/**
 * „Als Nächstes“ in der festen rechten Spalte (D-495): nur ganze Einträge, und bleiben welche
 * weg, Platz für die Zeile „und n weitere Übungen“. Einträge 40 px hoch, 8 px Abstand, die Zeile
 * darunter 28 px (Maße im Player).
 */
describe('fittingCount', () => {
  it('zeigt alle, wenn sie ganz passen; ohne Zeile „weitere“', () => {
    // 4 Einträge: 4 · 40 + 3 · 8 = 184 px.
    expect(fittingCount(184, 40, 8, 28, 4)).toBe(4);
    expect(fittingCount(500, 40, 8, 28, 4)).toBe(4);
  });

  it('nie einen angeschnittenen Eintrag', () => {
    expect(fittingCount(183, 40, 8, 28, 4)).toBeLessThan(4);
    expect(fittingCount(39, 40, 8, 28, 1)).toBe(0);
    expect(fittingCount(40, 40, 8, 28, 1)).toBe(1);
  });

  it('bleiben Einträge weg, hat die Zeile „und n weitere“ Platz', () => {
    // 3 Einträge brauchen 136 px, mit der Zeile 164 px.
    expect(fittingCount(163, 40, 8, 28, 4)).toBe(2);
    expect(fittingCount(164, 40, 8, 28, 4)).toBe(3);
  });

  it('ohne Platz keiner (die Karte steht dann nicht da)', () => {
    expect(fittingCount(0, 40, 8, 28, 4)).toBe(0);
    expect(fittingCount(-32, 40, 8, 28, 4)).toBe(0);
  });
});
