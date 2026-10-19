import { expect, openPage, test } from './fixtures';

test('Profil und Ziele: Zielgewicht und Wochenziel wirken auf „Heute“ und das Diagramm (AK-SET-01, AK-DSH-05, AK-DSH-06, AK-BW-05)', async ({
  page,
}) => {
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Wochenziel' })).toContainText('Leg fest');
  await page.getByRole('link', { name: 'Wochenziel festlegen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Profil und Ziele' })).toBeVisible();
  await page.getByLabel('Anzeigename (optional)').fill('Dali');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Gespeichert.')).toBeVisible();
  const weight = page.getByRole('region', { name: 'Zielgewicht' });
  await weight.getByLabel('Zielgewicht in kg').fill('78');
  await weight.getByRole('button', { name: 'Festlegen' }).click();
  await expect(weight.getByText('Aktuell: 78,0 kg')).toBeVisible();
  const weekly = page.getByRole('region', { name: 'Wochenziel' });
  await weekly.getByLabel('Trainings pro Woche').selectOption('3');
  await weekly.getByRole('button', { name: 'Festlegen' }).click();
  await expect(weekly.getByText('Aktuell: 3 Trainings pro Woche')).toBeVisible();

  await openPage(page, '/heute');
  await expect(page.getByRole('main').locator('header')).toContainText('Hallo Dali!');
  await expect(page.getByRole('region', { name: 'Wochenziel' })).toContainText(
    '0 von 3 Trainings diese Woche',
  );

  // Gewicht erfassen; „Heute“ zeigt den Abstand zum Ziel, das Diagramm die Ziellinie.
  await openPage(page, '/fortschritt/gewicht');
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill('80,4');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Ziel 78,0 kg')).toBeVisible();
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Körpergewicht' })).toContainText(
    'noch 2,4 kg bis 78,0 kg',
  );
});
