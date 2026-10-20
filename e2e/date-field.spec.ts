import { expect, openPage, test } from './fixtures';
import type { Locator } from '@playwright/test';

async function staysInside(field: Locator, other?: Locator) {
  const box = await field.boundingBox();
  const parent = await field.locator('xpath=..').boundingBox();
  expect(box && parent).toBeTruthy();
  if (!box || !parent) return;
  expect(box.x + box.width).toBeLessThanOrEqual(parent.x + parent.width + 0.5);
  if (other) {
    const next = await other.boundingBox();
    expect(next).toBeTruthy();
    if (next) expect(box.x + box.width).toBeLessThanOrEqual(next.x + 0.5);
  }
}

test('Nachtragen: Datumsfeld bleibt in seiner Spalte (D-282)', async ({ page }) => {
  await openPage(page, '/training/nachtragen');
  await staysInside(page.locator('#kraft-zeit'), page.locator('#kraft-dauer'));
  await page.getByText('Aktivität', { exact: true }).first().click();
  await staysInside(page.locator('#aktivitaet-zeit'));
});
