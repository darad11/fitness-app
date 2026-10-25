import { setDuoPose } from './duo';
import { writeFakeCamera } from './fakeCamera';
import { expect, test } from './fixtures';
import { fakeCamera, openScanner, setScanPose } from './scanner';

// Barcode-Scanner beim iPhone Duo (D-374): Kamerabild und Rahmen beim Auf- und Zuklappen.
test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || !isMobile,
  'Künstliche Kamera nur in Chromium; Handy-Profil',
);

test.use(fakeCamera(writeFakeCamera('leer', { width: 640, height: 480 })));

test('Scanner: Bild und Rahmen bleiben beim Auf- und Zuklappen und Drehen deckungsgleich und ganz sichtbar (D-374)', async ({
  page,
}) => {
  await setDuoPose(page, 'zu');
  const scanner = await openScanner(page);
  const video = scanner.locator('video');
  const frame = video.locator('xpath=following-sibling::div[1]');
  for (const pose of ['auf', 'hoch', 'quer', 'zu'] as const) {
    await setScanPose(page, pose);
    await expect(video).toBeVisible();
    const viewport = page.viewportSize();
    const [box, inner] = [await video.boundingBox(), await frame.boundingBox()];
    if (!viewport || !box || !inner) throw new Error('Kamerabild fehlt');
    // Kasten ganz im Fenster, Rahmen mittig im Kasten und ganz darin.
    expect(box.y, `${pose}: oben`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `${pose}: unten`).toBeLessThanOrEqual(viewport.height);
    expect(Math.abs(inner.x + inner.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(inner.y + inner.height / 2 - (box.y + box.height / 2))).toBeLessThanOrEqual(1);
    expect(inner.y).toBeGreaterThanOrEqual(box.y);
    expect(inner.y + inner.height).toBeLessThanOrEqual(box.y + box.height);
  }
});
