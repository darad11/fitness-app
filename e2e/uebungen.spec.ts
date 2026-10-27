import { readFileSync } from 'node:fs';
import type { BrowserContext, Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

/**
 * Visuals und Ausführung der Übungen (Phase Übungen, Phase 1, D-397, D-398; Leitlinien Kapitel 10).
 * Ausgeliefert hat die App noch keine Visuals: geprüft wird der Rückfall (Symbol in der Kachel)
 * und mit einer Testliste über `page.route` die Zuordnung, der Wechsel und Ladefehler. Die
 * Testbilder sind der Rohentwurf aus `docs/screens/uebungen/prototyp/`.
 */

const PROTO = 'docs/screens/uebungen/prototyp';

// Ohne Service Worker: Sonst käme die Liste der Visuals nach dem ersten Laden aus seinem Speicher
// (leer) statt aus der Testliste; `page.route` sieht Anfragen des Service Workers in WebKit nicht.
test.use({ serviceWorkers: 'block' });

function visual(key: string) {
  return {
    preview: { src: `medien/${key}-vorschau.svg`, width: 240, height: 240 },
    demo: {
      kind: 'image',
      file: { src: `medien/${key}-start.svg`, width: 640, height: 480 },
    },
    alt: `Testbild ${key}`,
    source: 'test',
  };
}

/** Testliste mit Visuals für Kniebeuge und Bankdrücken; `broken` liefert 404 für diese Dateien. */
async function serveVisuals(context: BrowserContext, broken: string[] = []) {
  await context.route('**/uebungen/medien.json', (route) =>
    route.fulfill({
      json: {
        version: 1,
        sources: {
          test: { name: 'Test', url: 'https://example.org/', license: 'CC0', commercialUse: true },
        },
        visuals: {
          back_squat_barbell: visual('back_squat_barbell'),
          bench_press_barbell: visual('bench_press_barbell'),
        },
      },
    }),
  );
  await context.route('**/uebungen/medien/*.svg', (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    if (broken.some((key) => name.startsWith(key))) return route.fulfill({ status: 404 });
    return route.fulfill({
      body: readFileSync(`${PROTO}/${name}`),
      contentType: 'image/svg+xml',
    });
  });
}

/** Zeile der Übungsliste mit diesem Namen. */
function row(page: Page, name: string) {
  return page.getByRole('link', { name: new RegExp(`^${name}`) }).first();
}

async function startTemplateDay(page: Page) {
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).first().click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

test('Übungsliste: Symbol in der Kachel ohne Visual, nie ein leerer Kasten (D-397)', async ({
  page,
}) => {
  await openPage(page, '/uebungen');
  const squat = row(page, 'Kniebeuge mit Langhantel');
  await expect(squat.locator('[data-visual="symbol"] svg')).toBeVisible();
  expect(await page.locator('ul[aria-label] img').count()).toBe(0);
  // Jede Zeile hat ein Vorschaubild oder Symbol links, alle gleich groß.
  const sizes = await page
    .locator('[aria-label="Brust"] li [data-visual]')
    .evaluateAll((nodes) => nodes.map((n) => `${n.clientWidth}×${n.clientHeight}`));
  expect(sizes.length).toBe(12);
  expect(new Set(sizes).size).toBe(1);
  expect(sizes[0]).toBe('56×56');
});

test('Übungsliste mit Visuals: richtiges Bild je Übung, Fehler beim Laden zeigt das Symbol (D-397)', async ({
  page,
  context,
  consoleErrors,
}) => {
  await serveVisuals(context, ['bench_press_barbell']);
  await openPage(page, '/uebungen');
  const squat = row(page, 'Kniebeuge mit Langhantel').locator('img');
  await squat.scrollIntoViewIfNeeded();
  await expect(squat).toHaveAttribute('src', '/uebungen/medien/back_squat_barbell-vorschau.svg');
  await expect.poll(() => squat.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(240);
  // Bankdrücken: Datei fehlt (404), deshalb das Symbol statt eines kaputten Bildes.
  const bench = row(page, 'Bankdrücken mit Langhantel');
  await bench.scrollIntoViewIfNeeded();
  await expect(bench.locator('[data-visual="symbol"]')).toBeVisible();
  await expect(bench.locator('img')).toHaveCount(0);
  // Der absichtliche 404 steht als Meldung in der Konsole; andere Fehler dürfen nicht kommen.
  const expected = (text: string) => /Failed to load resource.*404/.test(text);
  expect(consoleErrors.filter(expected).length).toBeGreaterThan(0);
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((t) => !expected(t)));
  // Andere Übungen ohne Visual: Symbol.
  await expect(
    row(page, 'Bankdrücken mit Kurzhanteln').locator('[data-visual="symbol"]'),
  ).toBeVisible();
});

test('Player: Demonstration zugeklappt kompakt, aufgeklappt groß, gehört zur aktuellen Übung (D-397)', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(!isMobile, 'Handy-Profil');
  await serveVisuals(context);
  await setDuoPose(page, 'zu');
  await startTemplateDay(page);
  const demo = page.getByRole('region', { name: 'Ausführung der aktuellen Übung' });
  const now = page.getByRole('region', { name: 'Jetzt' });
  // Zugeklappt: große Demonstration aus, kompakt in „Jetzt“ das Vorschaubild der Kniebeuge.
  await expect(demo).toBeHidden();
  await expect(now.getByRole('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/back_squat_barbell-vorschau.svg',
  );
  const done = page.getByRole('button', { name: 'Satz erledigt', exact: true });
  await expect(done).toBeInViewport();
  // Schmal kein Vorschaubild in der Übungskarte: Der erste Satz steht über der Fußleiste.
  await expect(page.locator('.player-card-thumb').first()).toBeHidden();
  const firstSet = await page
    .getByLabel(/^Gewicht in kg, /)
    .first()
    .boundingBox();
  const footTop = (await page.locator('.player-foot').boundingBox())?.y ?? 0;
  expect((firstSet?.y ?? 0) + (firstSet?.height ?? 0)).toBeLessThanOrEqual(footTop);

  // Aufgeklappt: groß in der rechten Spalte, kompakt in „Jetzt“ aus.
  await setDuoPose(page, 'auf');
  await expect(demo).toBeVisible();
  await expect(demo.getByRole('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/back_squat_barbell-start.svg',
  );
  await expect(now.locator('.player-now-demo')).toBeHidden();
  await expect(page.locator('.player-card-thumb').first()).toBeVisible();
  const width = (await demo.boundingBox())?.width ?? 0;
  expect(width).toBeGreaterThan(250);
  await expect(done).toBeInViewport();

  // Kniebeuge nach unten: Bankdrücken wird aktuell, mit seinem Bild, nie dem der Kniebeuge.
  await page
    .getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Nach unten' }).click();
  const bench = demo;
  await expect(bench.getByRole('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/bench_press_barbell-start.svg',
  );
  await expect(
    demo.getByRole('button', { name: 'Bankdrücken mit Langhantel: Ausführung und Angaben' }),
  ).toBeVisible();

  // Neu laden während des Trainings: dieselbe Zuordnung.
  await page.reload();
  await expect(bench.getByRole('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/bench_press_barbell-start.svg',
  );

  // Zurück nach oben: wieder die Kniebeuge.
  await page
    .getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Nach oben' }).click();
  await expect(demo.getByRole('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/back_squat_barbell-start.svg',
  );
});

test('Player ohne Visuals: Symbol mit Muskel-Etiketten, Antippen öffnet die Ausführung (D-397, D-398)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Handy-Profil');
  await setDuoPose(page, 'auf');
  await startTemplateDay(page);
  const demo = page.getByRole('region', { name: 'Ausführung der aktuellen Übung' });
  await expect(demo.locator('[data-demo="symbol"]')).toBeVisible();
  await expect(demo.getByText('Oberschenkel vorne', { exact: true })).toBeVisible();
  await demo
    .getByRole('button', { name: 'Kniebeuge mit Langhantel: Ausführung und Angaben' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Kniebeuge mit Langhantel' });
  await expect(dialog.getByText('Schritt für Schritt')).toBeVisible();
  await dialog.getByRole('link', { name: 'Alle Angaben zur Übung' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Kniebeuge mit Langhantel' }),
  ).toBeVisible();
  // Das Training läuft weiter.
  await expect(page.getByText('Training läuft')).toBeVisible();
});

test('Übungsdetails: zuerst Ausführung mit Quellen, offene Übungen ehrlich offen (D-398)', async ({
  page,
}) => {
  await openPage(page, '/uebungen');
  await row(page, 'Kniebeuge mit Langhantel').click();
  const panel = page.getByRole('tabpanel', { name: 'Ausführung' });
  await expect(panel.getByText('Ausgangsposition')).toBeVisible();
  await expect(panel.getByText('Häufige Fehler')).toBeVisible();
  const source = panel.getByRole('link', { name: /^ExRx\.net/ }).first();
  await expect(source).toHaveAttribute('href', /^https:\/\/(www\.)?exrx\.net\//);
  await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(panel.getByText(/keine persönliche oder medizinische Empfehlung/)).toBeVisible();

  // Heel Taps: keine belegte Quelle, kein erfundener Text.
  await openPage(page, '/uebungen?q=Heel');
  await row(page, 'Heel Taps').click();
  await expect(
    page.getByText('Für diese Übung gibt es noch keine belegte Beschreibung der Ausführung.'),
  ).toBeVisible();
});
