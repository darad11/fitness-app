import { setDuoPose } from './duo';
import { writeFakeCamera } from './fakeCamera';
import { expect, test } from './fixtures';
import { CODE, fakeCamera, openScanner } from './scanner';

// Barcode-Scanner beim iPhone Duo (D-374): erkannt wird nur, was im Rahmen zu sehen ist.
// Chromium spielt ein Standbild als Kamera ab; WebKit prüft der Gerätetest.
test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || !isMobile,
  'Künstliche Kamera nur in Chromium; Handy-Profil',
);

// Wie am iPhone hoch: Kamerabild 480 × 640; der Kasten (4 : 3) zeigt nur die Mitte, der Code
// steht ganz oben im abgeschnittenen Teil.
test.use(
  fakeCamera(writeFakeCamera('code-oben', { width: 480, height: 640, code: CODE, x: 97, y: 10 })),
);

test('Scanner: Ein Code, den man nicht sieht, wird nicht erkannt (D-374)', async ({ page }) => {
  await setDuoPose(page, 'zu');
  const scanner = await openScanner(page);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector<HTMLVideoElement>('dialog[open] video')?.videoHeight ?? 0,
      ),
    )
    .toBe(640);
  // Rund zwölf Erkennungsdurchgänge (alle 250 ms) ohne Treffer.
  await page.waitForTimeout(3000);
  await expect(scanner.locator('video')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Open Food Facts verwenden?' })).toHaveCount(0);
});
