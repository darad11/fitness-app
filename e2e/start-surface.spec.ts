import { readFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Startfläche der installierten App (F5, D-325; Dauer F6, D-337). Playwright kennt
 * `display-mode: standalone` nicht; der Test schaltet die Fläche wie in der installierten App
 * ein, indem er die Abfrage in index.html auf `all` setzt. Die Seite „Heute“ kommt auf Zeichen,
 * damit sich schneller und langsamer Start nachstellen lassen. Gemessen wird in der Seite: erstes
 * Bild (früher von Paint Timing und dem ersten Bildwechsel; Safari meldet für die Fläche ohne Text
 * keinen Paint-Eintrag, D-337), „bereit“ (die erste Ansicht ruft `hideStartSurface`), „weg“
 * (Ausblenden beginnt) und „entfernt“. Mit `safari` liefert die Seite gar keine Paint-Einträge,
 * wie Safari bis zum Text der App.
 */
async function installedStart(
  browser: Browser,
  options: {
    reducedMotion?: 'reduce';
    landscape?: boolean;
    safari?: boolean;
    /** Bereich der App und Bildschirm, wenn sie verschieden groß sind (iPhone Duo, D-390). */
    viewport?: { width: number; height: number };
    screen?: { width: number; height: number };
  } = {},
) {
  const context = await browser.newContext({
    viewport:
      options.viewport ??
      (options.landscape ? { width: 844, height: 390 } : { width: 390, height: 844 }),
    ...(options.screen ? { screen: options.screen } : {}),
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
  if (options.safari) {
    await page.addInitScript(() => {
      const original = performance.getEntriesByType.bind(performance);
      performance.getEntriesByType = (type: string) => (type === 'paint' ? [] : original(type));
    });
  }
  // Zeitpunkte rund um die Fläche, gemessen ab Beginn der Navigation.
  await page.addInitScript(() => {
    const log: { e: string; t: number }[] = [];
    (window as unknown as { startLog: typeof log }).startLog = log;
    // Erster Bildwechsel der Seite, unabhängig von der App gemessen.
    requestAnimationFrame((time) => {
      (window as unknown as { testFirstFrame: number }).testFirstFrame = time;
    });
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
    // Erstes Bild: der frühere von Paint-Eintrag und erstem Bildwechsel.
    const paints = performance.getEntriesByType('paint').map((entry) => entry.startTime);
    const frame = (window as unknown as { testFirstFrame?: number }).testFirstFrame;
    if (frame !== undefined) paints.push(frame);
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

/**
 * Mittlere Abweichung je Kanal und Anteil stark abweichender Pixel zwischen zwei PNGs. Mit `crop`
 * zählt vom zweiten Bild nur der Ausschnitt in der Größe des ersten, der bei `crop` (Pixel)
 * beginnt: das Fenster der App neben den Systemstreifen (D-390, D-393).
 */
async function compare(page: Page, a: Buffer, b: Buffer, crop?: { x: number; y: number }) {
  return page.evaluate(
    async ({ first, second, cut }) => {
      const load = async (
        data: string,
        size?: { width: number; height: number; x: number; y: number },
      ) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const width = size?.width ?? image.width;
        const height = size?.height ?? image.height;
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Kein Canvas');
        context.drawImage(image, -(size?.x ?? 0), -(size?.y ?? 0));
        return context.getImageData(0, 0, width, height);
      };
      const pa = await load(first);
      const pb = await load(
        second,
        cut ? { width: pa.width, height: pa.height, x: cut.x, y: cut.y } : undefined,
      );
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
    { first: a.toString('base64'), second: b.toString('base64'), cut: crop ?? null },
  );
}

test('Startfläche: gleich dem Startbild, blendet aus, sobald „Heute“ steht', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  // Der Bildschirm kommt aus dem Handy-Profil (Pixel 7: 412 × 915, iPhone 15: 393 × 852) und ist
  // etwas größer als das Fenster; die Seite der Streifen ist unbekannt, also bleibt die Fläche
  // mittig im Fenster (D-393).
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

/**
 * iPhone Duo (D-390, D-393): Auf dem Gerät ist das Fenster der App kleiner als der Bildschirm, mit
 * Systemstreifen rechts (84 pt) und aufgeklappt oben (82 pt). `screen.*` meldet dort vermutlich in
 * jeder Haltung das äußere Display (466 × 678). Gemessen am Gerät: Fenster zugeklappt hoch
 * 382 × 678, aufgeklappt hoch 669 × 869, aufgeklappt quer 867 × 587, beim Start quer laut Messbild
 * 867 × 669; zugeklappt quer angenommen (594 × 466). Erwartet: Symbol in der Mitte des ganzen
 * Bildschirms (im Fenster um die Streifen verschoben) und pixelgleich mit dem Ausschnitt des
 * Startbilds, den das Fenster zeigt. Dazu die Fälle ohne Streifen (Fenster so groß wie der
 * Bildschirm).
 */
const DUO_STARTS = [
  {
    name: 'zugeklappt hoch, Streifen rechts',
    viewport: { width: 382, height: 678 },
    image: 'splash-1398x2034.png',
    display: { width: 466, height: 678 },
    window: { x: 0, y: 0 },
  },
  {
    name: 'zugeklappt hoch, Fenster so groß wie der Bildschirm',
    viewport: { width: 466, height: 678 },
    image: 'splash-1398x2034.png',
    display: { width: 466, height: 678 },
    window: { x: 0, y: 0 },
  },
  {
    name: 'zugeklappt quer, Streifen rechts (Annahme)',
    viewport: { width: 594, height: 466 },
    image: 'splash-2034x1398.png',
    display: { width: 678, height: 466 },
    window: { x: 0, y: 0 },
  },
  {
    name: 'aufgeklappt hoch, Streifen oben',
    viewport: { width: 669, height: 869 },
    image: 'splash-2007x2853.png',
    display: { width: 669, height: 951 },
    window: { x: 0, y: 82 },
  },
  {
    name: 'aufgeklappt quer, Streifen rechts und oben',
    viewport: { width: 867, height: 587 },
    image: 'splash-2853x2007.png',
    display: { width: 951, height: 669 },
    window: { x: 0, y: 82 },
  },
  {
    name: 'aufgeklappt quer beim Start, Streifen nur rechts (Messbild)',
    viewport: { width: 867, height: 669 },
    image: 'splash-2853x2007.png',
    display: { width: 951, height: 669 },
    window: { x: 0, y: 0 },
  },
  {
    name: 'aufgeklappt quer, Fenster so groß wie der Bildschirm',
    viewport: { width: 951, height: 669 },
    image: 'splash-2853x2007.png',
    display: { width: 951, height: 669 },
    window: { x: 0, y: 0 },
  },
];

for (const pose of DUO_STARTS) {
  test(`Startfläche am iPhone Duo, ${pose.name}: Logo in der Mitte des ganzen Bildschirms, gleich dem Startbild (D-390, D-393)`, async ({
    browser,
    browserName,
  }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
    test.skip(browserName !== 'chromium', 'Bildschirm und Fenster verschieden groß: nur Chromium');
    const { context, page, release } = await installedStart(browser, {
      viewport: pose.viewport,
      screen: { width: 466, height: 678 },
    });
    await page.goto('/heute', { waitUntil: 'commit' });
    await expect(page.locator('#startflaeche')).toBeVisible();
    const shot = await page.screenshot();
    // Mitte des Symbols (Lime #C7FF46) in pt, im Fenster.
    const symbolCenter = await page.evaluate(async (data) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Kein Canvas');
      context.drawImage(image, 0, 0);
      const { data: px, width, height } = context.getImageData(0, 0, image.width, image.height);
      const box = { left: Infinity, right: -1, top: Infinity, bottom: -1 };
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          const [r, g, b] = [px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0];
          if (g > 200 && r > 150 && b < 120) {
            box.left = Math.min(box.left, x);
            box.right = Math.max(box.right, x + 1);
            box.top = Math.min(box.top, y);
            box.bottom = Math.max(box.bottom, y + 1);
          }
        }
      }
      return { x: (box.left + box.right) / 6, y: (box.top + box.bottom) / 6 };
    }, shot.toString('base64'));
    // Im Startbild steht das Symbol waagrecht in der Mitte des ganzen Bildschirms.
    expect(
      Math.abs(symbolCenter.x + pose.window.x - pose.display.width / 2),
      `Mitte des Symbols waagrecht ${String(symbolCenter.x)}`,
    ).toBeLessThanOrEqual(1);
    const result = await compare(page, shot, readFileSync(`public/splash/${pose.image}`), {
      x: pose.window.x * 3,
      y: pose.window.y * 3,
    });
    expect(result.mean, 'mittlere Abweichung je Kanal').toBeLessThan(0.25);
    expect(result.strong, 'Anteil stark abweichender Pixel').toBeLessThan(0.0005);
    release();
    await context.close();
  });
}

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

test('Startfläche wie in Safari ohne Paint-Eintrag: langsamer Start, nach „Heute“ sofort ausblenden (D-337)', async ({
  browser,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Startbild nur am iPhone');
  const { context, page, release } = await installedStart(browser, { safari: true });
  await page.goto('/heute', { waitUntil: 'commit' });
  await expect(page.locator('#startflaeche')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('#startflaeche')).not.toHaveClass(/weg/);
  release();
  await expect(heading(page)).toBeVisible();
  const times = await timeline(page);
  expect(times.ready ?? 0).toBeGreaterThan(times.paint + 1000);
  // Vorher zählte die App ohne Paint-Eintrag ab „bereit“ und blieb noch eine Sekunde stehen.
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
