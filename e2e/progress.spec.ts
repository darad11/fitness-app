import { expect, mainNav, openPage, test } from './fixtures';

test('Körpergewicht erfassen, Trend und Fortschritt (AK-BW-01 bis AK-BW-06, S-27)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/heute');
  await expect(page.getByText(/Noch kein Gewicht erfasst/)).toBeVisible();
  await mainNav(page).getByRole('link', { name: 'Fortschritt' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Fortschritt' })).toBeVisible();
  await page.getByRole('link', { name: 'Gewicht erfassen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Körpergewicht' })).toBeVisible();

  // Drei Einträge über das Sheet; der dritte mit Sprung zeigt „Bitte prüfen“, bleibt aber speicherbar.
  const add = async (weight: string, daysAgo: number) => {
    await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
    await sheet.getByLabel('Gewicht in kg').fill(weight);
    const when = new Date();
    when.setDate(when.getDate() - daysAgo);
    when.setHours(7, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    await sheet
      .getByLabel('Datum und Uhrzeit')
      .fill(
        `${String(when.getFullYear())}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T07:00`,
      );
    return sheet;
  };
  let sheet = await add('82', 12);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  sheet = await add('81,4', 5);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  sheet = await add('85', 4);
  await expect(sheet.getByRole('status')).toContainText('Bitte prüfen');
  await sheet.getByLabel('Gewicht in kg').fill('80,9');
  await expect(sheet.getByRole('status')).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByText('Veränderung 90 Tage')).toBeVisible();
  await expect(page.getByText('-1,1')).toBeVisible();
  await expect(page.getByRole('img', { name: /Gewichtsverlauf mit 3 Messungen/ })).toBeVisible();
  await page.getByText('Als Tabelle', { exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(4);

  // Bearbeiten über die Liste, Löschen mit Rückgängig.
  const list = page.getByRole('region', { name: 'Alle Einträge' });
  await list.getByRole('button', { name: /^82,0 kg am/ }).click();
  const edit = page.getByRole('dialog', { name: 'Eintrag bearbeiten' });
  await edit.getByRole('button', { name: 'Eintrag löschen' }).click();
  await expect(page.getByText('Eintrag gelöscht')).toBeVisible();
  await expect(list.getByRole('button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(list.getByRole('button')).toHaveCount(3);

  // „Heute“ und „Fortschritt“ zeigen den letzten Wert mit Mini-Verlauf.
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Körpergewicht' })).toContainText('80,9 kg');
  await openPage(page, '/fortschritt');
  await expect(page.getByRole('region', { name: 'Körpergewicht' })).toContainText('80,9 kg');
  await expect(
    page.getByText('Bestleistungen erscheinen nach dem ersten abgeschlossenen Training.'),
  ).toBeVisible();
});
