import { expect, openPage, test } from './fixtures';

test('Einkaufsliste: aus „Meine Küche“, eintragen, abhaken, neu laden, offline (D-287)', async ({
  page,
  context,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung');
  await page.getByRole('button', { name: /Meine Küche/ }).click();
  await page.getByRole('link', { name: /Einkaufsliste/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einkaufsliste' })).toBeVisible();

  const field = page.getByLabel('Was möchtest du einkaufen?');
  const boxes = page.getByRole('checkbox');
  for (const [index, text] of ['500 g Hähnchenbrust', '6 Bananen', 'Klopapier'].entries()) {
    await field.fill(text);
    await field.press('Enter');
    await expect(boxes).toHaveCount(index + 1);
    await expect(field).toHaveValue('');
  }
  await expect(page.getByText('500 g', { exact: true })).toBeVisible();
  await expect(page.getByText('6 Stück', { exact: true })).toBeVisible();

  await page.getByText('Bananen', { exact: true }).click();
  await expect(page.getByText('1 von 3 gekauft')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 von 3 gekauft')).toBeVisible();
  await expect(boxes).toHaveCount(2); // Gekaufte eingeklappt

  await page.getByText('Nach Kategorie', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Haushalt' })).toContainText('Klopapier');

  // Offline: erst wenn der Service Worker die Seite steuert (wie resilience.spec.ts).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await expect(boxes).toHaveCount(2);
  await context.setOffline(true);
  await field.fill('Reis 1 kg');
  await field.press('Enter');
  await expect(boxes).toHaveCount(3);
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText('1 von 4 gekauft')).toBeVisible();

  // Nichts davon zählt als gegessen.
  await openPage(page, '/ernaehrung');
  await expect(page.getByText('0 kcal').first()).toBeVisible();
});

test('Einkaufsliste: kleiner Bildschirm ohne Überlauf (D-287)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openPage(page, '/ernaehrung/einkaufsliste');
  const field = page.getByLabel('Was möchtest du einkaufen?');
  await field.fill('Eine ziemlich lange Bezeichnung für einen Artikel 1 Packung');
  await field.press('Enter');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('button', { name: /bearbeiten$/ }).click();
  await expect(page.getByLabel('Menge')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test('„Heute“: runde Knöpfe mittig in „Ernährung heute“, Einkaufswagen öffnet die Einkaufsliste', async ({
  page,
}) => {
  await openPage(page, '/heute');
  for (const name of ['Barcode scannen', 'Zur Ernährung', 'Einkaufsliste']) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    // Rund und klein: 48 × 48 px, das Symbol in voller Größe.
    expect(box?.width).toBe(48);
    expect(box?.height).toBe(48);
    expect((await link.locator('svg').boundingBox())?.width).toBe(20);
  }
  // Mittig: links und rechts gleich viel Platz in der Zeile.
  const row = await page.getByRole('link', { name: 'Barcode scannen' }).locator('..').boundingBox();
  const first = await page.getByRole('link', { name: 'Barcode scannen' }).boundingBox();
  const last = await page.getByRole('link', { name: 'Einkaufsliste', exact: true }).boundingBox();
  if (!row || !first || !last) throw new Error('Knöpfe nicht gefunden');
  const left = first.x - row.x;
  const right = row.x + row.width - (last.x + last.width);
  expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  await page.getByRole('link', { name: 'Einkaufsliste', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einkaufsliste' })).toBeVisible();
});
