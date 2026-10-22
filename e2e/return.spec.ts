import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Rückkehr-Flow (form-markenleitplanken.md Abschnitt 3, D-319): nach 14 Tagen ohne Eintrag
 * erscheint auf „Heute“ einmal das Blatt „Schön, dass du da bist.“; kein Text nennt die Tage.
 */

const D0 = new Date('2026-10-01T09:00:00+02:00');
const day = (n: number) => new Date(D0.getTime() + n * 86_400_000);
const SHEET = 'Schön, dass du da bist.';

async function addWater(page: Page) {
  await openPage(page, '/heute');
  const water = page.getByRole('region', { name: 'Wasser' });
  await water.getByRole('button', { name: /250 ml hinzufügen/ }).click();
  await expect(water.getByRole('button', { name: /^Letzten Eintrag entfernen/ })).toBeVisible();
}

/** „Heute“ prüft den Auslöser nach dem Laden aus der Datenbank; kurz warten, dann prüfen. */
async function settle(page: Page) {
  await page.waitForTimeout(800);
}

async function logRun(page: Page) {
  await openPage(page, '/training/nachtragen');
  await page.getByText('Aktivität', { exact: true }).first().click();
  await page.getByLabel('Art der Aktivität').selectOption('run');
  await page.getByLabel('Dauer in Minuten').fill('30');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Laufen' })).toBeVisible();
}

test('Rückkehr nach 14 Tagen: Blatt genau einmal, ohne Zahl der Tage, „Nur reinschauen“ (D-319)', async ({
  page,
}) => {
  await page.clock.install({ time: D0 });
  await addWater(page);

  // 13 Tage danach: noch kein Blatt.
  await page.clock.setSystemTime(day(13));
  await openPage(page, '/heute');
  await settle(page);
  await expect(page.getByRole('dialog', { name: SHEET })).toBeHidden();

  // 15 Tage danach: das Blatt mit den finalen Texten und drei gleichwertigen Knöpfen.
  await page.clock.setSystemTime(day(15));
  await openPage(page, '/heute');
  const sheet = page.getByRole('dialog', { name: SHEET });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Eine Pause gehört dazu. Was ist dir heute möglich?');
  for (const name of ['Ein Spaziergang', 'Ein leichtes Training', 'Nur reinschauen']) {
    await expect(sheet.getByRole('button', { name, exact: true })).toBeVisible();
  }
  expect(await sheet.textContent()).not.toMatch(/\d/);
  const axe = await new AxeBuilder({ page })
    .include('dialog[open]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);

  await sheet.getByRole('button', { name: 'Nur reinschauen' }).click();
  await expect(sheet).toBeHidden();

  // Einmal je Rückkehr: nicht nach dem Neuladen, nicht am nächsten Tag.
  await openPage(page, '/heute');
  await settle(page);
  await expect(page.getByRole('dialog', { name: SHEET })).toBeHidden();
  await page.clock.setSystemTime(day(16));
  await openPage(page, '/heute');
  await settle(page);
  await expect(page.getByRole('dialog', { name: SHEET })).toBeHidden();
});

test('Rückkehr: „Ein Spaziergang“ hebt die Schritte hervor, „Ein leichtes Training“ zeigt den Hinweis (D-319)', async ({
  page,
}) => {
  await page.clock.install({ time: D0 });
  await addWater(page);

  await page.clock.setSystemTime(day(20));
  await openPage(page, '/heute');
  const sheet = page.getByRole('dialog', { name: SHEET });
  await sheet.getByRole('button', { name: 'Ein Spaziergang' }).click();
  await expect(sheet).toBeHidden();
  const steps = page.locator('[data-highlighted]');
  await expect(steps).toContainText('Schritte');
  await expect(steps).toBeFocused();

  // Nach einem neuen Eintrag und wieder 14 Tagen Pause kommt das Blatt erneut.
  await addWater(page);
  await page.clock.setSystemTime(day(36));
  await openPage(page, '/heute');
  await sheet.getByRole('button', { name: 'Ein leichtes Training' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[^/?]+\?leicht=1$/);
  await expect(page.getByRole('note')).toHaveText('Weniger Sätze sind heute in Ordnung.');
});

test('Verlauf: Eine Lücke ab 14 Tagen heißt „Pause“ (D-319)', async ({ page }) => {
  await page.clock.install({ time: D0 });
  await logRun(page);
  await page.clock.setSystemTime(day(20));
  await logRun(page);
  await openPage(page, '/training/verlauf');
  await expect(page.getByRole('link', { name: /Laufen/ })).toHaveCount(2);
  await expect(page.getByText('Pause', { exact: true })).toBeVisible();
});
