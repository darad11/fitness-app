// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideStartSurface, START_FADE_MS, START_MIN_MS } from './startSurface';

/** Startfläche aus index.html (D-325): sichtbar nur in der installierten App, wie dort im Stil. */
function mountSurface(display = 'block') {
  const surface = document.createElement('div');
  surface.id = 'startflaeche';
  surface.style.display = display;
  document.body.append(surface);
  return surface;
}

/**
 * Uhr ab Beginn der Navigation: `now` ms sind vergangen, das erste Bild kam bei `paintedAt`
 * (oder noch nicht). Zeitgeber, Bildwechsel und `performance.now` laufen auf der falschen Uhr.
 */
function setup({
  now,
  paintedAt,
  reduced = false,
}: {
  now: number;
  paintedAt: number | null;
  reduced?: boolean;
}) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'Date'] });
  const start = Date.now() - now;
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now() - start);
  const paint = { painted: paintedAt };
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(() =>
    paint.painted === null
      ? []
      : ([{ name: 'first-paint', startTime: paint.painted }] as unknown as PerformanceEntryList),
  );
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
  }));
  return paint;
}

const present = () => document.getElementById('startflaeche') !== null;

describe('Startfläche beim Kaltstart (D-325, D-337)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('schneller Start: bleibt ab dem ersten Bild 1,0 s, blendet dann in 300 ms aus', () => {
    // Erstes Bild bei 200 ms, „Heute“ steht bei 500 ms: Ausblenden ab 1.200 ms.
    setup({ now: 500, paintedAt: 200 });
    const surface = mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(699);
    expect(surface.classList.contains('weg')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(surface.classList.contains('weg')).toBe(true);
    expect(present()).toBe(true);
    surface.dispatchEvent(new Event('transitionend'));
    expect(present()).toBe(false);
    expect(START_MIN_MS).toBe(1000);
    expect(START_FADE_MS).toBe(300);
  });

  it('ohne transitionend nach dem Ausblenden trotzdem entfernt', () => {
    setup({ now: 500, paintedAt: 200 });
    mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(700 + START_FADE_MS + 99);
    expect(present()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(present()).toBe(false);
  });

  it('langsamer Start: bleibt, bis die erste Ansicht steht, und blendet dann sofort aus', () => {
    setup({ now: 1600, paintedAt: 150 });
    const surface = mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(0);
    expect(surface.classList.contains('weg')).toBe(true);
  });

  it('noch nichts gezeichnet: zählt ab dem nächsten Bild', () => {
    const paint = setup({ now: 80, paintedAt: null });
    const surface = mountSurface();
    hideStartSurface();
    // Das erste Bild kommt mit dem nächsten Bildwechsel.
    paint.painted = 96;
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(0);
    // Ab dem ersten Bild (96 ms) eine volle Sekunde.
    vi.advanceTimersByTime(START_MIN_MS - 1);
    expect(surface.classList.contains('weg')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(surface.classList.contains('weg')).toBe(true);
  });

  it('„Bewegung reduzieren“: ohne Ausblenden, aber erst nach der Mindestzeit', () => {
    setup({ now: 300, paintedAt: 100, reduced: true });
    const surface = mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(799);
    expect(present()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(present()).toBe(false);
    expect(surface.classList.contains('weg')).toBe(false);
  });

  it('im Browser-Tab (unsichtbar) sofort weg; ein zweiter Aufruf bewirkt nichts', () => {
    setup({ now: 300, paintedAt: 100 });
    const surface = mountSurface('none');
    hideStartSurface();
    expect(surface.classList.contains('weg')).toBe(false);
    expect(present()).toBe(false);
    expect(() => {
      hideStartSurface();
    }).not.toThrow();
  });

  it('nur einmal: ein zweiter Aufruf (etwa die Fehleransicht) startet keine zweite Wartezeit', () => {
    setup({ now: 500, paintedAt: 200 });
    const surface = mountSurface();
    hideStartSurface();
    vi.advanceTimersByTime(400);
    hideStartSurface();
    vi.advanceTimersByTime(300);
    expect(surface.classList.contains('weg')).toBe(true);
  });
});
