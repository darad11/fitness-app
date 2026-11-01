// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useShortWindow } from './useShortWindow';

const original = { width: window.innerWidth, height: window.innerHeight };

function resize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  resize(original.width, original.height);
});

describe('useShortWindow (D-498, Nachtrag)', () => {
  it('Duo zugeklappt niedrig, iPhone nicht', () => {
    resize(382, 678);
    expect(renderHook(() => useShortWindow()).result.current).toBe(true);
    resize(390, 844);
    expect(renderHook(() => useShortWindow()).result.current).toBe(false);
  });

  it('die Tastatur ändert nur die Höhe: bleibt, wie es war', () => {
    resize(393, 852);
    const { result } = renderHook(() => useShortWindow());
    act(() => {
      resize(393, 383);
    });
    expect(result.current).toBe(false);
  });

  it('neue Breite (Drehen, Auf- und Zuklappen): neu gemessen', () => {
    resize(669, 869);
    const { result } = renderHook(() => useShortWindow());
    expect(result.current).toBe(false);
    act(() => {
      resize(382, 678);
    });
    expect(result.current).toBe(true);
  });
});
