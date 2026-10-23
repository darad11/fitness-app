import { describe, expect, it } from 'vitest';
import styles from './styles.css?raw';

/**
 * Klassen ohne Wirkung (F5, D-325): `styles.css` schaltet die Standard-Radien und -Schatten von
 * Tailwind ab (`--radius-*: initial`, `--shadow-*: initial`). Eine Klasse wie `rounded-md` erzeugt
 * dann kein CSS, ohne Fehler beim Bauen; so blieben die Felder im Kalender der Tagesaufgaben
 * eckig. Dieser Test findet jede Radius- und Schattenklasse, deren Token es nicht gibt.
 */

const SOURCES = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Schlüssel eines Namensraums aus den `@theme`-Blöcken, z. B. `card` für `--radius-card`. */
function themeKeys(namespace: string): Set<string> {
  return new Set(
    [...styles.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+):`, 'g'))].map((m) => m[1] ?? ''),
  );
}

/** Werte, die Tailwind ohne Token kennt. */
const STATIC: Record<string, Set<string>> = {
  radius: new Set(['full', 'none']),
  shadow: new Set(['none']),
};

/** Klassen eines Namensraums in allen Quellen, mit Fundstelle; ohne eckige Klammern. */
function used(pattern: RegExp): { file: string; key: string }[] {
  const found: { file: string; key: string }[] = [];
  for (const [file, source] of Object.entries(SOURCES)) {
    for (const match of source.matchAll(pattern)) found.push({ file, key: match[1] ?? '' });
  }
  return found;
}

describe('Radius- und Schattenklassen haben ein Token (D-325)', () => {
  const radius = themeKeys('radius');
  const shadow = themeKeys('shadow');

  it('liest die Tokens aus styles.css', () => {
    expect(radius).toContain('card');
    expect(radius).toContain('mark');
    expect(shadow).toContain('card');
  });

  it('jede rounded-Klasse nennt einen vorhandenen Radius', () => {
    const classes = used(
      /(?<![\w-])rounded-(?:(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-)?([a-z][a-z0-9-]*)/g,
    ).filter(({ key }) => !/^(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)$/.test(key));
    expect(classes.length).toBeGreaterThan(50);
    const missing = classes.filter(
      ({ key }) => !radius.has(key) && !(STATIC.radius ?? new Set()).has(key),
    );
    expect(missing).toEqual([]);
  });

  it('jede shadow-Klasse nennt einen vorhandenen Schatten', () => {
    const classes = used(/(?<![\w-])shadow-([a-z][a-z0-9-]*)/g);
    expect(classes.length).toBeGreaterThan(10);
    const missing = classes.filter(
      ({ key }) => !shadow.has(key) && !(STATIC.shadow ?? new Set()).has(key),
    );
    expect(missing).toEqual([]);
  });
});
