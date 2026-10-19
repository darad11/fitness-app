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

test('Seitenleiste: klappt unter der Maus aus, der Inhalt rückt mit (D-272)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'), 'Seitenleiste ab 1024 px');
  await openPage(page, '/heute');
  const title = page.getByRole('heading', { level: 1, name: 'Heute' });
  const before = (await title.boundingBox())?.x ?? 0;
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).first().hover();
  await expect.poll(async () => (await title.boundingBox())?.x ?? 0).toBeGreaterThan(before + 150);
  await expect(page.getByText('Ernährung', { exact: true }).first()).toBeVisible();
});
