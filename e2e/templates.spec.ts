import { expect, mainNav, openPage, test } from './fixtures';

test('Beispielvorlagen: Liste und Vorlage mit Etikett und Hinweis (AK-PRG-06, TP-24)', async ({
  page,
}) => {
  await openPage(page, '/heute');
  await mainNav(page).getByRole('link', { name: 'Training' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Programme und Vorlagen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Programme und Vorlagen' }),
  ).toBeVisible();
  // Drei Programme (A, B, C) und vier Beispielvorlagen.
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(7);
  await expect(page.getByText('Programm', { exact: true })).toHaveCount(3);

  await page
    .getByRole('listitem')
    .filter({ has: page.getByText('Push/Pull/Beine', { exact: true }) })
    .getByRole('link')
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Push/Pull/Beine' })).toBeVisible();
  await expect(page.getByText('Beispiel', { exact: true })).toBeVisible();
  await expect(page.getByText(/keine individuelle Trainingsempfehlung/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pull' }).getByRole('listitem').first()).toHaveText(
    /^1Klimmzüge1 Aufwärmsatz, 4 Sätze · 6–10 Wdh\. · Pause 2:30 min$/,
  );

  await page.getByRole('link', { name: 'Programme und Vorlagen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Programme und Vorlagen' }),
  ).toBeVisible();
});
