/**
 * Automatische Kontrastprüfung der Farbtokens (AK-UX-04, design-system.md Abschnitte 2 und 14).
 * Liest tokens.css direkt, damit Datei und Prüfung nicht auseinanderlaufen.
 */
import { describe, expect, it } from 'vitest';
import css from './tokens.css?raw';
import { THEME_BACKGROUND } from './theme';

type Tokens = Record<string, string>;

function parseBlock(source: string, opener: string): Tokens {
  const start = source.indexOf(opener);
  if (start < 0) throw new Error(`Block fehlt: ${opener}`);
  const body = source.slice(start + opener.length, source.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
      m[1] ?? '',
      (m[2] ?? '').toLowerCase(),
    ]),
  );
}

const light = parseBlock(css, ':root {');
const darkMedia = parseBlock(css, ":root:not([data-theme='light']) {");
const dark = parseBlock(css, ":root[data-theme='dark'] {");

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function token(tokens: Tokens, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Token fehlt: --${name}`);
  return value;
}

const SURFACES = ['bg', 'surface', 'surface-2'];
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

  describe.each(MODES)('Modus %s', (_mode, tokens) => {
    it.each(TEXT_ON_SURFACES.flatMap((fg) => SURFACES.map((bg) => [fg, bg])))(
      'Text --%s auf --%s erreicht 4,5:1',
      (fg, bg) => {
        expect(contrast(token(tokens, fg), token(tokens, bg))).toBeGreaterThanOrEqual(4.5);
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
      expect(contrast(token(tokens, fg), token(tokens, bg))).toBeGreaterThanOrEqual(4.5);
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
      ['login-focus', 'login-bg-1'],
    ])('Bedienelement oder Linie --%s auf --%s erreicht 3:1', (fg, bg) => {
      expect(contrast(token(tokens, fg), token(tokens, bg))).toBeGreaterThanOrEqual(3);
    });
  });

  it('dokumentierte Ausnahme: nur Aqua, Gelb und Magenta liegen hell unter 3:1', () => {
    const below = Array.from({ length: 8 }, (_, i) => `data-${String(i + 1)}`).filter(
      (name) => contrast(token(light, name), token(light, 'surface')) < 3,
    );
    expect(below).toEqual(['data-3', 'data-4', 'data-5']);
  });

  it('alle Datenreihen erreichen dunkel 3:1', () => {
    for (let i = 1; i <= 8; i++) {
      expect(
        contrast(token(dark, `data-${String(i)}`), token(dark, 'surface')),
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
