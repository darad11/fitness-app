import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Startwächter (E-16, D-343): Bricht beim Start eine Modul-Anfrage ab, startet die App nicht und
 * meldet keinen Fehler. `public/theme-init.js` lädt dann einmal neu; klappt es wieder nicht,
 * erscheint ein Hinweis mit „Neu laden“ statt einer leeren Seite. Ohne Service Worker, damit
 * `page.route` die Anfragen sieht (unter einem Service Worker gehen sie an ihm vorbei).
 */
test.use({ serviceWorkers: 'block' });

/** Abgebrochene Anfragen melden die Browser als Konsolenfehler; hier sind sie gewollt. */
const EXPECTED = /Failed to load resource|net::ERR_FAILED|Importing a module script failed/;

/** Zählt die geladenen Dokumente (erster Aufruf und jedes Neuladen). */
function countDocuments(page: Page): () => number {
  let documents = 0;
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documents += 1;
  });
  return () => documents;
}

test('Bricht ein Teil beim Start ab, lädt die App einmal neu und startet', async ({
  page,
  consoleErrors,
}) => {
  const documents = countDocuments(page);
  // Beim ersten Dokument brechen Vorladen und Laden des Moduls ab, danach nicht mehr.
  await page.route('**/assets/ui-*.js', async (route) => {
    if (documents() === 1) await route.abort();
    else await route.continue();
  });
  await page.goto('/heute');
  await expect(page.getByRole('heading', { level: 1, name: /^Heute/ })).toBeVisible();
  expect(documents()).toBe(2);
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !EXPECTED.test(e)));
});

test('Bricht der Teil auch danach ab: Hinweis mit „Neu laden“, kein zweites Neuladen', async ({
  page,
  consoleErrors,
}) => {
  const documents = countDocuments(page);
  let blocked = true;
  await page.route('**/assets/ui-*.js', async (route) => {
    if (blocked) await route.abort();
    else await route.continue();
  });
  await page.goto('/heute');
  const hint = page.getByRole('alert');
  await expect(hint.getByRole('heading', { name: 'FORM ließ sich nicht starten' })).toBeVisible();
  await expect(hint).toContainText('Lade die App neu. Deine Daten bleiben erhalten.');
  // Kein weiteres Neuladen von selbst (Schleifenschutz).
  await page.waitForTimeout(1000);
  expect(documents()).toBe(2);
  await expect(page.locator('#startflaeche')).toHaveCount(0);

  // Der Knopf lädt neu, auch innerhalb des Schleifenschutzes; dann startet die App.
  blocked = false;
  await hint.getByRole('button', { name: 'Neu laden' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Heute/ })).toBeVisible();
  expect(documents()).toBe(3);
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !EXPECTED.test(e)));
});
