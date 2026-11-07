import { describe, expect, it } from 'vitest';
import script from '../../../public/startflaeche.js?raw';
import {
  applyScreenOffset,
  installScreenCenter,
  measureDialogOffset,
  measureScreenOffset,
} from './screenCenter';

/**
 * Mitte des ganzen Bildschirms für Vollbildansichten (D-495) mit der Rechnung der Startfläche
 * (`public/startflaeche.js`, D-393, D-394) und den Messwerten des iPhone Duo: Fenster zugeklappt
 * hoch 382 × 678 (Bildschirm 466 × 678), aufgeklappt quer 867 × 669 beim Start und 867 × 587,
 * sobald der Streifen oben dazukommt (951 × 669). iOS meldet `screen.*` hochkant 466 × 678.
 */

type Listener = () => void;

interface FakeOptions {
  width: number;
  height: number;
  screen?: { width: number; height: number };
  /** `screen.orientation.type`. */
  type?: string;
  /** Ohne das Skript der Startfläche. */
  withoutScript?: boolean;
}

/** Nachgestellte Seite: so viel Fenster, wie Skript und Modul brauchen. */
function fakeWindow(options: FakeOptions) {
  const listeners = new Map<string, Set<Listener>>();
  const styles = new Map<string, string>();
  const frames: Listener[] = [];
  const on = (name: string, fn: Listener) => {
    const set = listeners.get(name) ?? new Set<Listener>();
    set.add(fn);
    listeners.set(name, set);
  };
  const off = (name: string, fn: Listener) => listeners.get(name)?.delete(fn);
  const root = {
    clientWidth: options.width,
    clientHeight: options.height,
    style: {
      setProperty: (name: string, value: string) => styles.set(name, value),
    },
    setAttribute: () => undefined,
    removeAttribute: () => undefined,
  };
  const orientation = {
    type:
      options.type ?? (options.width > options.height ? 'landscape-primary' : 'portrait-primary'),
    angle: options.width > options.height ? 90 : 0,
    addEventListener: (_: string, fn: Listener) => {
      on('orientation', fn);
    },
    removeEventListener: (_: string, fn: Listener) => off('orientation', fn),
  };
  const doc = {
    documentElement: root,
    readyState: 'complete',
    visibilityState: 'visible',
    getElementById: () => null,
    addEventListener: on,
    removeEventListener: off,
  };
  const win = {
    innerWidth: options.width,
    innerHeight: options.height,
    screen: {
      width: options.screen?.width ?? 466,
      height: options.screen?.height ?? 678,
      orientation,
    },
    document: doc,
    performance: { now: () => 0 },
    setTimeout: () => 1,
    clearTimeout: () => undefined,
    requestAnimationFrame: (fn: Listener) => {
      frames.push(fn);
      return frames.length;
    },
    cancelAnimationFrame: () => undefined,
    addEventListener: on,
    removeEventListener: off,
    visualViewport: null,
  } as Record<string, unknown>;
  if (!options.withoutScript) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- nur im Test: die Datei aus public/
    const run = new Function('window', 'document', script) as (w: unknown, d: unknown) => void;
    run(win, doc);
  }
  return {
    win: win as unknown as Window,
    styles,
    resize(width: number, height: number, type?: string) {
      root.clientWidth = width;
      root.clientHeight = height;
      win.innerWidth = width;
      win.innerHeight = height;
      orientation.type = type ?? (width > height ? 'landscape-primary' : 'portrait-primary');
      for (const fn of listeners.get('resize') ?? []) fn();
    },
    frame() {
      for (const fn of frames.splice(0)) fn();
    },
  };
}

