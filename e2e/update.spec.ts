import type { BrowserContext, Page } from '@playwright/test';
import { APP_PAGES, expect, mainNav, test as base } from './fixtures';
import {
  BUILD_SHA,
  buildVersions,
  startUpdateServer,
  type UpdateServer,
  type Version,
} from './updateServer';

/**
 * Altes Gerät, neue Version, kein Netz (E-16, D-343): zwei echte Builds nacheinander und ein
 * Server, der wie Vercel ausliefert (Dateien des aktiven Builds, sonst `index.html`). Ein
 * „Deployment" schaltet auf die neue Version um; die gehashten Dateien der alten gibt es danach
 * nicht mehr. Gebaut wird einmal je Worker; die Tests laufen nacheinander im selben Worker.
 */
const test = base.extend<object, { server: UpdateServer }>({
  server: [
    // eslint-disable-next-line no-empty-pattern -- Playwright verlangt das Objektmuster.
    async ({}, use) => {
      await buildVersions();
      const server = await startUpdateServer('a');
      await use(server);
      await server.close();
    },
    { scope: 'worker', timeout: 300_000 },
  ],
});

test.describe.configure({ mode: 'serial' });

// Ein Projekt je Browser reicht; die Builds dauern. Geprüft wird vor dem Bauen.
// eslint-disable-next-line no-empty-pattern -- Playwright verlangt das Objektmuster.
test.beforeEach(({}, testInfo) => {
  test.skip(!['chromium-desktop', 'webkit-mobile'].includes(testInfo.project.name));
});

test.beforeEach(({ server }) => {
  server.deploy('a');
});

/** Fehlschläge beim Nachladen melden die Browser als Konsolenfehler; hier sind sie gewollt. */
const EXPECTED =
  /Failed to load module script|Failed to fetch dynamically imported module|Importing a module script failed|React Router caught the following error|Failed to load resource|MIME type/;

function dropExpected(errors: string[]) {
  errors.splice(0, errors.length, ...errors.filter((error) => !EXPECTED.test(error)));
}

async function waitForApp(page: Page, heading?: RegExp | string) {
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

async function open(page: Page, server: UpdateServer, path: string) {
  await page.goto(`${server.origin}${path}`);
  await waitForApp(page);
}

/** Der Service Worker ist aktiv und steuert diese Seite. */
async function waitForControl(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      message: 'Die Seite wird vom Service Worker übernommen',
    })
    .toBe(true);
}

/** Fragt nach einer neuen Version und wartet, bis sie geladen ist und wartet. */
async function findUpdate(page: Page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.waiting !== null && registration?.waiting !== undefined;
      }),
    )
    .toBe(true);
}

/** „Mehr › Über die App“ nennt die Build-Kennung der laufenden Version. */
async function expectVersion(page: Page, server: UpdateServer, version: Version) {
  await open(page, server, '/mehr/ueber');
  await expect(page.getByText(new RegExp(`^${BUILD_SHA[version]}`))).toBeVisible();
}

async function go(page: Page, name: string) {
  await mainNav(page).getByRole('link', { name, exact: true }).click();
  await waitForApp(page, name);
}

async function offline(context: BrowserContext) {
  await context.setOffline(true);
}

test.describe('mit Service Worker', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Service Worker und Offline werden in Chromium geprüft; Safari prüft T-IPH-M0 am Gerät.',
    );
  });

  test('Erster Start: Die Seite gehört sofort dem Service Worker, nachgeladene Bereiche kommen nach einem Deployment auch ohne Netz', async ({
    page,
    context,
    server,
  }) => {
    test.slow();
    await open(page, server, '/heute');
    // Ohne Neuladen: So startet die App nach dem Hinzufügen zum Home-Bildschirm.
    await waitForControl(page);
    server.deploy('b');
    await offline(context);
    for (const name of ['Fortschritt', 'Ernährung', 'Training', 'Mehr', 'Heute']) {
      await go(page, name);
    }
  });

  test('Neue Version wartet: ohne Netz startet die App beim nächsten Öffnen mit ihr, alle Bereiche', async ({
    page,
    context,
    server,
  }) => {
    test.slow();
    await open(page, server, '/heute');
    await waitForControl(page);
    await open(page, server, '/ernaehrung');
    server.deploy('b');
    await findUpdate(page);
    await expect(page.getByText('Neue Version verfügbar')).toBeVisible();

    // App schließen und ohne Netz wieder öffnen.
    await offline(context);
    await page.close();
    const next = await context.newPage();
    await open(next, server, '/heute');
    await expectVersion(next, server, 'b');
    for (const path of APP_PAGES) await open(next, server, path);
    await expect(next.getByText('Neue Version verfügbar')).toHaveCount(0);
  });

  test('Neue Version wartet, kein Netz: „Jetzt aktualisieren“ lädt die neue Version', async ({
    page,
    context,
    server,
  }) => {
    test.slow();
    await open(page, server, '/heute');
    await waitForControl(page);
    server.deploy('b');
    await findUpdate(page);
    await offline(context);
    await page.getByRole('button', { name: 'Jetzt aktualisieren' }).click();
    await expect(page.getByText('Neue Version verfügbar')).toHaveCount(0);
    await waitForApp(page);
    await expectVersion(page, server, 'b');
    for (const name of ['Fortschritt', 'Ernährung', 'Training']) await go(page, name);
  });

  test('Während eines Trainings kein Hinweis auf die neue Version; nach dem Beenden erscheint er', async ({
    page,
    server,
  }) => {
    test.slow();
    await open(page, server, '/training');
    await waitForControl(page);
    await page.getByRole('button', { name: 'Freies Training starten' }).click();
    await waitForApp(page, 'Freies Training');
    server.deploy('b');
    await findUpdate(page);
    // Die App kennt die neue Version, der Hinweis bleibt aber aus, solange das Training läuft (E-01).
    await open(page, server, '/mehr/ueber');
    await expect(
      page.getByText(
        'Eine neue Version ist bereit. „Jetzt aktualisieren“ erscheint, wenn dein Training beendet ist.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Neue Version verfügbar')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: 'Training läuft' })).toBeVisible();

    await open(page, server, '/training');
    await page.getByRole('link', { name: 'Training fortsetzen' }).click();
    await waitForApp(page, 'Freies Training');
    // Ohne Sätze endet das Training ohne Rückfrage.
    await page.getByRole('button', { name: 'Beenden', exact: true }).click();
    await waitForApp(page, 'Training abgeschlossen');
    await expect(page.getByText('Neue Version verfügbar')).toBeVisible();
  });
});

