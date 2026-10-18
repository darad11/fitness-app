import { expect, mainNav, openPage, test } from './fixtures';

test('Übungen: Weg über Training, Suche mit Umlaut-Ersatz und Filter (AK-EXL-01, AK-EXL-02)', async ({
  page,
}) => {
  await openPage(page, '/heute');
  await mainNav(page).getByRole('link', { name: 'Training' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Übungen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible();
  await expect(page.getByText('124 Übungen')).toBeVisible();

  await page.getByLabel('Übungen suchen').fill('schraegbank kurzhantel');
  const results = page.getByRole('list', { name: '2 Treffer' }).getByRole('listitem');
  await expect(results).toHaveCount(2);
  await expect(results.first()).toContainText('Schrägbank-Curls mit Kurzhanteln');

  await page.getByLabel('Übungen suchen').fill('');
  await page.getByLabel('Muskelgruppe').selectOption({ label: 'Waden' });
  await page.getByLabel('Gerät').selectOption({ label: 'Maschine' });
  await expect(page.getByRole('list', { name: '3 Treffer' }).getByRole('listitem')).toHaveCount(3);

  await page.reload();
  await expect(page.getByLabel('Muskelgruppe')).toHaveValue('calves');
  await expect(page.getByRole('list', { name: '3 Treffer' })).toBeVisible();
});
