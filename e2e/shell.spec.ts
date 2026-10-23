import { expect, mainNav, openPage, test } from './fixtures';

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
  // Ohne das Logo oben links (D-286, D-310).
  await expect(
    page
      .getByRole('main')
      .getByRole('link')
      .filter({ hasNot: page.getByRole('img', { name: 'FORM – zu Heute' }) }),
  ).toHaveText(['Profil und Ziele', 'Einstellungen', 'Synchronisierung', 'Über die App']);
  // Daten, Installieren und Schritte stehen in den Einstellungen (D-280).
  await page.getByRole('main').getByRole('link', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('list', { name: 'Weiteres' }).getByRole('link')).toHaveText([
    'Daten und Sicherung',
    'Installieren',
    'Schritte aus dem Dashboard',
  ]);
});

test('bleibt dunkel, auch nach einem Neustart; keine Darstellungswahl (D-308)', async ({
  page,
}) => {
  await openPage(page, '/mehr/einstellungen');
  await expect(page.getByRole('radio', { name: 'Dunkel' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // Eine alte Kopie der Einstellung „Hell“ darf die Darstellung nicht mehr umschalten.
  await page.evaluate(() => {
    localStorage.setItem('fitness.theme', 'light');
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0c1219');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(12, 18, 25)',
  );
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
  await page.getByRole('link', { name: 'Zu Heute', exact: true }).click();
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

test('Logo am Handy auf jeder Seite links oben, grüne Kachel 28 px hoch, führt zu „Heute“ (D-286, D-310, D-325)', async ({
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
    const brand = page.getByRole('main').getByRole('link', { name: 'FORM – zu Heute' });
    await expect(brand).toBeVisible();
    const img = brand.getByRole('img');
    await expect(img).toHaveAttribute('src', '/brand/logo-kopfzeile-kompakt.svg');
    const image = await img.boundingBox();
    expect(Math.round(image?.height ?? 0)).toBe(28);
    // Breite aus dem Seitenverhältnis der Datei: Kachel 28, Abstand 10, Wortmarke etwa 67,5.
    expect(Math.round(image?.width ?? 0)).toBe(105);
    const logo = await brand.boundingBox();
    expect(logo?.height ?? 0).toBeGreaterThanOrEqual(44);
    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect((logo?.y ?? 0) + (logo?.height ?? 0)).toBeLessThanOrEqual(title?.y ?? 0);
    expect(logo?.x ?? 99).toBeLessThan(30);
  }
  await page.getByRole('main').getByRole('link', { name: 'FORM – zu Heute' }).click();
  await expect(page).toHaveURL(/\/heute$/);
});
