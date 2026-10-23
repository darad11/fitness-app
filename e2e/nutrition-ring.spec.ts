import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/** Ernährung (F5 Abschnitt 5, D-326): Ring mit Makros, Datumszeile, Hinweis, Aktuelles Ziel. */

async function setTarget(page: Page) {
  await openPage(page, '/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2390');
  await page.getByLabel('Eiweiß (g)').fill('162');
  await page.getByLabel('Kohlenhydrate (g)').fill('256');
  await page.getByLabel('Fett (g)').fill('80');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await expect(page.getByText(/^2\D?390 kcal$/)).toBeVisible();
}

async function quickEntry(page: Page, kcal: string, macros?: [string, string, string]) {
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Energie (kcal)').fill(kcal);
  if (macros) {
    await quick.getByLabel('Eiweiß (g, optional)').fill(macros[0]);
    await quick.getByLabel('Kohlenhydrate (g, optional)').fill(macros[1]);
    await quick.getByLabel('Fett (g, optional)').fill(macros[2]);
  }
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(quick).toBeHidden();
}

const ring = (page: Page) => page.getByRole('main').getByRole('img', { name: /kcal/ }).first();
const parts = (page: Page) =>
  ring(page)
    .locator('circle[data-part]')
    .evaluateAll((circles) => circles.map((c) => c.getAttribute('data-part')));

test('Ring mit Makros: Spur bei 0, Abschnitte nach Anteil, Grau ab 5 %, voll über dem Ziel', async ({
  page,
}) => {
  test.slow();
  await page.clock.install({ time: new Date('2026-10-22T09:00:00+02:00') });
  await setTarget(page);

  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(/^0 von 2\D?390 kcal$/);
  expect(await parts(page)).toEqual([]);
  await expect(page.getByText(/^noch 2\D?390 kcal$/)).toBeVisible();

  // Beispiel aus dem Auftrag: 46 g Eiweiß, 17 g Kohlenhydrate, 51 g Fett, 732 kcal.
  await quickEntry(page, '732', ['46', '17', '51']);
  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(
    /^732 von 2\D?390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459$/,
  );
  expect(await parts(page)).toEqual(['protein', 'carbs', 'fat']);
  await expect(ring(page).locator('circle[data-cap]')).toHaveCount(2);
  await expect(ring(page)).toContainText('732');
  await expect(ring(page)).toContainText(/\/ 2\D?390 kcal/);
  // Drei Spalten mit Ist / Ziel unter dem Ring, darunter „noch x kcal“.
  const card = page.getByRole('region', { name: 'Gegessen' });
  const columns = card.locator('dl').first().locator(':scope > div');
  await expect(columns).toHaveCount(3);
  const [ringBox, first, third] = [
    await ring(page).boundingBox(),
    await columns.nth(0).boundingBox(),
    await columns.nth(2).boundingBox(),
  ];
  expect((first?.y ?? 0) - ((ringBox?.y ?? 0) + (ringBox?.height ?? 0))).toBeGreaterThan(0);
  expect(Math.abs((first?.y ?? 0) - (third?.y ?? 1))).toBeLessThan(1);
  await expect(card.getByText(/^noch 1\D?658 kcal$/)).toBeVisible();

  // Ohne Makros: 350 kcal von 1.082 sind über 5 %, also ein grauer Abschnitt am Ende.
  await quickEntry(page, '350');
  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(
    /^1\D?082 von 2\D?390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459, nicht zugeordnet 371$/,
  );
  expect(await parts(page)).toEqual(['protein', 'carbs', 'fat', 'other']);
  await expect(
    page.getByText(
      'Bei mindestens einem Eintrag fehlen Angaben zu Eiweiß, Kohlenhydrate, Zucker, Fett, gesättigte Fettsäuren, Ballaststoffe und Salz.',
    ),
  ).toBeVisible();

  // Über dem Ziel: voll, ohne runde Enden, neutral „x kcal über dem Tagesziel“.
  await quickEntry(page, '1600', ['100', '200', '40']);
  await openPage(page, '/ernaehrung');
  await expect(ring(page).locator('circle[data-cap]')).toHaveCount(0);
  const over = page.getByText(/^292 kcal über dem Tagesziel$/);
  await expect(over).toBeVisible();
  await expect(over).toHaveClass(/text-muted/);

  // „Heute“: dieselbe Komponente, kompakt, mit Einheit in der Mitte.
  await openPage(page, '/heute');
  const today = page.getByRole('region', { name: 'Ernährung heute' });
  const small = today.getByRole('img', { name: /kcal/ });
  await expect(small).toHaveAccessibleName(/^2\D?682 von 2\D?390 kcal, davon Eiweiß 584/);
  await expect(small).toContainText(/\/ 2\D?390 kcal/);
  expect(
    await small
      .locator('circle[data-part]')
      .evaluateAll((circles) => circles.map((c) => c.getAttribute('data-part'))),
  ).toEqual(['protein', 'carbs', 'fat', 'other']);
  await expect(today.getByText(/^292 kcal über dem Tagesziel$/)).toBeVisible();
});

for (const width of [360, 390, 768]) {
  test(`Datumszeile einzeilig, kein Überlauf (${String(width)} pt)`, async ({ page, isMobile }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.clock.install({ time: new Date('2026-10-22T09:00:00+02:00') });
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, '/ernaehrung');
    const line = page.getByText('Heute · Do., 22. Okt.', { exact: true });
    await expect(line).toBeVisible();
    const box = await line.boundingBox();
    const lineHeight = await line.evaluate((element) =>
      parseFloat(getComputedStyle(element).lineHeight),
    );
    expect(box?.height ?? 0).toBeLessThan(lineHeight * 1.5);
    await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
    await expect(page.getByText('Mi., 21. Okt.', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('„Aktuelles Ziel“ ohne Datum, Text folgt der Art des Ziels', async ({ page }) => {
  await setTarget(page);
  const current = page.getByRole('region', { name: /kcal/ }).first();
  await expect(current).toContainText('Selbst festgelegt');
  await expect(current).not.toContainText('Seit');
  // Vorschlag übernehmen: Der Text wechselt.
  await page.getByLabel('Geburtsjahr').fill('1990');
  await page.getByLabel('Größe (cm)').fill('180');
  await page.getByLabel('Gewicht (kg)').fill('80');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await page.getByRole('button', { name: 'Vorschlag übernehmen' }).click();
  await expect(current).toContainText('Aus Vorschlag übernommen');
  await expect(current).not.toContainText('Seit');
});
