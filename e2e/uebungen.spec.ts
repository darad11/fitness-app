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

test('Übungsliste: Übungen mit Animation mit Vorschaubild, sonst Symbol in der Kachel, nie ein leerer Kasten (D-397, D-403, D-463, D-465)', async ({
  page,
}) => {
  await openPage(page, '/uebungen');
  const smith = row(page, 'Bankdrücken an der Multipresse');
  await expect(smith.locator('[data-visual="symbol"] svg')).toBeVisible();
  // Ausgeliefert sind Animationen für sechs Übungen: die drei Pilot-Übungen (D-402), die Familie
  // „Waagrechtes Drücken“ mit Kurzhanteln (D-463) und die Beinpresse (D-465).
  await expect(page.locator('ul[aria-label] img')).toHaveCount(6);
  await expect(row(page, 'Bankdrücken mit Kurzhanteln').locator('img')).toHaveAttribute(
    'src',
    '/uebungen/medien/bankdruecken_kh-vorschau.webp',
  );
  const legPress = row(page, 'Beinpresse(?!,)').locator('img');
  await legPress.scrollIntoViewIfNeeded();
  await expect(legPress).toHaveAttribute('src', '/uebungen/medien/beinpresse-vorschau.webp');
  const squat = row(page, 'Kniebeuge mit Langhantel').locator('img');
  await squat.scrollIntoViewIfNeeded();
  await expect(squat).toHaveAttribute('src', '/uebungen/medien/kniebeuge-vorschau.webp');
  await expect.poll(() => squat.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(240);
  await expect(row(page, 'Latziehen').locator('[data-visual="bild"]')).toHaveAttribute(
    'data-shape',
    'quadrat',
  );
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
  // Schmal kein Vorschaubild in der Übungskarte: Das Bild in „Jetzt“ verschiebt den ersten Satz
  // nicht; er steht genau dort, wo er ohne Bild steht (Symbol in der Kachel, gleich groß).
  await expect(page.locator('.player-card-thumb').first()).toBeHidden();
  const firstSetBottom = async () => {
    const box = await page
      .getByLabel(/^Gewicht in kg, /)
      .first()
      .boundingBox();
    return (box?.y ?? 0) + (box?.height ?? 0);
  };
  const withImage = await firstSetBottom();
  // Lage der Blöcke über dem ersten Satz, damit ein Fehlschlag die Ursache zeigt.
  const layout = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.player-frame header, .player-frame header > *, .player-frame > * > * > *, .player-frame section, .player-frame [data-demo]',
      ),
    ]
      .map((node) => {
        const box = node.getBoundingClientRect();
        const name = `${node.tagName.toLowerCase()}.${(node.getAttribute('class') ?? '').slice(0, 40)}`;
        const text = node.textContent.trim().slice(0, 30);
        return `${name} y=${Math.round(box.top)} h=${Math.round(box.height)} „${text}“`;
      })
      .slice(0, 40)
      .join('\n'),
  );
  await context.unroute('**/uebungen/medien.json');
  await context.route('**/uebungen/medien.json', (route) =>
    route.fulfill({ json: { version: 1, sources: {}, visuals: {} } }),
  );
  await page.reload();
  await expect(now.locator('[data-demo="symbol"]')).toBeVisible();
  const withSymbol = await firstSetBottom();
  expect(
    Math.abs(withImage - withSymbol),
    `mit Bild ${String(withImage)}, ohne ${String(withSymbol)}:\n${layout}`,
  ).toBeLessThanOrEqual(1);
  // Mit sicherem Bereich (nur Chromium stellt ihn nach) steht er über der Fußleiste.
  if (test.info().project.name.startsWith('chromium')) {
    const footTop = (await page.locator('.player-foot').boundingBox())?.y ?? 0;
    expect(withImage, layout).toBeLessThanOrEqual(footTop);
  }
  await context.unroute('**/uebungen/medien.json');
  await serveVisuals(context);
  await page.reload();
  await expect(now.getByRole('img')).toBeVisible();

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
  context,
  isMobile,
}) => {
  test.skip(!isMobile, 'Handy-Profil');
  // Ohne Visuals, auch für die Pilot-Übungen.
  await context.route('**/uebungen/medien.json', (route) =>
    route.fulfill({ json: { version: 1, sources: {}, visuals: {} } }),
  );
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

test('Teil für Übungsbilder lädt nicht: Training läuft mit Symbol weiter, kein Neuladen (D-400)', async ({
  page,
  consoleErrors,
}) => {
  let documents = 0;
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documents += 1;
  });
  // Wie nach einem Deployment ohne Netz: Der nachgeladene Teil mit den Visuals fehlt.
  await page.route('**/assets/visuals-*.js', (route) => route.abort());
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill('kniebeuge mit lang');
  await picker.getByRole('button', { name: /^Kniebeuge mit Langhantel/ }).click();
  await expect(picker).toBeHidden();
  const set = 'Kniebeuge mit Langhantel, Arbeitssatz 1';
  await page.getByLabel(`Gewicht in kg, ${set}`).fill('60');
  await page.getByLabel(`Wiederholungen, ${set}`).fill('5');
  await page.getByRole('button', { name: `Satz erledigt, ${set}` }).click();
  await expect(page.getByText('1 von 1 Sätzen')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  // Während eines Trainings lädt die App nie von selbst neu (D-343).
  expect(documents).toBe(1);
  const expected = (text: string) =>
    /Failed to load resource|Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script/.test(
      text,
    );
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((t) => !expected(t)));
});

