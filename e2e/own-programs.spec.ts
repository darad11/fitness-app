import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { chooseTheme, expect, openPage, test } from './fixtures';

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

/** Übernimmt „Ganzkörper A/B" und öffnet den Editor; liefert die Adresse des Programms. */
async function adoptSample(page: Page): Promise<string> {
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Als eigenes Programm übernehmen' }).click();
  await expect(page.getByText('Eigenes Programm', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/training\/programme\/[0-9a-f-]+$/);
  return new URL(page.url()).pathname;
}

test('eigenes Programm übernehmen, bearbeiten und nach Neuladen behalten (AK-PRG-02 bis AK-PRG-06)', async ({
  page,
}) => {
  test.slow();
  const programPath = await adoptSample(page);
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ganzkörper A/B' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Woche 1' })).toBeVisible();

  // Tag A umsortieren: Plank nach oben; Satzschema der Kniebeuge ändern.
  await page
    .getByRole('link', { name: /^Tag A bearbeiten/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A' })).toBeVisible();
  await page.getByRole('button', { name: 'Unterarmstütz (Plank) nach oben' }).click();
  const squat = page.locator('h3', { hasText: 'Kniebeuge mit Langhantel' });
  await expect(squat).toBeVisible();
  const repsMax = page.getByLabel('Wdh. bis, Satz 3, Kniebeuge mit Langhantel');
  await expect(repsMax).toHaveValue('8');
  await repsMax.fill('10');
  await repsMax.press('Enter');
  await expect(repsMax).toHaveValue('10');
  // Gespeichert wird im Hintergrund; erst wenn die Datenbank den Wert liefert, neu laden (in
  // WebKit lud der Test sonst manchmal vor dem Speichern neu und sah wieder 8).
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>((resolve) => {
            const open = indexedDB.open('fitness');
            open.onsuccess = () => {
              const db = open.result;
              const names = Array.from(db.objectStoreNames);
              const store = names.find((n) => n === 'programs');
              if (!store) {
                resolve(false);
                return;
              }
              const all = db.transaction(store).objectStore(store).getAll();
              all.onsuccess = () => {
                resolve(JSON.stringify(all.result).includes('"repsMax":10'));
              };
              all.onerror = () => {
                resolve(false);
              };
            };
            open.onerror = () => {
              resolve(false);
            };
          }),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A' })).toBeVisible();
  await expect(page.getByLabel('Wdh. bis, Satz 3, Kniebeuge mit Langhantel')).toHaveValue('10');
  const names = await page.locator('main h3').allTextContents();
  expect(names.indexOf('Unterarmstütz (Plank)')).toBe(names.indexOf('Beinbeuger liegend') - 1);

  // Das Original bleibt unverändert.
  await openPage(page, '/training/vorlagen/full_body_ab');
  await expect(
    page
      .getByRole('region', { name: 'Tag A' })
      .getByText('2 Aufwärmsätze, 3 Sätze · 6–8 Wdh. · Pause 2:30 min'),
  ).toBeVisible();
  await openPage(page, programPath);
  await expect(page.getByRole('link', { name: 'Bearbeiten' })).toBeVisible();
});

for (const theme of ['Hell', 'Dunkel'] as const) {
  test(`keine axe-Verstöße im Programm-Editor in „${theme}" (AK-UX-04 Basis)`, async ({ page }) => {
    test.slow();
    await chooseTheme(page, theme);
    const programPath = await adoptSample(page);
    await expectNoAxeViolations(page, programPath);
    await openPage(page, `${programPath}/bearbeiten`);
    await expectNoAxeViolations(page, 'Editor');
    await page
      .getByRole('link', { name: /^Tag A bearbeiten/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tag A' })).toBeVisible();
    await expectNoAxeViolations(page, 'Tag');
    await openPage(page, '/training/programme');
    await expectNoAxeViolations(page, 'Liste');
  });
}
