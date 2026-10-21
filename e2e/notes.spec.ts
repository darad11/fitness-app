import AxeBuilder from '@axe-core/playwright';
import { expect, openPage, test } from './fixtures';

test('Notizen zu Übung und Einheit im Player, im Verlauf und beim nächsten Mal (AK-TRN-24)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
  await page
    .getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Notiz', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Notiz zu Kniebeuge mit Langhantel' });
  await dialog.getByLabel('Notiz').fill('Knie nach außen');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await dialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Knie nach außen')).toBeVisible();
  await page.getByRole('button', { name: 'Notiz zur Einheit' }).click();
  await page
    .getByRole('dialog', { name: 'Notiz zur Einheit' })
    .getByLabel('Notiz')
    .fill('Gut geschlafen');
  await page
    .getByRole('dialog', { name: 'Notiz zur Einheit' })
    .getByRole('button', { name: 'Speichern' })
    .click();
  await expect(page.getByText('Gut geschlafen')).toBeVisible();

  // Nach Neuladen erhalten, dann beenden.
  await page.reload();
  await expect(page.getByText('Knie nach außen')).toBeVisible();
  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Training beenden?' })
    .getByRole('button', { name: 'Training beenden' })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
  ).toBeVisible();

  // Verlauf zeigt beide Notizen.
  await openPage(page, '/training/verlauf');
  await page
    .getByRole('link', { name: /Tag A · Ganzkörper A\/B/ })
    .first()
    .click();
  await expect(page.getByText('Gut geschlafen')).toBeVisible();
  await expect(page.getByText('Knie nach außen')).toBeVisible();
});
