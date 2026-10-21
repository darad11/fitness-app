import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

async function expectNoAxeViolations(page: Page, label: string) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(
      (v) => `${label} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([]);
}

async function createExercise(page: Page, name: string) {
  await openPage(page, '/uebungen');
  await page.getByRole('button', { name: 'Eigene Übung' }).click();
  const dialog = page.getByRole('dialog', { name: 'Eigene Übung anlegen' });
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Gerät').selectOption('Maschine');
  await dialog.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

test('eigene Übung anlegen, Angaben speichern, im Programm verwenden und starten (AK-EXL-03, AK-EXL-04)', async ({
  page,
}) => {
  test.slow();
  await createExercise(page, 'Brustpresse Technogym');
  await page.getByLabel('Notiz (z. B. Sitzhöhe, Griff)').fill('Sitz Stufe 4');
  await page.getByLabel('Standardpause').selectOption('45 s');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Gespeichert')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Notiz (z. B. Sitzhöhe, Griff)')).toHaveValue('Sitz Stufe 4');
  await expect(page.getByLabel('Standardpause')).toHaveValue('45');

  // In einem eigenen Programm verwenden.
  await openPage(page, '/training/programme');
  await page.getByRole('button', { name: 'Neues Programm' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Maschinen');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await page.getByRole('link', { name: /^Tag 1 bearbeiten/ }).click();
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  await page.getByLabel('Übungen suchen').fill('brustpresse tech');
  await page.getByRole('button', { name: /^Brustpresse Technogym/ }).click();
  await expect(page.locator('h3', { hasText: 'Brustpresse Technogym' })).toBeVisible();
  await page.getByRole('link', { name: 'Zum Editor' }).click();
  await page.getByRole('link', { name: 'Zum Programm' }).click();
  await page.getByRole('button', { name: 'Tag 1 heute trainieren' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Brustpresse Technogym' }),
  ).toBeVisible();
});

{
  test(`keine axe-Verstöße bei eigenen Übungen (AK-UX-04 Basis)`, async ({ page }) => {
    test.slow();
    await createExercise(page, 'Rudermaschine Concept');
    await expectNoAxeViolations(page, 'Detail');
    await page.getByRole('button', { name: 'Bearbeiten' }).click();
    await expect(page.getByRole('dialog', { name: 'Eigene Übung bearbeiten' })).toBeVisible();
    await expectNoAxeViolations(page, 'Dialog');
    await openPage(page, '/uebungen');
    await expectNoAxeViolations(page, 'Liste');
  });
}
