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
