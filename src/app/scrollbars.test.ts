import { describe, expect, it } from 'vitest';
import tokens from '@/shared/ui/tokens.css?raw';
import styles from './styles.css?raw';

/**
 * Scroll-Balken (D-392): am Touch-Gerät in keinem Bereich zu sehen, am Computer dünn und dunkel
 * in den Farben der App. Nur das Aussehen; `overflow` bleibt, wie es ist.
 */

/** Ohne Leerzeichen und mit einheitlichen Anführungszeichen. */
const squash = (text: string) => text.replace(/\s+/g, '').replaceAll("'", '"');
const css = squash(styles);

describe('Scroll-Balken (D-392)', () => {
  it('am Computer überall dünn, Griff und Spur aus den Tokens', () => {
    expect(css).toContain(
      '*{scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb)var(--scrollbar-track);}',
    );
  });

  it('am Touch-Gerät in keinem Bereich, auch nicht über das Webkit-Pseudoelement', () => {
    const touch = css.indexOf('@media(pointer:coarse){*{scrollbar-width:none;}');
    expect(touch).toBeGreaterThan(0);
    expect(css.indexOf('*::-webkit-scrollbar{display:none;}', touch)).toBeGreaterThan(touch);
    // Später als die Regel für den Computer, damit sie am Touch-Gerät gewinnt.
    expect(touch).toBeGreaterThan(css.indexOf('*{scrollbar-width:thin;'));
  });

  it('Safari ohne scrollbar-color: dieselben Farben über das Webkit-Pseudoelement, nur mit Maus', () => {
    const fallback = css.indexOf('@supportsnot(scrollbar-color:auto){@media(pointer:fine){');
    expect(fallback).toBeGreaterThan(0);
    const block = css.slice(fallback, css.indexOf('}}}', fallback));
    expect(block).toContain('::-webkit-scrollbar-thumb{');
    expect(block).toContain('background:var(--scrollbar-thumb)');
  });

  it('die Tokens gibt es hell und dunkel; die Spur ist durchsichtig', () => {
    const blocks = squash(tokens).split(':root[data-theme="light"]{');
    for (const block of blocks) {
      expect(block).toMatch(/--scrollbar-thumb:#[0-9a-f]{6};/);
      expect(block).toContain('--scrollbar-track:#00000000;');
    }
  });

  it('kein Bereich verliert sein Scrollen: keine Regel setzt dafür overflow', () => {
    const start = css.indexOf('*{scrollbar-width:thin;');
    const end = css.indexOf('*::-webkit-scrollbar{display:none;}') + 40;
    expect(css.slice(start, end)).not.toContain('overflow');
  });
});
