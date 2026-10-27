import type { Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Tab-Leiste beim iPhone Duo (D-373): wie am iPhone schrumpfen, aufgehen, Linse beim Ziehen
// mitführen, Auswahl unter dem aktiven Tab. Läuft in Chromium und WebKit (Handy-Profil).
test.skip(({ isMobile }) => !isMobile, 'Tab-Leiste nur im Handy-Profil');

/** Eigenes Scrollen wie in e2e/tabbar.spec.ts: Taste, dann Bewegung. */
async function scrollBy(page: Page, dy: number) {
  await page.evaluate((delta) => {
    const key = () =>
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: delta > 0 ? 'ArrowDown' : 'ArrowUp' }),
      );
    window.addEventListener('scroll', key, { capture: true, once: true });
    key();
    // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
    document.getElementById('seite')?.scrollBy(0, delta);
  }, dy);
}

function tabBar(page: Page) {
  return page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
}

test('Duo: Aufklappen im Kreis, danach liegt die Auswahl unter dem aktiven Tab (D-373)', async ({
  page,
}) => {
  await openPage(page, '/ernaehrung');
  await setDuoPose(page, 'zu');
  const bar = tabBar(page);
  await scrollBy(page, 300);
  await expect(bar).toHaveClass(/minimized/);
  // Aufklappen, während die Leiste ein Kreis ist; danach hochscrollen.
  await setDuoPose(page, 'auf');
  await scrollBy(page, -200);
  await expect(bar).not.toHaveClass(/collapsed/);
  const active = bar.getByRole('link', { name: 'Ernährung' });
  const pill = bar.locator('.tabbar-indicator');
  // Die Auswahl ragt 4 px über ihren Eintrag hinaus (PILL_OUTSET).
  await expect
    .poll(async () => {
      const [tab, box] = [await active.boundingBox(), await pill.boundingBox()];
      if (!tab || !box) return Infinity;
      return Math.max(Math.abs(box.x - (tab.x - 4)), Math.abs(box.width - (tab.width + 8)));
    })
    .toBeLessThanOrEqual(1);
});

test('Duo: Tipp beim Aufgehen aus dem Kreis, danach führt das Ziehen die Linse richtig (D-373, E-15)', async ({
  page,
}) => {
  await openPage(page, '/training');
  await setDuoPose(page, 'zu');
  const bar = tabBar(page);
  await scrollBy(page, 400);
  await expect(bar).toHaveClass(/minimized/);
  await expect.poll(async () => (await bar.boundingBox())?.width ?? 0).toBeLessThan(80);
  const circle = await bar.boundingBox();
  if (!circle) throw new Error('Kreis fehlt');
  // Tipp auf den Kreis klappt auf; ein zweiter Tipp folgt, während die Leiste noch aufgeht.
  await page.mouse.click(circle.x + circle.width / 2, circle.y + circle.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await expect(bar).not.toHaveClass(/collapsed/);
  await expect(bar).not.toHaveClass(/lens-active/);

  const from = await bar.getByRole('link', { name: 'Heute' }).boundingBox();
  const to = await bar.getByRole('link', { name: 'Fortschritt' }).boundingBox();
  if (!from || !to) throw new Error('Leiste fehlt');
  const y = from.y + from.height / 2;
  await page.mouse.move(from.x + from.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, y, { steps: 12 });
  // Die Linse liegt unter dem Finger (die Leiste wächst beim Berühren leicht, daher 12 px).
  await expect
    .poll(() =>
      page.evaluate(() => {
        const lens = document.querySelector('.tabbar-lens')?.getBoundingClientRect();
        return lens ? lens.left + lens.width / 2 : -1;
      }),
    )
    .toBeGreaterThan(to.x + to.width / 2 - 12);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/fortschritt$/);
});

test('Tab-Leiste: Loslassen außerhalb der Leiste beendet die Linse (D-376)', async ({ page }) => {
  await openPage(page, '/heute');
  const bar = tabBar(page);
  const tab = await bar.getByRole('link', { name: 'Training' }).boundingBox();
  if (!tab) throw new Error('Leiste fehlt');
  await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
  await page.mouse.down();
  await expect(bar).toHaveClass(/lens-active/);
  // Wie wenn die Leiste unter dem Zeiger weggleitet: Das Loslassen trifft die Seite, nicht die
  // Leiste (ohne Ziehen fängt die Leiste den Zeiger nicht).
  await page.evaluate(() => {
    document.body.dispatchEvent(
      new PointerEvent('pointerup', { pointerId: 1, isPrimary: true, bubbles: true }),
    );
  });
  await expect(bar).not.toHaveClass(/lens-active/, { timeout: 3000 });
  // Echte Maus aufräumen, außerhalb der Leiste: kein Klick, kein Wechsel.
  await page.mouse.move(tab.x + tab.width / 2, tab.y - 200);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/heute$/);
});
