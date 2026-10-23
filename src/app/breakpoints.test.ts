import { describe, expect, it } from 'vitest';
import { BREAKPOINTS, minWidth } from '@/shared/ui';
import css from './styles.css?raw';

/** Breakpoints an einer Stelle (D-313): Code und CSS nennen dieselben Werte. */
describe('Breakpoints', () => {
  const theme = Object.fromEntries(
    [...css.matchAll(/--breakpoint-(\w+):\s*([\d.]+rem);/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
  );

  it('stimmen zwischen styles.css und breakpoints.ts überein', () => {
    expect(theme).toEqual(BREAKPOINTS);
  });

  it('baut Media-Abfragen aus den Werten', () => {
    expect(minWidth('md')).toBe('(min-width: 48rem)');
    expect(minWidth('lg')).toBe('(min-width: 64rem)');
  });

  it('nutzt im CSS keine festen Breakpoints neben dem Theme', () => {
    const outsideTheme = css.slice(css.indexOf('@theme inline'));
    expect(outsideTheme).not.toMatch(/@media\s*\((min-|max-)?width/);
  });
});
