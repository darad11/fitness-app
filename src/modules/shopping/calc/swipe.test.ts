import { describe, expect, it } from 'vitest';
import { deleteDistance, releasesDelete, swipeIntent, swipeOffset } from './swipe';

describe('Wischen zum Löschen (D-360)', () => {
  it('entscheidet erst nach ein paar Pixeln', () => {
    expect(swipeIntent(0, 0)).toBe('pending');
    expect(swipeIntent(-6, 4)).toBe('pending');
  });

  it('nimmt nur einen klar waagrechten Wisch nach links', () => {
    expect(swipeIntent(-12, 0)).toBe('swipe');
    expect(swipeIntent(-30, 14)).toBe('swipe');
    expect(swipeIntent(-30, -15)).toBe('swipe');
  });

  it('lässt senkrechte, schräge und Wische nach rechts stehen', () => {
    expect(swipeIntent(0, 12)).toBe('ignore');
    expect(swipeIntent(-3, -40)).toBe('ignore');
    // 45° und knapp steiler als 2 : 1 gelten als schräg.
    expect(swipeIntent(-20, 20)).toBe('ignore');
    expect(swipeIntent(-30, 16)).toBe('ignore');
    expect(swipeIntent(15, 0)).toBe('ignore');
  });

  it('verschiebt nur nach links und höchstens um die Zeilenbreite', () => {
    expect(swipeOffset(-50, 300)).toBe(-50);
    expect(swipeOffset(40, 300)).toBe(0);
    expect(swipeOffset(-400, 300)).toBe(-300);
  });

  it('löscht erst ab 40 % der Breite, mindestens 96 px', () => {
    expect(deleteDistance(343)).toBeCloseTo(137.2);
    expect(deleteDistance(200)).toBe(96);
    expect(releasesDelete(-130, 343)).toBe(false);
    expect(releasesDelete(-140, 343)).toBe(true);
    // Ein kurzer Wisch löst nichts aus, auch auf einer schmalen Zeile.
    expect(releasesDelete(-60, 120)).toBe(false);
    expect(releasesDelete(-96, 120)).toBe(true);
  });
});
