import { readFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Startfläche der installierten App (F5, D-325; Dauer F6, D-337). Playwright kennt
 * `display-mode: standalone` nicht; der Test schaltet die Fläche wie in der installierten App
 * ein, indem er die Abfrage in index.html auf `all` setzt. Die Seite „Heute“ kommt auf Zeichen,
 * damit sich schneller und langsamer Start nachstellen lassen. Gemessen wird in der Seite: erstes
 * Bild (Paint Timing), „bereit“ (die erste Ansicht ruft `hideStartSurface`), „weg“ (Ausblenden
 * beginnt) und „entfernt“.
 */
async function installedStart(
  browser: Browser,
  options: { reducedMotion?: 'reduce'; landscape?: boolean } = {},
) {
  const context = await browser.newContext({
    viewport: options.landscape ? { width: 844, height: 390 } : { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    reducedMotion: options.reducedMotion ?? 'no-preference',
  });
  const page = await context.newPage();
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/(heute)?$/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace('@media (display-mode:standalone)', '@media all');
    await route.fulfill({ response, body });
  });
  // Die Seite „Heute“ kommt erst auf Zeichen: Bis dahin initialisiert die App unter der Fläche.
  await page.route(/\/assets\/TodayPage-[^/]+\.js$/, async (route) => {
    await held;
    await route.continue();
  });
  // Zeitpunkte rund um die Fläche, gemessen ab Beginn der Navigation.
  await page.addInitScript(() => {
    const log: { e: string; t: number }[] = [];
    (window as unknown as { startLog: typeof log }).startLog = log;
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;
        if (record.type === 'attributes' && target.id === 'startflaeche') {
          if (record.attributeName === 'data-weg') log.push({ e: 'bereit', t: performance.now() });
          if (record.attributeName === 'class' && target.classList.contains('weg'))
            log.push({ e: 'weg', t: performance.now() });
        }
        for (const node of record.removedNodes) {
          if ((node as Element).id === 'startflaeche')
            log.push({ e: 'entfernt', t: performance.now() });
        }
      }
    }).observe(document, {
      attributes: true,
      attributeFilter: ['class', 'data-weg'],
      subtree: true,
      childList: true,
    });
  });
  return { context, page, release };
}

/** Erstes Bild und Zeitpunkte der Fläche; wartet, bis sie entfernt ist. */
async function timeline(page: Page) {
  await expect(page.locator('#startflaeche')).toHaveCount(0, { timeout: 10_000 });
  return page.evaluate(() => {
    // Ohne Paint Timing zählt der Beginn der Navigation (früher als das erste Bild).
    const paints = performance.getEntriesByType('paint').map((entry) => entry.startTime);
    const log = (window as unknown as { startLog: { e: string; t: number }[] }).startLog;
    const at = (e: string) => log.find((entry) => entry.e === e)?.t ?? null;
    return {
      paint: paints.length > 0 ? Math.min(...paints) : 0,
      ready: at('bereit'),
      weg: at('weg'),
      gone: at('entfernt'),
      events: log.map((entry) => entry.e),
    };
  });
}

const heading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: /Guten (Morgen|Tag|Abend)/ });

