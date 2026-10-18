import { chooseTheme, expect, mainNav, openPage, test } from './fixtures';

test('leitet auf „Heute" um und zeigt Datum und Status', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/heute$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
  await expect(
    page.getByText(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag), /),
  ).toBeVisible();
  await expect(page.getByText('Alle Daten bleiben auf diesem Gerät.')).toBeVisible();
});

test('zeigt in der Navigation nur verfügbare Bereiche (AK-UX-01)', async ({ page }) => {
  await openPage(page, '/heute');
  await expect(mainNav(page).getByRole('link')).toHaveText(['Heute', 'Mehr']);
  await mainNav(page).getByRole('link', { name: 'Mehr' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mehr' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link')).toHaveText([
    'Einstellungen',
    'Installieren',
    'Über die App',
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
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0f1115');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(15, 17, 21)',
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
