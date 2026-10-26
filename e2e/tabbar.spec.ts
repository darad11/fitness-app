import { expect, openPage, test } from './fixtures';

test('Tab-Leiste: Ziehen mit der Linse wählt beim Loslassen, Tippen wie gewohnt (D-272)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Tab-Leiste nur unter 1024 px');
  await openPage(page, '/heute');
  const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
  const from = await bar.getByRole('link', { name: 'Heute' }).boundingBox();
  const to = await bar.getByRole('link', { name: 'Ernährung' }).boundingBox();
  if (!from || !to) throw new Error('Leiste fehlt');
  const y = from.y + from.height / 2;
  await page.mouse.move(from.x + from.width / 2, y);
  await page.mouse.down();
  // Linse erscheint unter dem Finger.
  await expect(bar).toHaveClass(/lens-active/);
  await page.mouse.move(to.x + to.width / 2, y, { steps: 12 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/ernaehrung$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  // Danach legt sich die Linse wieder als Auswahl ab.
  await expect(bar).not.toHaveClass(/lens-active/);

  await bar.getByRole('link', { name: 'Training' }).click();
  await expect(page).toHaveURL(/\/training$/);
});

test('Tab-Leiste: Die Linse legt sich auch bei zwei Bildern je Sekunde binnen 2 s ab (D-344)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Tab-Leiste nur unter 1024 px');
  // Wie ein ausgelasteter Rechner oder ein älteres Gerät: nur alle 500 ms ein Bild.
  await page.addInitScript(() => {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => {
        callback(performance.now());
      }, 500);
    window.cancelAnimationFrame = (handle) => {
      window.clearTimeout(handle);
    };
  });
  await openPage(page, '/heute');
  const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
  const from = await bar.getByRole('link', { name: 'Heute' }).boundingBox();
  const to = await bar.getByRole('link', { name: 'Ernährung' }).boundingBox();
  if (!from || !to) throw new Error('Leiste fehlt');
  const y = from.y + from.height / 2;
  await page.mouse.move(from.x + from.width / 2, y);
  await page.mouse.down();
  await expect(bar).toHaveClass(/lens-active/);
  await page.mouse.move(to.x + to.width / 2, y, { steps: 12 });
  const released = Date.now();
  await page.mouse.up();
  await expect(bar).not.toHaveClass(/lens-active/, { timeout: 10_000 });
  expect(Date.now() - released).toBeLessThan(2000);
  await expect(page).toHaveURL(/\/ernaehrung$/);
});

test('Seitenleiste: klappt unter der Maus aus, der Inhalt rückt mit (D-272)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'), 'Seitenleiste ab 1024 px');
  await openPage(page, '/heute');
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' }).first();
  // Eingeklappt: nur die grüne Kachel, 28 px, mittig über den Symbolen (D-325).
  const tile = nav.locator('img[src="/brand/kachel-kompakt.svg"]');
  const logo = nav.getByRole('img', { name: 'FORM' });
  await expect(tile).toBeVisible();
  await expect(logo).toHaveCSS('opacity', '0');
  const [tileBox, iconBox] = [
    await tile.boundingBox(),
    await nav.getByRole('link', { name: 'Heute' }).locator('svg').boundingBox(),
  ];
  expect(Math.round(tileBox?.height ?? 0)).toBe(28);
  expect(
    Math.abs((tileBox?.x ?? 0) + (tileBox?.width ?? 0) / 2 - (iconBox?.x ?? 0) - 10),
  ).toBeLessThanOrEqual(1);
  const title = page.getByRole('heading', { level: 1, name: 'Heute' });
  const before = (await title.boundingBox())?.x ?? 0;
  await nav.hover();
  await expect.poll(async () => (await title.boundingBox())?.x ?? 0).toBeGreaterThan(before + 150);
  await expect(page.getByText('Ernährung', { exact: true }).first()).toBeVisible();
  // Ausgeklappt: das ganze Logo, seine Kachel liegt genau auf der eingeklappten.
  await expect(logo).toHaveCSS('opacity', '1');
  const logoBox = await logo.boundingBox();
  expect(Math.abs((logoBox?.x ?? 0) - (tileBox?.x ?? 0))).toBeLessThanOrEqual(0.5);
  expect(Math.abs((logoBox?.y ?? 0) - (tileBox?.y ?? 0))).toBeLessThanOrEqual(0.5);
  expect(Math.round(logoBox?.height ?? 0)).toBe(28);
});

test('Tab-Leiste: beim Runterscrollen ein Kreis rechts, zurück beim Hochscrollen und per Tipp (D-276)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Tab-Leiste nur unter 1024 px');
  await openPage(page, '/heute');
  const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
  const full = await bar.boundingBox();
  if (!full) throw new Error('Leiste fehlt');
  // Eigenes Scrollen: Taste, dann Bewegung (wie Finger oder Mausrad).
  const scrollBy = (dy: number) =>
    page.evaluate((delta) => {
      const key = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      // WebKit meldet das Scrollen auf einem ausgelasteten Runner manchmal erst nach mehr als
      // 0,6 s; wie beim gedrückt gehaltenen Pfeil kommt die Taste unmittelbar vor der Meldung
      // noch einmal (Erfassung vor dem Listener der App auf window).
      window.addEventListener('scroll', key, { capture: true, once: true });
      key();
      // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
      document.getElementById('seite')?.scrollBy(0, delta);
    }, dy);
  await scrollBy(300);
  await expect(bar).toHaveClass(/minimized/);
  await expect.poll(async () => (await bar.boundingBox())?.width ?? 0).toBeLessThan(full.width / 3);
  const small = await bar.boundingBox();
  expect((small?.x ?? 0) + (small?.width ?? 0)).toBeGreaterThan(full.x + full.width - 40);
  // Nur das aktive Symbol bleibt erreichbar.
  await expect(bar.getByRole('link', { name: 'Training' })).toBeHidden();

  await scrollBy(-100);
  await expect(bar).not.toHaveClass(/minimized/);

  // Tipp auf den Kreis klappt auf, ohne die Seite zu wechseln.
  await scrollBy(300);
  await expect(bar).toHaveClass(/minimized/);
  await expect.poll(async () => (await bar.boundingBox())?.width ?? 0).toBeLessThan(80);
  await bar.click();
  await expect(bar).not.toHaveClass(/minimized/);
  await expect(page).toHaveURL(/\/heute$/);
});
