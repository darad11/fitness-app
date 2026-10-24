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

/**
 * Zählt die geladenen Dokumente (erster Aufruf und jedes Neuladen) über ihre Route: Ein Dokument
 * fragt seine Module erst an, nachdem die Route es durchgelassen hat. Gezählt über das Ereignis
 * `request`, schlug der erste Test in WebKit fehl, obwohl der Wächter neu lud (CI zu D-343):
 * vermutlich kam das Ereignis des zweiten Dokuments erst nach dessen Modul-Anfrage an.
 */
async function countDocuments(page: Page, log: string[]): Promise<() => number> {
  let documents = 0;
  await page.route(
    (url) => url.pathname === '/heute',
    async (route) => {
      if (route.request().resourceType() === 'document') {
        documents += 1;
        log.push(`Dokument ${String(documents)}`);
      }
      await route.continue();
    },
  );
  return () => documents;
}

/** Bricht die Anfragen des Moduls `ui` ab, solange `blocked()` gilt, und schreibt mit. */
async function blockUi(page: Page, log: string[], blocked: () => boolean) {
  await page.route('**/assets/ui-*.js', async (route) => {
    const abort = blocked();
    log.push(`ui ${abort ? 'abgebrochen' : 'geladen'}`);
    if (abort) await route.abort();
    else await route.continue();
  });
}

test('Bricht ein Teil beim Start ab, lädt die App einmal neu und startet', async ({
  page,
  consoleErrors,
}) => {
  const log: string[] = [];
  const documents = await countDocuments(page, log);
  // Beim ersten Dokument brechen Vorladen und Laden des Moduls ab, danach nicht mehr.
  await blockUi(page, log, () => documents() === 1);
  await page.goto('/heute');
  await expect(
    page.getByRole('heading', { level: 1, name: /^Heute/ }),
    `App gestartet (${log.join(', ')})`,
  ).toBeVisible();
  expect(documents(), log.join(', ')).toBe(2);
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !EXPECTED.test(e)));
});

test('Bricht der Teil auch danach ab: Hinweis mit „Neu laden“, kein zweites Neuladen', async ({
  page,
  consoleErrors,
}) => {
  const log: string[] = [];
  const documents = await countDocuments(page, log);
  let blocked = true;
  await blockUi(page, log, () => blocked);
  await page.goto('/heute');
  const hint = page.getByRole('alert');
  await expect(hint.getByRole('heading', { name: 'FORM ließ sich nicht starten' })).toBeVisible();
  await expect(hint).toContainText('Lade die App neu. Deine Daten bleiben erhalten.');
  // Kein weiteres Neuladen von selbst (Schleifenschutz).
  await page.waitForTimeout(1000);
  expect(documents(), log.join(', ')).toBe(2);
  await expect(page.locator('#startflaeche')).toHaveCount(0);

  // Der Knopf lädt neu, auch innerhalb des Schleifenschutzes; dann startet die App.
  blocked = false;
  await hint.getByRole('button', { name: 'Neu laden' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Heute/ })).toBeVisible();
  expect(documents(), log.join(', ')).toBe(3);
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !EXPECTED.test(e)));
});
