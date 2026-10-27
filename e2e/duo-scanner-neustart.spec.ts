import type { Locator } from '@playwright/test';
import { writeFakeCamera } from './fakeCamera';
import { expect, test } from './fixtures';
import { openScanner, fakeCamera, setScanPose } from './scanner';

// Barcode-Scanner beim iPhone Duo (D-385): Die App dreht das Kamerabild nicht selbst. Bei einer
// neuen Haltung (Drehen, Auf- und Zuklappen) startet die Kamera neu, damit iOS das Bild für die
// neue Haltung liefert. Künstliche Kamera nur in Chromium; Handy-Profil.
test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || !isMobile,
  'Künstliche Kamera nur in Chromium; Handy-Profil',
);

test.use(fakeCamera(writeFakeCamera('neustart', { width: 640, height: 480 })));

/**
 * Drehungen am Kamerabild und seinen Vorfahren bis zum Dialog: `rotate` oder eine Matrix mit
 * Drehanteil oder Spiegelung. Verschieben zählt nicht.
 */
function rotations(video: Locator): Promise<string[]> {
  return video.evaluate((element) => {
    const found: string[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      if (node.tagName === 'DIALOG') break;
      const style = getComputedStyle(node);
      const rotate = style.getPropertyValue('rotate');
      if (rotate && rotate !== 'none' && rotate !== '0deg')
        found.push(`${node.tagName}: ${rotate}`);
      const transform = style.getPropertyValue('transform');
      const matrix = /^matrix\(([^)]+)\)$/.exec(transform);
      if (transform !== 'none' && !matrix) found.push(`${node.tagName}: ${transform}`);
      if (matrix) {
        const [a = 1, b = 0, c = 0, d = 1] = (matrix[1] ?? '').split(',').map(Number);
        if (b !== 0 || c !== 0 || a <= 0 || d <= 0) found.push(`${node.tagName}: ${transform}`);
      }
    }
    return found;
  });
}

test('Scanner: keine eigene Drehung; bei neuer Haltung startet die Kamera neu (D-385)', async ({
  page,
}) => {
  // Zählt die Anfragen an die Kamera.
  await page.addInitScript(() => {
    const media = navigator.mediaDevices;
    const original = media.getUserMedia.bind(media);
    const counter = window as unknown as { kameraStarts: number };
    counter.kameraStarts = 0;
    media.getUserMedia = (constraints) => {
      counter.kameraStarts += 1;
      return original(constraints);
    };
  });
  await setScanPose(page, 'zu');
  const scanner = await openScanner(page);
  const video = scanner.locator('video');
  const starts = () =>
    page.evaluate(() => (window as unknown as { kameraStarts: number }).kameraStarts);
  const stream = () =>
    video.evaluate((element: HTMLVideoElement) => {
      const track = (element.srcObject as MediaStream | null)?.getVideoTracks()[0];
      return {
        live: track?.readyState === 'live',
        width: element.videoWidth,
        height: element.videoHeight,
      };
    });
  await expect.poll(starts).toBe(1);
  await expect.poll(stream).toEqual({ live: true, width: 640, height: 480 });
  expect(await rotations(video), 'zu: keine eigene Drehung').toEqual([]);

  // Zwischenmaß (anderes Display), aufgeklappt (quer), zugeklappt quer, wieder zugeklappt.
  let count = 1;
  for (const pose of ['hoch', 'auf', 'quer', 'zu'] as const) {
    await setScanPose(page, pose);
    count += 1;
    await expect.poll(starts, `${pose}: Kamera neu gestartet`).toBe(count);
    // Das Bild kommt so, wie der Browser es liefert: Größe des Kamerastroms, ohne Drehung.
    await expect.poll(stream, pose).toEqual({ live: true, width: 640, height: 480 });
    expect(await rotations(video), `${pose}: keine eigene Drehung`).toEqual([]);
  }

  // Kleine Änderung des Fensters (Systemleisten): kein Neustart.
  await page.setViewportSize({ width: 466, height: 640 });
  await page.waitForTimeout(1000);
  expect(await starts()).toBe(count);
  await expect(video).toBeVisible();
});
