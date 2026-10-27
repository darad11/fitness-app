import { writeFakeCamera } from './fakeCamera';
import { expect, test } from './fixtures';
import { CODE, fakeCamera, openScanner, setScanPose } from './scanner';

// Barcode-Scanner beim iPhone Duo (D-374): Ein Code im Rahmen wird in jeder Haltung erkannt.
test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || !isMobile,
  'Künstliche Kamera nur in Chromium; Handy-Profil',
);

// Kamerabild hoch (480 × 640), der Code in der Mitte und damit im Rahmen.
test.use(
  fakeCamera(writeFakeCamera('code-mitte', { width: 480, height: 640, code: CODE, x: 97, y: 270 })),
);

for (const pose of ['zu', 'auf', 'quer'] as const) {
  test(`Scanner ${pose}: Ein Code im Rahmen wird erkannt (D-374)`, async ({ page }) => {
    await setScanPose(page, pose);
    await openScanner(page);
    await expect(page.getByRole('dialog', { name: 'Open Food Facts verwenden?' })).toBeVisible({
      timeout: 10_000,
    });
  });
}
