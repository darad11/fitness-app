import { expect, M0_PAGES, openPage, test } from './fixtures';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

/** Breite und Höhe aus dem IHDR-Block einer PNG-Datei. */
function pngSize(buffer: Buffer): string {
  return `${String(buffer.readUInt32BE(16))}x${String(buffer.readUInt32BE(20))}`;
}

test('Manifest ist verlinkt, gültig und hat alle Icons (AK-PWA-01, D-221)', async ({
  page,
  request,
}) => {
  await openPage(page, '/heute');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const response = await request.get(href ?? '');
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as Record<string, unknown> & { icons: ManifestIcon[] };
  expect(manifest).toMatchObject({
    name: 'Fitness',
    short_name: 'Fitness',
    start_url: '/heute',
    scope: '/',
    display: 'standalone',
    lang: 'de',
  });
  expect(manifest.icons.map((icon) => icon.purpose)).toEqual(['any', 'any', 'maskable']);
  for (const icon of manifest.icons) {
    const file = await request.get(icon.src);
    expect(file.headers()['content-type']).toContain('image/png');
    expect(pngSize(await file.body())).toBe(icon.sizes);
  }
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(pngSize(await (await request.get(appleIcon ?? '')).body())).toBe('180x180');
});

test('Service Worker übernimmt und alle Bereiche starten offline (AK-PWA-02 Shell)', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Offline-Start mit Service Worker wird in Chromium geprüft; Safari prüft T-IPH-M0 auf dem Gerät.',
  );
  await openPage(page, '/heute');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await expect(page.getByText('Offline verfügbar')).toBeVisible();

  await context.setOffline(true);
  for (const path of [...M0_PAGES, '/']) {
    await openPage(page, path);
  }
  await expect(page).toHaveURL(/\/heute$/);
  await context.setOffline(false);
});
