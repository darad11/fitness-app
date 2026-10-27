import { expect, openPage, test } from './fixtures';

// Tastatur am Desktop (D-384): Die Seite scrollt im Rahmen der App. Ohne Fokus scrollen Bild ab,
// Leertaste, Pfeile, Pos1 und Ende trotzdem die Seite, wie zuvor das Fenster; in einem Feld bleibt
// die Leertaste ein Zeichen. Desktop-Profil.
test.skip(({ isMobile }) => isMobile, 'Desktop-Profil');

test('Scroll-Tasten ohne Fokus scrollen den Rahmen, nicht das Fenster (D-384)', async ({
  page,
}) => {
  await openPage(page, '/uebungen');
  const top = () => page.evaluate(() => document.getElementById('seite')?.scrollTop ?? -1);
  const end = () =>
    page.evaluate(() => {
      const frame = document.getElementById('seite');
      return frame ? frame.scrollHeight - frame.clientHeight : -1;
    });
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);

  await page.keyboard.press('PageDown');
  await expect.poll(top, 'Bild ab').toBeGreaterThan(300);
  const afterPage = await top();
  await page.keyboard.press('ArrowDown');
  await expect.poll(top, 'Pfeil').toBeGreaterThan(afterPage);
  await page.keyboard.press('End');
  await expect.poll(async () => (await end()) - (await top()), 'Ende').toBeLessThanOrEqual(1);
  await page.keyboard.press('Home');
  await expect.poll(top, 'Pos1').toBe(0);
  await page.keyboard.press('Space');
  await expect.poll(top, 'Leertaste').toBeGreaterThan(300);
  expect(await page.evaluate(() => window.scrollY), 'Fenster bleibt oben').toBe(0);

  // In einem Feld schreibt die Leertaste, die Seite bleibt stehen.
  await page.keyboard.press('Home');
  await expect.poll(top).toBe(0);
  const search = page.getByLabel('Übungen suchen');
  await search.fill('bank');
  await search.press('Space');
  await expect(search).toHaveValue('bank ');
  expect(await top()).toBe(0);
});
