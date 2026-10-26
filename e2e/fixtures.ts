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

/**
 * Waagrechter Überlauf der Seite in px, 0 heißt keiner. Die Seite scrollt im Rahmen der App
 * (`#seite`, D-384), der waagrecht abschneidet; gemessen werden der Rahmen und das Dokument. Am
 * Dokument allein wäre der Überlauf seit dem Rahmen immer 0.
 */
export function pageOverflowX(page: Page): Promise<number> {
  return page.evaluate(() => {
    const frame = document.getElementById('seite');
    const root = document.documentElement;
    return Math.max(
      frame ? frame.scrollWidth - frame.clientWidth : 0,
      root.scrollWidth - root.clientWidth,
    );
  });
}

/** Alle verfügbaren Seiten; geprüft werden Offline-Start, Netzwerk und Barrierefreiheit. */
export const APP_PAGES = [
  '/heute',
  '/heute/aufgaben',
  '/training',
  '/training/programme',
  '/training/nachtragen',
  '/training/vorlagen/full_body_ab',
  '/training/vorlagen/winterprogramm-2026',
  '/uebungen',
  '/ernaehrung',
  '/ernaehrung/hinzufuegen',
  '/ernaehrung/lebensmittel',
  '/ernaehrung/lebensmittel/neu',
  '/ernaehrung/ziele',
  '/ernaehrung/rezepte',
  '/ernaehrung/rezepte/neu',
  '/ernaehrung/vorlagen',
  '/ernaehrung/einkaufsliste',
  '/ernaehrung/wasser',
  '/fortschritt',
  '/fortschritt/gewicht',
  '/mehr',
  '/mehr/profil',
  '/mehr/einstellungen',
  '/mehr/daten',
  '/mehr/installieren',
  '/mehr/synchronisierung',
  '/mehr/schritte',
  '/mehr/ueber',
];
