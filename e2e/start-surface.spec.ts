import { readFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Startfläche der installierten App (F5, D-325). Playwright kennt `display-mode: standalone`
 * nicht; der Test schaltet die Fläche wie in der installierten App ein, indem er die Abfrage in
 * index.html auf `all` setzt. Die erste Seite kommt verzögert, damit die Fläche zu sehen ist.
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
  // Merkt sich, ob die Fläche je ausgeblendet wurde (Klasse „weg“).
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { startLog: string[] }).startLog = log;
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;
        if (target.id === 'startflaeche' && target.classList.contains('weg')) log.push('weg');
      }
    }).observe(document, { attributes: true, attributeFilter: ['class'], subtree: true });
  });
  return { context, page, release };
}

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
  await expect(
    page.getByRole('heading', { level: 1, name: /Guten (Morgen|Tag|Abend)/ }),
  ).toBeVisible();
  await expect(surface).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { startLog: string[] }).startLog)).toEqual(
    ['weg'],
  );
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
  await expect(
    page.getByRole('heading', { level: 1, name: /Guten (Morgen|Tag|Abend)/ }),
  ).toBeVisible();
  await expect(page.locator('#startflaeche')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { startLog: string[] }).startLog)).toEqual(
    [],
  );
  await context.close();
});

test('Startfläche: im Browser-Tab unsichtbar und nach dem Start entfernt', async ({ page }) => {
  await page.goto('/heute', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startflaeche')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#startflaeche')).toHaveCount(0);
});
