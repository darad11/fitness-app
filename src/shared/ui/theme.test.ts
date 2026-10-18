// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, resolveTheme, THEME_STORAGE_KEY } from './theme';

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#fafaf9" />';
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.clear();
});

const metaColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

describe('Darstellung', () => {
  it('setzt Dunkel ausdrücklich, auch gegen die Systemeinstellung', () => {
    applyTheme('dark', false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(metaColor()).toBe('#0f1115');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('setzt Hell ausdrücklich, auch wenn das System dunkel ist', () => {
    applyTheme('light', true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(metaColor()).toBe('#fafaf9');
  });

  it('folgt bei „System" dem Gerät', () => {
    applyTheme('system', true);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(metaColor()).toBe('#0f1115');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
