import type { Locator, Page } from '@playwright/test';
import { setDuoPose, safeRight, type DuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// iPhone Duo (D-372): Statusleiste, Dynamic Island und Kamera liegen an der Seite. Den sicheren
// Bereich stellt nur Chromium nach (D-371); die Prüfmaße stehen in e2e/duo.ts.
test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || !isMobile,
  'Sicherer Bereich nur in Chromium nachstellbar; Handy-Profil',
);

/** Rechter Rand eines Elements im Fenster. */
async function rightEdge(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element ohne Ausmaße');
  return box.x + box.width;
}

async function expectInsideSafeArea(locator: Locator, pose: DuoPose) {
  expect(await rightEdge(locator)).toBeLessThanOrEqual(safeRight(pose) + 0.5);
}

/** Eigenes Scrollen wie in e2e/tabbar.spec.ts: Taste, dann Bewegung. */
async function scrollBy(page: Page, dy: number) {
  await page.evaluate((delta) => {
    const key = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.addEventListener('scroll', key, { capture: true, once: true });
    key();
    window.scrollBy(0, delta);
  }, dy);
}

for (const pose of ['zu', 'auf'] as const) {
  test(`Duo ${pose}: Tab-Leiste und Kreis bleiben neben dem Systemrand, jeder Tipp trifft (D-372)`, async ({
    page,
  }) => {
    await openPage(page, '/heute');
    await setDuoPose(page, pose);
    const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
    for (const name of ['Heute', 'Training', 'Ernährung', 'Fortschritt', 'Mehr']) {
      await expectInsideSafeArea(bar.getByRole('link', { name }), pose);
    }
    await scrollBy(page, 400);
    await expect(bar).toHaveClass(/minimized/);
    await expect.poll(async () => (await bar.boundingBox())?.width ?? 0).toBeLessThan(80);
    await expectInsideSafeArea(bar, pose);
    // Tipp auf die Mitte des Kreises klappt auf.
    const circle = await bar.boundingBox();
    if (!circle) throw new Error('Kreis fehlt');
    await page.mouse.click(circle.x + circle.width / 2, circle.y + circle.height / 2);
    await expect(bar).not.toHaveClass(/minimized/);
    // Nach dem Aufklappen (0,4 s) trifft ein Tipp in die Mitte des äußersten Tabs rechts.
    await expect(bar).not.toHaveClass(/collapsed/);
    const more = await bar.getByRole('link', { name: 'Mehr' }).boundingBox();
    if (!more) throw new Error('Tab fehlt');
    await page.mouse.click(more.x + more.width / 2, more.y + more.height / 2);
    await expect(page).toHaveURL(/\/mehr$/);
  });
}

test('Duo zu: Blatt, Rückfrage und Hinweis bleiben neben dem Systemrand (D-372)', async ({
  page,
}) => {
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await setDuoPose(page, 'zu');
  // Blatt über die ganze Breite: Schließen und Kamerabild im sicheren Bereich.
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  const scanner = page.getByRole('dialog', { name: 'Barcode scannen' });
  await expectInsideSafeArea(scanner.getByRole('button', { name: 'Schließen' }), 'zu');
  await expectInsideSafeArea(scanner.locator('video'), 'zu');
  await scanner.getByRole('button', { name: 'Schließen' }).click();
  await expect(scanner).toBeHidden();

  // Hinweis mit „Rückgängig“.
  await openPage(page, '/heute');
  const water = page.getByRole('region', { name: 'Wasser' });
  await water.getByRole('button', { name: /250 ml hinzufügen/ }).click();
  await water.getByRole('button', { name: /^Letzten Eintrag entfernen/ }).click();
  const toast = page.getByRole('status').filter({ hasText: 'Rückgängig' });
  await expectInsideSafeArea(toast.getByRole('button', { name: 'Rückgängig' }), 'zu');

  // Rückfrage in der Mitte: ganz im sicheren Bereich.
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await page.getByRole('button', { name: 'Training verwerfen', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Training verwerfen?' });
  await expect(confirm).toBeVisible();
  const box = await confirm.boundingBox();
  if (!box) throw new Error('Rückfrage fehlt');
  expect(box.x).toBeGreaterThanOrEqual(0);
  await expectInsideSafeArea(confirm, 'zu');
  // Mittig zwischen den Rändern des sicheren Bereichs.
  expect(Math.abs(box.x - (safeRight('zu') - box.x - box.width))).toBeLessThanOrEqual(1);
});
