/**
 * Darstellung hell, dunkel oder nach System (design-system.md Abschnitt 2.3).
 * Die Wahl liegt in den Einstellungen (Datenbank); eine Kopie in localStorage erlaubt
 * `public/theme-init.js`, das Farbschema vor dem ersten Bild zu setzen.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'fitness.theme';

/** Seitenhintergrund `--bg` je Modus; für `<meta name="theme-color">`. Test: tokens.test.ts */
export const THEME_BACKGROUND: Record<EffectiveTheme, string> = {
  light: '#e8eef7',
  dark: '#151b2b',
};

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): EffectiveTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function applyTheme(
  preference: ThemePreference,
  prefersDark: boolean = systemPrefersDark(),
): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
  const effective = resolveTheme(preference, prefersDark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_BACKGROUND[effective]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ohne localStorage fehlt nur die Vorbelegung beim nächsten Start.
  }
}
