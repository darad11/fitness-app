/**
 * Automatische Kontrastprüfung der Farbtokens (AK-UX-04, design-system.md Abschnitte 2 und 14).
 * Liest tokens.css direkt, damit Datei und Prüfung nicht auseinanderlaufen.
 *
 * Glas-Look (D-272): Flächen sind durchscheinend. Geprüft wird deshalb jede sichtbare Mischfarbe:
 * die Seite an Verlauf und Lichtflecken, Glas darauf und Glas auf Glas. Ein Paar besteht nur, wenn
 * es überall den Kontrast erreicht.
 */
import { describe, expect, it } from 'vitest';
import css from './tokens.css?raw';
import { THEME_BACKGROUND } from './theme';

type Tokens = Record<string, string>;
type Rgb = [number, number, number];

function parseBlock(source: string, opener: string): Tokens {
  const start = source.indexOf(opener);
  if (start < 0) throw new Error(`Block fehlt: ${opener}`);
  const body = source.slice(start + opener.length, source.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*;/g)].map((m) => [
      m[1] ?? '',
      (m[2] ?? '').toLowerCase(),
    ]),
  );
}

const light = parseBlock(css, ':root {');
const darkMedia = parseBlock(css, ":root:not([data-theme='light']) {");
const dark = parseBlock(css, ":root[data-theme='dark'] {");

function rgba(hex: string): [Rgb, number] {
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return [[n(1), n(3), n(5)], hex.length === 9 ? n(7) / 255 : 1];
}

/** Farbe mit Deckkraft über einer deckenden Farbe. */
function over(top: string, below: Rgb): Rgb {
  const [color, alpha] = rgba(top);
  return color.map((c, i) => c * alpha + (below[i] ?? 0) * (1 - alpha)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function token(tokens: Tokens, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Token fehlt: --${name}`);
  return value;
}

const opaque = (hex: string): Rgb => rgba(hex)[0];

/** Sichtbare Seitenfarben: Verlauf und jeder Lichtfleck in voller Stärke darüber. */
function pagePoints(tokens: Tokens): Rgb[] {
  const base = ['bg-top', 'bg', 'bg-bottom'].map((name) => opaque(token(tokens, name)));
  const glows = ['glow-1', 'glow-2', 'glow-3'].flatMap((glow) =>
    base.map((below) => over(token(tokens, glow), below)),
  );
  return [...base, ...glows];
}

/** Alle Mischfarben, auf denen eine Fläche liegen kann. */
function backgrounds(tokens: Tokens, name: string): Rgb[] {
  const page = pagePoints(tokens);
  const surface = page.map((p) => over(token(tokens, 'surface'), p));
  if (name === 'bg') return page;
  if (name === 'surface') return surface;
  if (name === 'surface-2') {
    return [...page, ...surface].map((p) => over(token(tokens, 'surface-2'), p));
  }
  const value = token(tokens, name);
  if (rgba(value)[1] === 1) return [opaque(value)];
  // Getönte Flächen (z. B. --accent-soft) liegen auf der Seite oder auf Glas.
  const surface2 = surface.map((p) => over(token(tokens, 'surface-2'), p));
  return [...page, ...surface, ...surface2].map((p) => over(value, p));
}

/** Kleinster Kontrast einer Vordergrundfarbe über allen Mischfarben des Hintergrunds. */
function minContrast(tokens: Tokens, fg: string, bg: string): number {
  return Math.min(
    ...backgrounds(tokens, bg).map((below) => ratio(over(token(tokens, fg), below), below)),
  );
}

const SURFACES = ['bg', 'surface', 'surface-2', 'panel'];
const TEXT_ON_SURFACES = ['fg', 'fg-muted', 'accent-ink', 'success', 'warning', 'danger'];
const MODES: [string, Tokens][] = [
  ['hell', light],
  ['dunkel', dark],
];

describe('Farbtokens', () => {
  it('definiert den dunklen Modus in beiden Blöcken gleich', () => {
    expect(darkMedia).toEqual(dark);
  });

  it('definiert hell und dunkel dieselben Tokens', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it('nutzt für theme-color die Hintergrundfarben', () => {
    expect(THEME_BACKGROUND.light).toBe(token(light, 'bg'));
    expect(THEME_BACKGROUND.dark).toBe(token(dark, 'bg'));
  });

  it('mischt durchscheinende Farben richtig', () => {
    expect(over('#ffffff80', [0, 0, 0]).map(Math.round)).toEqual([128, 128, 128]);
    expect(over('#256abf', [0, 0, 0])).toEqual([37, 106, 191]);
  });

  describe.each(MODES)('Modus %s', (_mode, tokens) => {
    it.each(TEXT_ON_SURFACES.flatMap((fg) => SURFACES.map((bg) => [fg, bg])))(
      'Text --%s auf --%s erreicht 4,5:1',
      (fg, bg) => {
        expect(minContrast(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it.each([
      ['accent-fg', 'accent'],
      ['accent-fg', 'accent-hover'],
      ['chart-axis', 'surface'],
      ['chart-total', 'surface'],
      ['bg', 'warning'],
      ['accent-ink', 'accent-soft'],
      ['success', 'success-soft'],
      ['warning', 'warning-soft'],
      ['danger', 'danger-soft'],
      ['on-ink', 'ink'],
      ['on-ink', 'ink-2'],
      ['on-ink-muted', 'ink'],
      ['on-ink-muted', 'ink-2'],
      ...['login-bg-1', 'login-bg-2', 'login-bg-3'].flatMap((bg) => [
        ['login-fg', bg],
        ['login-fg-muted', bg],
        ['login-error', bg],
      ]),
      ['login-fg', 'login-accent'],
      ['login-fg', 'login-accent-2'],
    ])('Text --%s auf --%s erreicht 4,5:1', (fg, bg) => {
      expect(minContrast(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it.each([
      ...SURFACES.map((bg) => ['border-input', bg]),
      ...SURFACES.map((bg) => ['focus', bg]),
      ...SURFACES.map((bg) => ['accent', bg]),
      ['chart-point', 'surface'],
      ['data-1', 'surface'],
      ['accent', 'meter-track'],
      ['accent', 'ink'],
      ['on-ink', 'ink'],
      ['on-ink', 'ink-2'],
      ['login-focus', 'login-bg-1'],
    ])('Bedienelement oder Linie --%s auf --%s erreicht 3:1', (fg, bg) => {
      expect(minContrast(tokens, fg, bg)).toBeGreaterThanOrEqual(3);
    });
  });

  it('dokumentierte Ausnahme: nur Aqua, Gelb und Magenta liegen hell unter 3:1', () => {
    const below = Array.from({ length: 8 }, (_, i) => `data-${String(i + 1)}`).filter(
      (name) => minContrast(light, name, 'surface') < 3,
    );
    expect(below).toEqual(['data-3', 'data-4', 'data-5']);
  });

  it('alle Datenreihen erreichen dunkel 3:1', () => {
    for (let i = 1; i <= 8; i++) {
      expect(minContrast(dark, `data-${String(i)}`, 'surface')).toBeGreaterThanOrEqual(3);
    }
  });
});
