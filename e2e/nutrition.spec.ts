import { expect, openPage, test } from './fixtures';

test('Ernährung: Ziel setzen, aus dem BLS protokollieren, nach Neuladen erhalten, auf „Heute“ sehen', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2200');
  await page.getByLabel('Eiweiß (g)').fill('140');
  await page.getByLabel('Kohlenhydrate (g)').fill('230');
  await page.getByLabel('Fett (g)').fill('75');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await expect(page.getByText(/^2\D?200 kcal$/)).toBeVisible();

  await openPage(page, '/ernaehrung');
  await page.getByRole('link', { name: 'Zu Mittagessen hinzufügen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lebensmittel hinzufügen' }),
  ).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByLabel('Lebensmittel suchen').fill('erdäpfel gekocht');
  await page
    .getByRole('button', { name: /^Kartoffel/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Menge in g').fill('200');
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  const lunch = page.getByRole('region', { name: 'Mittagessen' });
  await expect(lunch.getByText('200 g')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Mittagessen' }).getByText('200 g')).toBeVisible();
  await expect(page.getByText(/von 2\D?200 kcal/).first()).toBeVisible();

  await openPage(page, '/heute');
  await expect(page.getByText('Ernährung heute')).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('link', { name: 'Ernährung' }),
  ).toBeVisible();
});

test('Lebensmitteldaten: Datei importieren, nach Neuladen in der Suche finden (D-263)', async ({
  page,
}) => {
  test.slow();
  const values = {
    fiber: 1,
    kcal: 98,
    fat: 3,
    saturatedFat: 1,
    carbs: 9,
    sugar: 1,
    protein: 7,
    salt: 0.4,
  };
  const content = JSON.stringify({
    fetchedAt: '2026-10-19 13:41',
    rows: [
      { code: 'C133000', source: 'BLS4.0', name: 'Hafer Flocken', ...values },
      { code: '0003384', source: 'ÖNWT-HH', name: 'Fisolen mit Speck', ...values },
      { code: '0003385', source: 'ÖNWT2.0', name: 'Altbrot, +++läuft aus', ...values },
    ],
  });
  await openPage(page, '/ernaehrung/lebensmittel');
  await page.getByLabel('Datei auswählen').setInputFiles({
    name: 'nuts-recherche.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content, 'utf8'),
  });
  const preview = page.getByRole('dialog', { name: 'Lebensmitteldaten importieren' });
  await expect(preview.getByText('1 Lebensmittel werden übernommen:')).toBeVisible();
  await preview.getByRole('button', { name: 'Importieren' }).click();
  await expect(page.getByText('1 Lebensmittel importiert', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 Lebensmittel importiert', { exact: true })).toBeVisible();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByLabel('Lebensmittel suchen').fill('fisolen');
  await expect(page.getByRole('button', { name: /^Fisolen mit Speck\s*ÖNWT/ })).toBeVisible();
});
