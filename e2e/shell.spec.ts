import { chooseTheme, expect, mainNav, openPage, test } from './fixtures';

test('leitet auf „Heute" um und zeigt das Datum ohne Status und „Diese Version“ (D-265)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/heute$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
  await expect(
    page.getByText(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag), /),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Status' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Diese Version' })).toHaveCount(0);
});

test('zeigt in der Navigation nur verfügbare Bereiche (AK-UX-01)', async ({ page }) => {
  await openPage(page, '/heute');
  await expect(mainNav(page).getByRole('link')).toHaveText([
    'Heute',
    'Training',
    'Ernährung',
    'Fortschritt',
    'Mehr',
  ]);
  await mainNav(page).getByRole('link', { name: 'Mehr' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mehr' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link')).toHaveText([
    'Profil und Ziele',
    'Einstellungen',
    'Synchronisierung',
    'Über die App',
  ]);
  // Daten, Installieren und Schritte stehen in den Einstellungen (D-280).
  await page.getByRole('main').getByRole('link', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('list', { name: 'Weiteres' }).getByRole('link')).toHaveText([
    'Daten und Sicherung',
    'Installieren',
    'Schritte aus dem Dashboard',
  ]);
});

test('speichert die Darstellung „Dunkel" über einen Neustart (D-212, AK-SET-03 Basis)', async ({
  page,
}) => {
  await chooseTheme(page, 'Dunkel');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#212a3f');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(33, 42, 63)',
  );
  await chooseTheme(page, 'Hell');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('formatiert nach Gerätesprache de-AT mit „Jänner" (AK-SET-04)', async ({ page }) => {
  await openPage(page, '/mehr/einstellungen');
  await expect(
    page.getByText(/Beispiel: 17\. Jänner 2026 · 21:05 · 1\s234,5 · 72,5\skg/),
  ).toBeVisible();
  await page.getByLabel('Datum und Zahlen').selectOption('de-DE');
  await expect(page.getByText(/Beispiel: 17\. Januar 2026 · 21:05 · 1\.234,5/)).toBeVisible();
});

test('meldet unbekannte Adressen mit Weg zurück', async ({ page }) => {
  await openPage(page, '/gibt-es-nicht');
  await expect(page.getByRole('heading', { level: 1, name: 'Seite nicht gefunden' })).toBeVisible();
  await page.getByRole('link', { name: 'Zu Heute' }).click();
  await expect(page).toHaveURL(/\/heute$/);
});

test('zeigt Version, Build und Speicher-ID', async ({ page }) => {
  await openPage(page, '/mehr/ueber');
  await expect(page.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible();
  await expect(page.getByText(/^[0-9a-f]{8}$/)).toBeVisible();
});

test('Daten und Sicherung: Export lädt eine JSON-Datei herunter (AK-DAT-01, AK-PWA-05)', async ({
  page,
}) => {
  await openPage(page, '/mehr/einstellungen');
  await page.getByRole('link', { name: 'Daten und Sicherung' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Daten und Sicherung' })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByText(/^Belegt: /)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Jetzt exportieren' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^fitness-sicherung-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  const content = JSON.parse(
    await (await file.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()),
  ) as {
    format: string;
    data: Record<string, unknown[]>;
  };
  expect(content.format).toBe('fitness-app-backup');
  expect(Object.keys(content.data)).toContain('session');
  await expect(page.getByText('Die Datei wurde heruntergeladen.')).toBeVisible();
  await expect(page.getByText(/^Letzter Export: /)).toBeVisible();
});

test('Logo und Name am Handy auf jeder Seite links oben, führt zu „Heute“ (D-280, D-286)', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Am Desktop zeigt die Seitenleiste beides');
  for (const path of [
    '/heute',
    '/training',
    '/ernaehrung',
    '/fortschritt',
    '/mehr/einstellungen',
  ]) {
    await openPage(page, path);
    const brand = page.getByRole('main').getByRole('link', { name: 'Fitness, zu „Heute“' });
    await expect(brand).toBeVisible();
    const logo = await brand.boundingBox();
    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect((logo?.y ?? 0) + (logo?.height ?? 0)).toBeLessThanOrEqual(title?.y ?? 0);
    expect(logo?.x ?? 99).toBeLessThan(30);
  }
  await page.getByRole('main').getByRole('link', { name: 'Fitness, zu „Heute“' }).click();
  await expect(page).toHaveURL(/\/heute$/);
});
