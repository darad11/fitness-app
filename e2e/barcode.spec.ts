import { expect, openPage, test } from './fixtures';

const SKYR = {
  status: 1,
  product: {
    product_name: 'Skyr Natur',
    brands: 'Spar',
    serving_quantity: 150,
    nutriments: {
      'energy-kcal_100g': 63,
      proteins_100g: 11,
      carbohydrates_100g: 4,
      sugars_100g: 4,
      fat_100g: 0.2,
      salt_100g: 0.1,
    },
  },
};

// WebKit: Steuert der Service Worker die Seite, umgehen ihre Anfragen `page.route` (wie in
// sync.spec.ts). Seit D-343 (`clientsClaim`) gilt das schon beim ersten Aufruf; die Anfrage an
// Open Food Facts ging dann ans echte Netz (404, CI zu D-343).
test.use({ serviceWorkers: 'block' });

test('Barcode: Einwilligung, Open Food Facts, speichern und eintragen; zweiter Scan lokal (NU-07, D-266)', async ({
  page,
}) => {
  test.slow();
  const offRequests: string[] = [];
  await page.route('https://world.openfoodfacts.org/**', async (route) => {
    offRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(SKYR),
    });
  });
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  const scanner = page.getByRole('dialog', { name: 'Barcode scannen' });
  await scanner.getByLabel('Barcode eingeben').fill('9001234567896');
  await scanner.getByRole('button', { name: 'Suchen' }).click();
  const consent = page.getByRole('dialog', { name: 'Open Food Facts verwenden?' });
  await expect(consent).toBeVisible();
  expect(offRequests).toEqual([]);
  await consent.getByRole('button', { name: 'Erlauben und suchen' }).click();
  const log = page.getByRole('dialog', { name: 'Skyr Natur hinzufügen' });
  await expect(log.getByText('„Skyr Natur“ unter „Meine Lebensmittel“ gespeichert')).toBeVisible();
  expect(offRequests).toHaveLength(1);
  expect(offRequests[0]).toMatch(/\/api\/v2\/product\/9001234567896\.json\?fields=/);
  await log.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Frühstück' })
      .getByRole('button', { name: /Skyr Natur, Spar/ }),
  ).toBeVisible();
  // Marke in der Tagesliste unter dem Namen (D-278).
  await expect(page.getByRole('region', { name: 'Frühstück' })).toContainText('Spar ·');

  // Nach Neuladen: lokal gefunden, keine weitere Anfrage.
  await page.reload();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=snacks');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  await scanner.getByLabel('Barcode eingeben').fill('9001234567896');
  await scanner.getByRole('button', { name: 'Suchen' }).click();
  await expect(page.getByRole('dialog', { name: 'Skyr Natur hinzufügen' })).toBeVisible();
  expect(offRequests).toHaveLength(1);

  // Erlaubnis zurückziehen unter „Meine Lebensmittel“.
  await openPage(page, '/ernaehrung/lebensmittel');
  await expect(page.getByRole('link', { name: /Skyr Natur/ })).toBeVisible();
  await page.getByRole('button', { name: 'Erlaubnis zurückziehen' }).click();
  await expect(page.getByText('Nicht erlaubt.', { exact: false })).toBeVisible();
});

test.describe('Schnell-Eintrag von „Heute“', () => {
  test('„Heute“: kleiner Ring und „Barcode scannen“ öffnet sofort den Scanner, danach zurück zu „Heute“ (D-275)', async ({
    page,
  }) => {
    test.slow();
    await page.route('https://world.openfoodfacts.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(SKYR),
      });
    });
    // Ziel setzen, damit der Ring erscheint.
    await openPage(page, '/ernaehrung/ziele');
    await page.getByLabel('Energie (kcal)').fill('2200');
    await page.getByLabel('Eiweiß (g)').fill('140');
    await page.getByLabel('Kohlenhydrate (g)').fill('230');
    await page.getByLabel('Fett (g)').fill('75');
    await page.getByRole('button', { name: 'Ziel speichern' }).click();
    await expect(page.getByText(/^2\D?200 kcal$/)).toBeVisible();

    await openPage(page, '/heute');
    await expect(page.getByRole('img', { name: /^0 von 2\D?200 kcal$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Barcode scannen' }).click();
    await expect(page).toHaveURL(/scan=1&von=heute/);
    const scanner = page.getByRole('dialog', { name: 'Barcode scannen' });
    await expect(scanner).toBeVisible();
    await scanner.getByLabel('Barcode eingeben').fill('9001234567896');
    await scanner.getByRole('button', { name: 'Suchen' }).click();
    await page
      .getByRole('dialog', { name: 'Open Food Facts verwenden?' })
      .getByRole('button', { name: 'Erlauben und suchen' })
      .click();
    await page
      .getByRole('dialog', { name: 'Skyr Natur hinzufügen' })
      .getByRole('button', { name: 'Hinzufügen' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: /^9\d von 2\D?200 kcal, davon Eiweiß \d+, Kohlenhydrate/ }),
    ).toBeVisible();
  });
});