test('Teil für Übungsbilder lädt nicht: außerhalb des Trainings genau einmal neu laden (D-400)', async ({
  page,
  consoleErrors,
}) => {
  let documents = 0;
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documents += 1;
  });
  await openPage(page, '/heute');
  await page.route('**/assets/visuals-*.js', (route) => route.abort());
  await page.goto('/training/vorlagen/full_body_ab');
  // Einmal neu geladen; fehlt der Teil weiter, bleibt die Seite mit dem Symbol stehen.
  await expect.poll(() => documents, { timeout: 10_000 }).toBe(3);
  await expect(page.getByRole('button', { name: 'Tag A heute trainieren' }).first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(documents).toBe(3);
  await expect(page.getByRole('alert')).toHaveCount(0);
  const expected = (text: string) =>
    /Failed to load resource|Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script/.test(
      text,
    );
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((t) => !expected(t)));
});

test('Übungsdetails, Reiter „Muskeln“: Karte vorne und hinten je Übung, Muskeln als Text (D-401)', async ({
  page,
}) => {
  const maps: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/MuscleMap-')) maps.push(request.url());
  });
  await openPage(page, '/uebungen');
  expect(maps).toHaveLength(0);
  await row(page, 'Bankdrücken mit Langhantel').click();
  await page.getByRole('tab', { name: 'Muskeln' }).click();
  const map = page.getByRole('img', { name: /^Muskelkarte\. Hauptmuskeln: Brust\./ });
  await expect(map).toBeVisible();
  await expect(map.locator('g[data-region="chest"][data-level="primary"]')).toHaveCount(1);
  await expect(map.locator('g[data-level="primary"]')).toHaveCount(1);
  expect(maps.length).toBeGreaterThan(0);

  await openPage(page, '/uebungen');
  await row(page, 'Kniebeuge mit Langhantel').click();
  await page.getByRole('tab', { name: 'Muskeln' }).click();
  const squat = page.getByRole('img', {
    name: /^Muskelkarte\. Hauptmuskeln: Oberschenkel vorne, Gesäß\./,
  });
  await expect(squat.locator('g[data-region="quadriceps"][data-level="primary"]')).toHaveCount(1);
  await expect(squat.locator('g[data-region="gluteal"][data-level="primary"]')).toHaveCount(1);
  await expect(squat.locator('g[data-region="chest"][data-level="none"]')).toHaveCount(1);
});

test('Pilot-Animation: Schleife im Player aufgeklappt und in den Details, Standbild bei weniger Bewegung (D-403)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Handy-Profil');
  await setDuoPose(page, 'auf');
  await startTemplateDay(page);
  const demo = page.getByRole('region', { name: 'Ausführung der aktuellen Übung' });
  const video = demo.locator('video');
  await expect(video).toHaveAttribute('poster', '/uebungen/medien/kniebeuge-poster.webp');
  await expect(video).toHaveJSProperty('muted', true);
  await expect(video).toHaveJSProperty('loop', true);
  // Die Schleife läuft wirklich (Zeit schreitet fort).
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.2);

  // Übungsdetails: dieselbe Schleife.
  await openPage(page, '/uebungen');
  await row(page, 'Latziehen').click();
  const detail = page.locator('[data-demo="bild"] video');
  await expect(detail.locator('source').last()).toHaveAttribute(
    'src',
    '/uebungen/medien/latziehen.mp4',
  );

  // Weniger Bewegung: nur das Standbild, kein Video.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const still = page.locator('[data-demo="bild"] img');
  await expect(still).toHaveAttribute('src', '/uebungen/medien/latziehen-poster.webp');
  await expect(page.locator('[data-demo="bild"] video')).toHaveCount(0);
});
