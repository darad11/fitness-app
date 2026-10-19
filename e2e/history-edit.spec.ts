import { expect, openPage, test } from './fixtures';

test('Verlauf: Training bearbeiten und löschen mit Rückgängig (AK-HIS-03, AK-HIS-04)', async ({
  page,
}) => {
  await openPage(page, '/training/nachtragen');
  await page.getByText('Aktivität', { exact: true }).first().click();
  await page.getByLabel('Art der Aktivität').selectOption('walk');
  await page.getByLabel('Dauer in Minuten').fill('40');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gehen' })).toBeVisible();

  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByLabel('Titel').fill('Spaziergang');
  await page.getByLabel('Dauer in Minuten').fill('55');
  await page.getByLabel('Notiz (optional)').fill('mit Hund');
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Spaziergang' })).toBeVisible();
  await expect(page.getByRole('definition').first()).toHaveText('55:00');
  await expect(page.getByText('mit Hund')).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page
    .getByRole('dialog', { name: 'Training löschen?' })
    .getByRole('button', { name: 'Löschen' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  await expect(page.getByText('Training gelöscht')).toBeVisible();
  await expect(page.getByRole('link', { name: /Spaziergang/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('link', { name: /Spaziergang/ })).toContainText('55:00');
});
