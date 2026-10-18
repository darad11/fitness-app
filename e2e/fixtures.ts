import { test as base, expect, type Page } from '@playwright/test';

/**
 * Jeder Test schlägt fehl, wenn die Seite Konsolenfehler oder unbehandelte Ausnahmen meldet.
 * So fallen auch Verstöße gegen die Content Security Policy auf.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'Konsolenfehler im Browser').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Hauptnavigation; je nach Breite Tab-Leiste oder Seitenleiste (die andere ist ausgeblendet). */
export function mainNav(page: Page) {
  return page.getByRole('navigation', { name: 'Hauptnavigation' });
}

/** Öffnet eine Seite und wartet, bis sie fertig geladen ist: Überschrift da, kein Platzhalter mehr. */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

export async function chooseTheme(page: Page, label: 'Hell' | 'Dunkel' | 'System') {
  await openPage(page, '/mehr/einstellungen');
  const radio = page.getByRole('radio', { name: label });
  await expect(radio).toBeEnabled();
  await page.getByText(label, { exact: true }).click();
  await expect(radio).toBeChecked();
}

/** Alle verfügbaren Seiten; geprüft werden Offline-Start, Netzwerk und Barrierefreiheit. */
export const APP_PAGES = [
  '/heute',
  '/training',
  '/training/programme',
  '/training/vorlagen/full_body_ab',
  '/uebungen',
  '/mehr',
  '/mehr/einstellungen',
  '/mehr/daten',
  '/mehr/installieren',
  '/mehr/ueber',
];
