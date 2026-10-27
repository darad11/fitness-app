import { expect, openPage, test } from './fixtures';

/**
 * Animationen der Übungen offline (D-403): Was einmal angezeigt wurde, speichert der Service
 * Worker vollständig und spielt es danach ohne Netz ab, auch wenn der Browser das Video in
 * Teilen anfragt (Range Requests). Vorab gespeichert wird nichts.
 */
test('Animation einmal online gesehen, danach offline (D-403)', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Offline mit Service Worker wird in Chromium geprüft; Safari prüft es am Gerät.',
  );
  test.slow();
  await openPage(page, '/heute');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  // Nichts vorab gespeichert.
  const stored = () =>
    page.evaluate(async () => {
      const cache = await caches.open('uebungen-medien');
      return (await cache.keys()).map((request) => new URL(request.url).pathname).sort();
    });
  expect(await stored()).toEqual([]);

  await openPage(page, '/uebungen');
  await page
    .getByRole('link', { name: /^Latziehen/ })
    .first()
    .click();
  const video = page.locator('[data-demo="bild"] video');
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.2);
  await expect.poll(stored).toContain('/uebungen/medien/latziehen-poster.webp');
  const loop = await video.evaluate((v: HTMLVideoElement) => new URL(v.currentSrc).pathname);
  await expect.poll(stored).toContain(loop);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Latziehen' })).toBeVisible();
  const offline = page.locator('[data-demo="bild"] video');
  await expect
    .poll(() => offline.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.2);
  await context.setOffline(false);
});
