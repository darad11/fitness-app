// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TWO_COLUMNS_REM, useTwoColumns } from './useTwoColumns';

/** Beobachter, die der Test von Hand auslöst; jsdom hat keinen ResizeObserver. */
const observers: { callback: ResizeObserverCallback; target: Element | null }[] = [];

class StubObserver {
  private entry: { callback: ResizeObserverCallback; target: Element | null };
  constructor(callback: ResizeObserverCallback) {
    this.entry = { callback, target: null };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.target = target;
  }
  disconnect() {
    this.entry.target = null;
  }
  unobserve() {
    this.entry.target = null;
  }
}

/** Neue Breite des Rahmens melden, wie der Browser nach dem Auf- oder Zuklappen. */
function report(width: number) {
  for (const { callback, target } of observers) {
    if (!target) continue;
    const entry = { contentRect: { width } } as unknown as ResizeObserverEntry;
    callback([entry], {} as ResizeObserver);
  }
}

function frameOf(width: number): { current: HTMLElement } {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ width }) as DOMRect;
  return { current: element };
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', StubObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTwoColumns (D-502)', () => {
  it('ab 48 rem Breite des Rahmens zwei Spalten, wie die Container-Abfrage', () => {
    expect(TWO_COLUMNS_REM).toBe(48);
    // Duo quer: 867 px; Duo zugeklappt: 382 px; Grenze 768 px bei 16 px Schrift.
    for (const [width, two] of [
      [867, true],
      [382, false],
      [768, true],
      [767, false],
    ] as const) {
      const frame = frameOf(width);
      expect(renderHook(() => useTwoColumns(frame)).result.current, String(width)).toBe(two);
    }
  });

  it('neue Breite (Auf- und Zuklappen): neu gemessen', () => {
    const frame = frameOf(867);
    const { result } = renderHook(() => useTwoColumns(frame));
    expect(result.current).toBe(true);
    act(() => {
      report(382);
    });
    expect(result.current).toBe(false);
    act(() => {
      report(867);
    });
    expect(result.current).toBe(true);
  });

  it('ohne Rahmen eine Spalte', () => {
    const frame = { current: null };
    expect(renderHook(() => useTwoColumns(frame)).result.current).toBe(false);
  });
});