test.describe('ohne Service Worker', () => {
  // Safari-Tab ohne Service Worker, privater Modus oder geräumter Speicher: Die Seite holt
  // nachgeladene Teile direkt beim Server.
  test.use({ serviceWorkers: 'block' });

  test('Deployment, während die alte Version offen ist: einmal neu laden, dann zeigt die neue Version den Bereich', async ({
    page,
    server,
    consoleErrors,
  }) => {
    await open(page, server, '/heute');
    await page.evaluate(() => {
      (window as unknown as { alteSeite: boolean }).alteSeite = true;
    });
    server.deploy('b');
    await go(page, 'Fortschritt');
    expect(
      await page.evaluate(() => (window as unknown as { alteSeite?: boolean }).alteSeite),
    ).toBeUndefined();
    await expectVersion(page, server, 'b');
    dropExpected(consoleErrors);
  });

  test('Fehlt der Teil auch nach dem Neuladen: Hinweis mit „Neu laden“, kein zweites Neuladen', async ({
    page,
    server,
    consoleErrors,
  }) => {
    let documents = 0;
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents += 1;
    });
    await open(page, server, '/heute');
    await page.route('**/assets/ProgressPage-*.js', (route) => route.abort());
    await mainNav(page).getByRole('link', { name: 'Fortschritt', exact: true }).click();
    const hint = page.getByRole('alert');
    await expect(
      hint.getByRole('heading', { name: 'Dieser Bereich ließ sich nicht laden' }),
    ).toBeVisible();
    await expect(hint).toContainText('Lade die App neu. Deine Daten bleiben erhalten.');
    await page.waitForTimeout(1000);
    expect(documents).toBe(2);
    // Die übrigen Bereiche funktionieren weiter.
    await go(page, 'Ernährung');
    dropExpected(consoleErrors);
  });

  test('Während eines Trainings lädt die App nie von selbst neu; der Hinweis sagt, dass das Training gespeichert ist', async ({
    page,
    server,
    consoleErrors,
  }) => {
    await open(page, server, '/training');
    await page.getByRole('button', { name: 'Freies Training starten' }).click();
    await waitForApp(page, 'Freies Training');
    await page.evaluate(() => {
      (window as unknown as { alteSeite: boolean }).alteSeite = true;
    });
    server.deploy('b');
    // Die Übungsauswahl ist ein nachgeladener Teil der alten Version, den es nicht mehr gibt.
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
    const hint = page.getByRole('alert');
    await expect(
      hint.getByRole('heading', { name: 'Dieser Bereich ließ sich nicht laden' }),
    ).toBeVisible();
    await expect(hint).toContainText(
      'Dein Training ist gespeichert. Nach dem Neuladen geht es an derselben Stelle weiter.',
    );
    await page.waitForTimeout(1000);
    expect(
      await page.evaluate(() => (window as unknown as { alteSeite?: boolean }).alteSeite),
    ).toBe(true);

    // Erst „Neu laden“ lädt neu: Das Training läuft mit der neuen Version weiter.
    await hint.getByRole('button', { name: 'Neu laden' }).click();
    await waitForApp(page, 'Freies Training');
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
    await expect(page.getByRole('dialog', { name: 'Übung auswählen' })).toBeVisible();
    dropExpected(consoleErrors);
  });
});
