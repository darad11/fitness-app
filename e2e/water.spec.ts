import { expect, openPage, pageOverflowX, test } from './fixtures';

test('Wasser: auf „Heute“ eintragen, neu laden, offline, nächster Tag, Verlauf (D-289)', async ({
  page,
  context,
}) => {
  test.slow();
  await page.clock.install({ time: new Date('2026-10-20T08:00:00+02:00') });
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Wasser' });
  await expect(card).toContainText('Noch 2 l bis zum Tagesziel.');
  // Direkt unter „Ernährung heute“ (Wunsch des Produktinhabers, D-289).
  await expect(page.getByText('Ernährung heute')).toBeVisible();
  const order = await page
    .getByRole('main')
    .locator('section')
    .evaluateAll((sections) => sections.map((s) => s.textContent));
  const index = order.findIndex((text) => text.startsWith('Wasser'));
  expect(order[index - 1]).toContain('Ernährung heute');

  await card.getByRole('button', { name: '250 ml hinzufügen' }).click();
  await card.getByRole('button', { name: '500 ml hinzufügen' }).click();
  await expect(card).toContainText('Noch 1,25 l bis zum Tagesziel.');
  await page.reload();
  await expect(card).toContainText('750 ml');
  await expect(card).toContainText('Noch 1,25 l bis zum Tagesziel.');

  // Offline: erst wenn der Service Worker die Seite steuert.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await card.getByRole('button', { name: 'Eigene Menge' }).click();
  await card.getByLabel('Menge').fill('1,25 l');
  await card.getByLabel('Menge').press('Enter');
  await expect(card).toContainText('Tagesziel erreicht.');
  await context.setOffline(false);

  // Nächster Tag: beginnt bei 0, gestern bleibt im Verlauf.
  await page.clock.setSystemTime(new Date('2026-10-21T08:00:00+02:00'));
  await page.reload();
  await expect(card).toContainText('Noch 2 l bis zum Tagesziel.');
  await card.getByRole('link', { name: /Wasser: Einträge, Ziel und Verlauf/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wasser' })).toBeVisible();
  const verlauf = page.getByRole('region', { name: 'Verlauf' });
  await expect(verlauf).toContainText('1 von 1');
  await expect(verlauf).toContainText('2 l');
  await expect(verlauf).toContainText('5 Tage ohne Eintrag');

  // Nichts davon zählt als gegessen.
  await openPage(page, '/ernaehrung');
  await expect(page.getByText('0 kcal').first()).toBeVisible();
});

test('Wasser: Tagesaufgabe „mit Wasserziel abhaken“ (D-289)', async ({ page }) => {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill('2 l Wasser');
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  // Die Regel steht in der Detailansicht der Aufgabe (D-335).
  await list.getByRole('link', { name: '2 l Wasser bearbeiten' }).click();
  const settings = page.getByRole('region', { name: 'Einstellungen' });
  await settings.getByText('Mit Wasserziel abhaken', { exact: true }).click();
  await settings.getByRole('button', { name: 'Speichern' }).click();
  await expect(settings.getByText('Gespeichert.')).toBeVisible();
  await page.getByRole('link', { name: 'Tagesaufgaben', exact: true }).click();
  await expect(
    list.getByRole('link', { name: '2 l Wasser bearbeiten' }),
  ).toHaveAccessibleDescription('Täglich · mit Wasserziel abhaken');

  await openPage(page, '/heute');
  const tasks = page.getByRole('region', { name: 'Tagesaufgaben' });
  const water = page.getByRole('region', { name: 'Wasser' });
  await expect(tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' })).not.toBeChecked();
  await water.getByRole('button', { name: '750 ml hinzufügen' }).click();
  await water.getByRole('button', { name: '750 ml hinzufügen' }).click();
  await expect(tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' })).not.toBeChecked();
  await water.getByRole('button', { name: '500 ml hinzufügen' }).click();
  await expect(tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' })).toBeChecked();
  // Von Hand zurücknehmen bleibt möglich und ändert die Wassermenge nicht.
  await tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' }).click();
  await expect(tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' })).not.toBeChecked();
  await expect(water).toContainText('2 l');
  await page.reload();
  await expect(tasks.getByRole('checkbox', { name: '2 l Wasser abhaken' })).not.toBeChecked();
});

test('Wasser: kleiner Bildschirm ohne Überlauf (D-289)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ['/heute', '/ernaehrung/wasser']) {
    await openPage(page, path);
    await page.getByRole('button', { name: '750 ml hinzufügen' }).first().click();
    await expect(page.getByText(/von 2 l/).first()).toBeVisible();
    const overflow = await pageOverflowX(page);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