/** Mittlere Abweichung je Kanal und Anteil stark abweichender Pixel zwischen zwei PNGs. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ({ first, second }) => {
      const load = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Kein Canvas');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      };
      const [pa, pb] = await Promise.all([load(first), load(second)]);
      if (pa.width !== pb.width || pa.height !== pb.height) return { mean: 255, strong: 1 };
      let sum = 0;
      let strong = 0;
      for (let i = 0; i < pa.data.length; i += 4) {
        let pixel = 0;
        for (let k = 0; k < 3; k += 1) {
          const d = Math.abs((pa.data[i + k] ?? 0) - (pb.data[i + k] ?? 0));
          sum += d;
          pixel = Math.max(pixel, d);
        }
        if (pixel > 64) strong += 1;
      }
      const count = pa.data.length / 4;
      return { mean: sum / (count * 3), strong: strong / count };
    },
    { first: a.toString('base64'), second: b.toString('base64') },
  );
}

test('Startfläche: gleich dem Startbild, blendet aus, sobald „Heute“ steht', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser);
  await page.goto('/heute', { waitUntil: 'commit' });
  const surface = page.locator('#startflaeche');
  await expect(surface).toBeVisible();
  const result = await compare(
    page,
    await page.screenshot(),
    readFileSync('public/splash/splash-1170x2532.png'),
  );
  // Pixelgleich bis auf die Kantenglättung: im Mittel unter 0,25 von 255, kaum ein Ausreißer.
  expect(result.mean, 'mittlere Abweichung je Kanal').toBeLessThan(0.25);
  expect(result.strong, 'Anteil stark abweichender Pixel').toBeLessThan(0.0005);

  release();
  await expect(heading(page)).toBeVisible();
  const times = await timeline(page);
  expect(times.events).toEqual(['bereit', 'weg', 'entfernt']);
  // Ausblenden frühestens 1,0 s nach dem ersten Bild und nicht vor der ersten Ansicht.
  const due = Math.max(times.paint + 1000, times.ready ?? 0);
  expect(times.weg ?? 0).toBeGreaterThanOrEqual(due - 5);
  // Obergrenze großzügig: Zeitgeber laufen auf einem ausgelasteten Rechner später.
  expect(times.weg ?? 0).toBeLessThanOrEqual(due + 400);
  // 300 ms Ausblenden.
  expect((times.gone ?? 0) - (times.weg ?? 0)).toBeGreaterThanOrEqual(250);
  await context.close();
});

test('Startfläche beim schnellen Start: mindestens 1,0 s ab dem ersten Bild, dann 300 ms', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser);
  release();
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(heading(page)).toBeVisible();
  const times = await timeline(page);
  expect(times.events).toEqual(['bereit', 'weg', 'entfernt']);
  // „Heute“ stand schon vor Ablauf der Sekunde; die Fläche blieb trotzdem.
  expect(times.ready ?? 0).toBeLessThan(times.paint + 1000);
  expect(times.weg ?? 0).toBeGreaterThanOrEqual(times.paint + 1000 - 5);
  expect(times.weg ?? 0).toBeLessThanOrEqual(times.paint + 1000 + 400);
  expect((times.gone ?? 0) - (times.weg ?? 0)).toBeGreaterThanOrEqual(250);
  await context.close();
});

test('Startfläche beim langsamen Start: bleibt, bis „Heute“ steht, dann sofort ausblenden', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser);
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(page.locator('#startflaeche')).toBeVisible();
  // Länger als die Mindestzeit laden: die Fläche bleibt ohne Ausblenden stehen.
  await page.waitForTimeout(1500);
  await expect(page.locator('#startflaeche')).toBeVisible();
  await expect(page.locator('#startflaeche')).not.toHaveClass(/weg/);
  release();
  await expect(heading(page)).toBeVisible();
  const times = await timeline(page);
  expect(times.ready ?? 0).toBeGreaterThan(times.paint + 1000);
  expect((times.weg ?? 0) - (times.ready ?? 0)).toBeLessThanOrEqual(400);
  await context.close();
});

test('Startfläche quer: gleich dem Startbild für 844 × 390 pt', async ({ browser }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser, { landscape: true });
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(page.locator('#startflaeche')).toBeVisible();
  const result = await compare(
    page,
    await page.screenshot(),
    readFileSync('public/splash/splash-2532x1170.png'),
  );
  expect(result.mean, 'mittlere Abweichung je Kanal').toBeLessThan(0.25);
  expect(result.strong, 'Anteil stark abweichender Pixel').toBeLessThan(0.0005);
  release();
  await context.close();
});

test('Startfläche: bei „Bewegung reduzieren“ ohne Ausblenden', async ({ browser }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser, { reducedMotion: 'reduce' });
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(page.locator('#startflaeche')).toBeVisible();
  release();
  await expect(heading(page)).toBeVisible();
  const times = await timeline(page);
  // Ohne Ausblenden, aber auch hier erst nach der Mindestzeit.
  expect(times.events).toEqual(['bereit', 'entfernt']);
  expect(times.gone ?? 0).toBeGreaterThanOrEqual(times.paint + 1000 - 5);
  await context.close();
});

test('Startfläche: kein Startbild nach Rückkehr aus dem Hintergrund oder beim Wechsel der Ansicht', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser);
  release();
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(heading(page)).toBeVisible();
  await timeline(page);
  // Hintergrund und zurück, dann ein Wechsel zu „Training“ und zurück.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .last()
    .getByRole('link', { name: 'Training' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
  await page.goBack();
  await expect(heading(page)).toBeVisible();
  await expect(page.locator('#startflaeche')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      (window as unknown as { startLog: { e: string }[] }).startLog.map((entry) => entry.e),
    ),
  ).toEqual(['bereit', 'weg', 'entfernt']);
  await context.close();
});

test('Startfläche: im Browser-Tab unsichtbar und nach dem Start entfernt', async ({ page }) => {
  await page.goto('/heute', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startflaeche')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#startflaeche')).toHaveCount(0);
});
