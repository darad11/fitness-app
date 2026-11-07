import { expect, openPage, test } from './fixtures';

/**
 * Animationen der Übungen offline (D-403): Was einmal angezeigt wurde, speichert der Service
 * Worker vollständig und spielt es danach ohne Netz ab, auch wenn der Browser das Video in
 * Teilen anfragt (Range Requests). Vorab gespeichert wird nichts. Alte Fassungen, die die Liste
 * nicht mehr nennt, räumt die App aus dem Speicher (D-494).
 */
test('Animation einmal online gesehen, danach offline; alte Fassungen fallen aus dem Speicher (D-403, D-494)', async ({
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

  // Eine alte Fassung unter einer Adresse, die die Liste nicht mehr nennt, wie das Poster mit der
  // Kleidung von früher (Name ohne Prüfsumme, D-494). Die App löscht sie, sobald sie die Liste lädt.
  const stale = '/uebungen/medien/latziehen-poster.webp';
  await page.evaluate(async (url) => {
    const cache = await caches.open('uebungen-medien');
    await cache.put(
      url,
      new Response('alte Fassung', { headers: { 'content-type': 'image/webp' } }),
    );
  }, stale);
  expect(await stored()).toEqual([stale]);

  await openPage(page, '/uebungen');
  await page
    .getByRole('link', { name: /^Latziehen/ })
    .first()
    .click();
  const video = page.locator('[data-demo="bild"] video');
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.2);
  const poster = (await video.getAttribute('poster')) ?? '';
  expect(poster).toMatch(/^\/uebungen\/medien\/latziehen-poster-[0-9a-f]{8}\.webp$/);
  await expect.poll(stored).toContain(poster);
  const loop = await video.evaluate((v: HTMLVideoElement) => new URL(v.currentSrc).pathname);
  await expect.poll(stored).toContain(loop);
  await expect.poll(stored).not.toContain(stale);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Latziehen' })).toBeVisible();
  const offline = page.locator('[data-demo="bild"] video');
  await expect
    .poll(() => offline.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.2);
  await context.setOffline(false);
});