describe('Mitte des Bildschirms (D-495)', () => {
  it('Duo aufgeklappt quer: 42 pt rechts der Fenstermitte, mit Streifen oben 41 pt höher', () => {
    expect(measureScreenOffset(fakeWindow({ width: 867, height: 669 }).win)).toEqual({
      dx: 42,
      dy: 0,
    });
    expect(measureScreenOffset(fakeWindow({ width: 867, height: 587 }).win)).toEqual({
      dx: 42,
      dy: -41,
    });
  });

  it('Duo zugeklappt hoch: 42 pt rechts, wie die Startfläche', () => {
    expect(measureScreenOffset(fakeWindow({ width: 382, height: 678 }).win)).toEqual({
      dx: 42,
      dy: 0,
    });
  });

  it('kein Duo oder Fenster so groß wie der Bildschirm: keine Verschiebung', () => {
    const iphone = { width: 390, height: 844, screen: { width: 390, height: 844 } };
    expect(measureScreenOffset(fakeWindow(iphone).win)).toEqual({ dx: 0, dy: 0 });
    const desktop = { width: 1280, height: 800, screen: { width: 1440, height: 900 } };
    expect(measureScreenOffset(fakeWindow(desktop).win)).toEqual({ dx: 0, dy: 0 });
  });

  it('Widerspruch (Fenster hoch, Ausrichtung quer) zählt nicht; ohne Skript keine Verschiebung', () => {
    const wrong = fakeWindow({ width: 466, height: 669, type: 'landscape-primary' });
    expect(measureScreenOffset(wrong.win)).toBeNull();
    const without = fakeWindow({ width: 867, height: 669, withoutScript: true });
    expect(measureScreenOffset(without.win)).toEqual({ dx: 0, dy: 0 });
  });

  it('setzt die CSS-Variablen; ein Widerspruch lässt die letzten stimmigen stehen', () => {
    const page = fakeWindow({ width: 867, height: 587 });
    applyScreenOffset(page.win);
    expect(page.styles.get('--bildschirm-dx')).toBe('42px');
    expect(page.styles.get('--bildschirm-dy')).toBe('-41px');
    page.resize(466, 669, 'landscape-primary');
    applyScreenOffset(page.win);
    expect(page.styles.get('--bildschirm-dx')).toBe('42px');
  });

  it('Dialoge (E3, D-525): zugeklappt mittig im Fenster, aufgeklappt in der Mitte des Bildschirms', () => {
    // Zugeklappt hoch und quer (Safari quer 594 pt breit): keine Verschiebung für Dialoge.
    expect(measureDialogOffset(fakeWindow({ width: 382, height: 678 }).win)).toEqual({
      dx: 0,
      dy: 0,
    });
    expect(measureDialogOffset(fakeWindow({ width: 594, height: 466 }).win)).toEqual({
      dx: 0,
      dy: 0,
    });
    // Aufgeklappt quer wie die Bildschirmmitte.
    expect(measureDialogOffset(fakeWindow({ width: 867, height: 587 }).win)).toEqual({
      dx: 42,
      dy: -41,
    });
    const folded = fakeWindow({ width: 382, height: 678 });
    applyScreenOffset(folded.win);
    expect(folded.styles.get('--bildschirm-dx')).toBe('42px');
    expect(folded.styles.get('--dialog-dx')).toBe('0px');
    expect(folded.styles.get('--dialog-dy')).toBe('0px');
    folded.resize(867, 587);
    applyScreenOffset(folded.win);
    expect(folded.styles.get('--dialog-dx')).toBe('42px');
    expect(folded.styles.get('--dialog-dy')).toBe('-41px');
    // Kein Duo: wie bisher keine Verschiebung.
    const iphone = { width: 390, height: 844, screen: { width: 390, height: 844 } };
    expect(measureDialogOffset(fakeWindow(iphone).win)).toEqual({ dx: 0, dy: 0 });
  });

  it('misst nach jeder Größenänderung neu, sofort und im nächsten Bild', () => {
    const page = fakeWindow({ width: 382, height: 678 });
    const stop = installScreenCenter(page.win);
    expect(page.styles.get('--bildschirm-dx')).toBe('42px');
    page.resize(867, 587);
    expect(page.styles.get('--bildschirm-dy')).toBe('-41px');
    page.resize(867, 669);
    page.frame();
    expect(page.styles.get('--bildschirm-dy')).toBe('0px');
    stop();
    page.resize(867, 587);
    expect(page.styles.get('--bildschirm-dy')).toBe('0px');
  });
});
