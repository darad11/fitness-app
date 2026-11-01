// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAtLeast } from './breakpoints';

/** `matchMedia` mit einer Fensterbreite, die sich ändern lässt (Auf- und Zuklappen des Duo). */
function fakeWindow(width: number) {
  let current = width;
  const lists = new Set<{ query: string; listeners: Set<() => void> }>();
  const matches = (query: string) => current >= Number(/(\d+(?:\.\d+)?)rem/.exec(query)?.[1]) * 16;
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const entry = { query, listeners: new Set<() => void>() };
    lists.add(entry);
    return {
      get matches() {
        return matches(query);
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => entry.listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        entry.listeners.delete(listener),
    } as unknown as MediaQueryList;
  });
  return {
    resize(next: number) {
      current = next;
      for (const entry of lists) for (const listener of entry.listeners) listener();
    },
    listening: () => [...lists].reduce((sum, entry) => sum + entry.listeners.size, 0),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAtLeast (D-499)', () => {
  it('folgt dem Fenster: Duo zugeklappt schmal, aufgeklappt breit, wieder zu schmal', () => {
    const win = fakeWindow(382);
    const { result, unmount } = renderHook(() => useAtLeast('sm'));
    expect(result.current).toBe(false);
    act(() => {
      win.resize(867);
    });
    expect(result.current).toBe(true);
    act(() => {
      win.resize(382);
    });
    expect(result.current).toBe(false);
    unmount();
    expect(win.listening()).toBe(0);
  });

  it('ab genau 40 rem breit (640 px)', () => {
    fakeWindow(640);
    expect(renderHook(() => useAtLeast('sm')).result.current).toBe(true);
    fakeWindow(639);
    expect(renderHook(() => useAtLeast('sm')).result.current).toBe(false);
  });
});
