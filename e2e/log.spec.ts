import { expect, openPage, test } from './fixtures';

test('Nachtragen: Aktivität erscheint im Verlauf und zählt zum Wochenziel (AK-TRN-23, AK-DSH-05)', async ({
  page,
}) => {
  await openPage(page, '/mehr/profil');
  const weekly = page.getByRole('region', { name: 'Wochenziel' });
  await weekly.getByLabel('Trainings pro Woche').selectOption('2');
  await weekly.getByRole('button', { name: 'Festlegen' }).click();
  await expect(weekly.getByText('Aktuell: 2 Trainings pro Woche')).toBeVisible();

  await openPage(page, '/training');
  await page.getByRole('main').getByRole('link', { name: 'Nachtragen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nachtragen' })).toBeVisible();
  await page.getByText('Aktivität', { exact: true }).first().click();
  await page.getByLabel('Art der Aktivität').selectOption('run');
  await page.getByLabel('Dauer in Minuten').fill('32');
  await page.getByLabel('Distanz in km (optional)').fill('5,2');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Laufen' })).toBeVisible();
  await expect(page.getByText('Nachgetragen')).toBeVisible();
  await expect(page.getByRole('definition').nth(1)).toHaveText('5,2 km');

  await openPage(page, '/training/verlauf');
  await expect(page.getByRole('link', { name: /Laufen/ })).toContainText('32:00 · 5,2 km');
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Wochenziel' })).toContainText(
    '1 von 2 Trainings diese Woche',
  );
});
