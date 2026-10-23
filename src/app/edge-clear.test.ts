import { describe, expect, it } from 'vitest';
import styles from './styles.css?raw';

/**
 * Abstand unter der Unschärfe von iOS am oberen Rand (F6 Abschnitt 1, D-332). iOS legt über die
 * obersten rund 40 pt eine weiche Unschärfe, die keine Einstellung der Seite abschaltet; das Logo
 * der Kopfzeile lag 14 pt unter dem Rand und damit darin. Chromium kennt die Bedingung
 * `-webkit-touch-callout` nicht, deshalb prüft dieser Test die Regel selbst und die E2E-Prüfung
 * (`e2e/header-logo.spec.ts`) die Wirkung des Tokens.
 */

const SOURCES = import.meta.glob<string>(
  [
    './layout/AppLayout.tsx',
    './layout/Sidebar.tsx',
    '../modules/sync/ui/LoginScreen.tsx',
    '../modules/training/ui/player/SessionPage.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
);

/** Inhalt des Blocks, der mit `head` beginnt (bis zur passenden schließenden Klammer). */
function block(css: string, head: string): string | null {
  const start = css.indexOf(head);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return null;
}

describe('Abstand unter der Unschärfe von iOS (D-332)', () => {
  it('ist sonst 0 und auf iPhone und iPad (hochkant oder hoch genug) 2 rem', () => {
    expect(styles).toMatch(/--spacing-edge-clear:\s*0rem;/);
    const ios = block(styles, '@supports (-webkit-touch-callout: none) {\n    @media');
    expect(ios, 'Regel für WebKit auf iPhone und iPad').not.toBeNull();
    const tall = block(ios ?? '', '@media (min-height: 31.25rem)');
    expect(tall, 'nicht am iPhone quer').not.toBeNull();
    expect(tall).toMatch(/:root\s*\{\s*--spacing-edge-clear:\s*2rem;\s*\}/);
  });

  it('gilt für alles, was oben ruht: Kopfzeile, Seitenleiste, Anmeldung, Kopf im Training', () => {
    const uses = Object.fromEntries(
      Object.entries(SOURCES).map(([file, source]) => [
        file.split('/').pop() ?? file,
        source.includes('edge-clear'),
      ]),
    );
    expect(uses).toEqual({
      'AppLayout.tsx': true,
      'Sidebar.tsx': true,
      'LoginScreen.tsx': true,
      'SessionPage.tsx': true,
    });
    expect(block(styles, '.login-body {')).toContain('var(--spacing-edge-clear)');
  });
});
