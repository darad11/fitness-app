import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Übungsdetails breit (D-499): Duo aufgeklappt steht die Muskelkarte direkt neben der Animation,
 * im Reiter „Muskeln“ dann nur die Angaben. Zugeklappt und am iPhone wie bisher: die Animation
 * allein oben, die Karte im Reiter. Fenster wie am Gerät gemessen (D-393).
 */
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height, width: b.width };
}

async function openDetails(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await openPage(page, '/uebungen');
  await page
    .getByRole('link', { name: /^Latziehen/ })
    .first()
    .click();
  await expect(page.locator('[data-demo-frame]')).toBeVisible();
}

for (const [label, width, height] of [
  ['Duo aufgeklappt quer', 867, 669],
  ['Duo aufgeklappt hoch', 669, 869],
] as const) {
  test(`${label}: Muskelkarte direkt neben der Animation, oben bündig`, async ({ page }) => {
    await openDetails(page, width, height);
    const frame = await box(page.locator('[data-demo-frame]'));
    const beside = page.locator('[data-muscle-map-beside]');
    const map = beside.getByRole('img', { name: /^Muskelkarte\. Hauptmuskeln: Latissimus/ });
    await expect(map).toBeVisible();
    const card = await box(beside);
    // Daneben mit dem Abstand der Spalten (1,25 rem), oben auf einer Linie.
    expect(card.left - frame.right).toBeGreaterThanOrEqual(19);
    expect(card.left - frame.right).toBeLessThanOrEqual(21);
    expect(Math.abs(card.top - frame.top)).toBeLessThanOrEqual(1);
    // So hoch wie die Animation: Die Reiter darunter rücken nicht weiter nach unten.
    expect(Math.abs(card.bottom - frame.bottom)).toBeLessThanOrEqual(1);
    expect(card.right).toBeLessThanOrEqual(width);
    // Im Reiter „Muskeln“ keine zweite Karte, die Angaben bleiben.
    await page.getByRole('tab', { name: 'Muskeln' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Muskeln' });
    await expect(panel.getByText('Hauptmuskeln')).toBeVisible();
    await expect(panel.getByRole('img', { name: /^Muskelkarte/ })).toHaveCount(0);
    await expect(page.getByRole('img', { name: /^Muskelkarte/ })).toHaveCount(1);
  });
}

for (const [label, width, height] of [
  ['Duo zugeklappt', 382, 678],
  ['iPhone', 390, 844],
] as const) {
  test(`${label}: wie bisher, Animation allein oben, Karte im Reiter`, async ({ page }) => {
    await openDetails(page, width, height);
    await expect(page.locator('[data-muscle-map-beside]')).toHaveCount(0);
    const frame = await box(page.locator('[data-demo-frame]'));
    // Die Animation nimmt die Breite der Seite (Seitenrand 20 px).
    expect(frame.width).toBeGreaterThan(width - 2 * 20 - 2);
    await page.getByRole('tab', { name: 'Muskeln' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Muskeln' });
    await expect(
      panel.getByRole('img', { name: /^Muskelkarte\. Hauptmuskeln: Latissimus/ }),
    ).toBeVisible();
  });
}

test('Auf- und Zuklappen: die Karte wechselt den Ort, ohne neu zu laden', async ({ page }) => {
  await openDetails(page, 382, 678);
  await expect(page.locator('[data-muscle-map-beside]')).toHaveCount(0);
  await page.setViewportSize({ width: 867, height: 669 });
  await expect(page.locator('[data-muscle-map-beside]').getByRole('img')).toBeVisible();
  await page.setViewportSize({ width: 382, height: 678 });
  await expect(page.locator('[data-muscle-map-beside]')).toHaveCount(0);
});
