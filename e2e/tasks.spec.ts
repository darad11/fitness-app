import { expect, openPage, test } from './fixtures';

test('Tagesaufgaben: anlegen, abhaken, Serie (AH-03, TH-04)', async ({ page }) => {
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Tagesaufgaben' })).toContainText(
    'Leg dir eigene Aufgaben',
  );
  await page.getByRole('link', { name: 'Aufgabe anlegen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tagesaufgaben' })).toBeVisible();
  await page.getByLabel('Name der Aufgabe').fill('30 min Cardio');
  await page.getByRole('button', { name: 'Aufgabe anlegen' }).click();
  // Erst wenn die erste Aufgabe gespeichert und das Feld geleert ist, die zweite eintippen; sonst
  // leerte das Zurücksetzen nach dem Speichern manchmal den zweiten Namen (WebKit).
  await expect(page.getByRole('region', { name: 'Heute' }).getByRole('checkbox')).toHaveCount(1);
  await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  await page.getByLabel('Name der Aufgabe').fill('2 l Wasser');
  await page.getByRole('button', { name: 'Aufgabe anlegen' }).click();
  const list = page.getByRole('region', { name: 'Heute' });
  await expect(list.getByRole('checkbox')).toHaveCount(2);

  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  await card.getByText('30 min Cardio').click();
  await expect(card).toContainText('Keine Serie · 1 von 2 erledigt');
  await card.getByText('2 l Wasser').click();
  await expect(card).toContainText('Serie: 1 Tag · Alles erledigt');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Tagesaufgaben' })).toContainText('Serie: 1 Tag');
  await expect(
    page.getByRole('region', { name: 'Tagesaufgaben' }).getByRole('checkbox'),
  ).toHaveCount(2);
});
