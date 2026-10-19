import { expect, openPage, test } from './fixtures';

// Chromium mit künstlicher Kamera: Der Scanner startet die Kamera und lädt die Erkennung
// (WebAssembly) aus der App selbst, nicht von einem CDN. WebKit prüft der Gerätetest.
test.skip(({ browserName }) => browserName !== 'chromium', 'Künstliche Kamera nur in Chromium');
test.use({
  launchOptions: {
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
  permissions: ['camera'],
});

test('Scanner: Kamera läuft, Erkennung kommt aus der App (D-266)', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  const wasm: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.endsWith('.wasm')) wasm.push(url);
    if (!url.startsWith(baseURL ?? '') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      foreign.push(url);
    }
  });
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  const scanner = page.getByRole('dialog', { name: 'Barcode scannen' });
  await expect(
    scanner.getByText('Halte den Barcode ruhig in den Rahmen.', { exact: true }),
  ).toBeVisible();
  await expect.poll(() => wasm.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(wasm.every((url) => url.startsWith(baseURL ?? ''))).toBe(true);
  expect(foreign).toEqual([]);
  await scanner.getByRole('button', { name: 'Schließen' }).click();
  await expect(scanner).toBeHidden();
});
