// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideStartSurface } from './startSurface';

/** Startfläche aus index.html (D-325): sichtbar nur in der installierten App, wie dort im Stil. */
function mountSurface(display = 'block') {
  const surface = document.createElement('div');
  surface.id = 'startflaeche';
  surface.style.display = display;
  document.body.append(surface);
  return surface;
}

function setup({ painted, reduced }: { painted: boolean; reduced: boolean }) {
  const paint = [{ name: 'first-contentful-paint' }] as unknown as PerformanceEntryList;
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue(painted ? paint : []);
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
  }));
}

describe('Startfläche (D-325)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('blendet nach dem ersten Bild in 250 ms aus und entfernt sich dann', () => {
    vi.useFakeTimers();
    setup({ painted: true, reduced: false });
    const surface = mountSurface();
    hideStartSurface();
    expect(surface.classList.contains('weg')).toBe(true);
    expect(document.getElementById('startflaeche')).not.toBeNull();
    surface.dispatchEvent(new Event('transitionend'));
    expect(document.getElementById('startflaeche')).toBeNull();
  });

  it('entfernt sich auch ohne transitionend nach kurzer Zeit', () => {
    vi.useFakeTimers();
    setup({ painted: true, reduced: false });
    mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(349);
    expect(document.getElementById('startflaeche')).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(document.getElementById('startflaeche')).toBeNull();
  });

  it('entfällt ohne Ausblenden, wenn noch nichts gezeichnet ist (App schon bereit)', () => {
    setup({ painted: false, reduced: false });
    const surface = mountSurface();
    hideStartSurface();
    expect(surface.classList.contains('weg')).toBe(false);
    expect(document.getElementById('startflaeche')).toBeNull();
  });

  it('bei „Bewegung reduzieren“ ohne Ausblenden', () => {
    setup({ painted: true, reduced: true });
    const surface = mountSurface();
    hideStartSurface();
    expect(surface.classList.contains('weg')).toBe(false);
    expect(document.getElementById('startflaeche')).toBeNull();
  });

  it('außerhalb der installierten App (unsichtbar) sofort weg; zweiter Aufruf ohne Wirkung', () => {
    setup({ painted: true, reduced: false });
    const surface = mountSurface('none');
    hideStartSurface();
    expect(surface.classList.contains('weg')).toBe(false);
    expect(document.getElementById('startflaeche')).toBeNull();
    expect(() => {
      hideStartSurface();
    }).not.toThrow();
  });
});
