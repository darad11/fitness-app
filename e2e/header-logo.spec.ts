import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Logo der Kopfzeile scharf (F6 Abschnitt 1, D-332): Datei in Anzeigegröße auf ganzen Pixeln,
 * nichts über dem Logo und keine Effekte auf ihm; auf iPhone und iPad unter der Unschärfe, die iOS
 * über den oberen Rand legt. Geprüft mit dreifacher Pixeldichte wie auf dem iPhone.
 */

test.use({ deviceScaleFactor: 3 });

/** Untere Kante der Unschärfe von iOS: rund 40 pt unter der Statusleiste. */
const EDGE_BLUR = 40;

/** Lage des Logos und alles, was es unscharf machen könnte. */
function inspect(page: Page) {
  return page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>('main a[href="/heute"] img');
    if (!img) throw new Error('Logo fehlt');
    const rect = img.getBoundingClientRect();
    const effects: string[] = [];
    const check = (style: CSSStyleDeclaration, where: string) => {
      const backdrop =
        style.getPropertyValue('backdrop-filter') ||
        style.getPropertyValue('-webkit-backdrop-filter');
      const mask =
        style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image');
      const found: [string, string, string[]][] = [
        ['filter', style.filter, ['none']],
        ['backdrop-filter', backdrop, ['none', '']],
        ['mask-image', mask, ['none', '']],
        ['opacity', style.opacity, ['1']],
        ['transform', style.transform, ['none']],
        ['mix-blend-mode', style.mixBlendMode, ['normal']],
        ['translate', style.translate, ['none']],
        ['scale', style.scale, ['none']],
        ['rotate', style.rotate, ['none']],
        ['zoom', style.zoom, ['1', 'normal', '']],
      ];
      for (const [name, value, fine] of found) {
        if (!fine.includes(value)) effects.push(`${where}: ${name} ${value}`);
      }
    };
    // Bild, alle Vorfahren und deren Pseudo-Elemente.
    for (let element: Element | null = img; element; element = element.parentElement) {
      const where = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
      check(getComputedStyle(element), where);
      for (const pseudo of ['::before', '::after']) {
        const style = getComputedStyle(element, pseudo);
        if (style.content !== 'none' && style.content !== 'normal') check(style, where + pseudo);
      }
    }
    // Was liegt darüber? An neun Punkten muss das Bild selbst zuoberst liegen.
    const covered: string[] = [];
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0.1, 0.5, 0.9]) {
        const x = rect.left + rect.width * fx;
        const y = rect.top + rect.height * fy;
        if (y < 0 || y > window.innerHeight) continue;
        const top = document.elementFromPoint(x, y);
        if (top !== img) covered.push(`${String(fx)}/${String(fy)}: ${top?.tagName ?? '–'}`);
      }
    }
    // Glas der Seite (nur die Tab-Leiste hat welches) berührt das Logo nicht.
    const glass: string[] = [];
    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      const backdrop =
        style.getPropertyValue('backdrop-filter') ||
        style.getPropertyValue('-webkit-backdrop-filter');
      if (!backdrop || backdrop === 'none') continue;
      const r = element.getBoundingClientRect();
      if (r.right > rect.left && r.left < rect.right && r.bottom > rect.top && r.top < rect.bottom)
        glass.push(element.outerHTML.slice(0, 80));
    }
    return {
      x: rect.x,
      y: rect.y,
      top: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      natural: [img.naturalWidth, img.naturalHeight],
      dpr: window.devicePixelRatio,
      effects,
      covered,
      glass,
    };
  });
}

/** Auf ganzen Gerätepixeln (1/3 px bei dreifacher Dichte). */
function onDevicePixels(value: number, dpr: number) {
  return Math.abs(value * dpr - Math.round(value * dpr)) < 0.01;
}

for (const width of [360, 390, 768]) {
  test(`Kopfzeilen-Logo: 106 × 28 px wie die Datei, auf ganzen Pixeln, nichts darüber (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/heute', '/training', '/ernaehrung']) {
      await openPage(page, path);
      await expect(page.locator('main a[href="/heute"] img')).toBeVisible();
      // Oben, ein wenig gescrollt (Logo halb unter dem Rand), weit gescrollt und zurück.
      for (const y of [0, 9, 'mitte', 0] as const) {
        await page.evaluate((target) => {
          const middle = Math.round(
            (document.documentElement.scrollHeight - window.innerHeight) / 2,
          );
          window.scrollTo(0, target === 'mitte' ? middle : target);
        }, y);
        const logo = await inspect(page);
        const label = `${path} bei ${String(y)}`;
        expect(logo.dpr).toBe(3);
        expect(logo.natural, `${label}: Datei in Anzeigegröße`).toEqual([106, 28]);
        expect([logo.width, logo.height], `${label}: ganze Pixel`).toEqual([106, 28]);
        expect(onDevicePixels(logo.x, logo.dpr), `${label}: x ${String(logo.x)}`).toBe(true);
        expect(onDevicePixels(logo.y, logo.dpr), `${label}: y ${String(logo.y)}`).toBe(true);
        expect(logo.effects, `${label}: keine Effekte`).toEqual([]);
        expect(logo.glass, `${label}: kein Glas über dem Logo`).toEqual([]);
        if (y !== 'mitte') expect(logo.covered, `${label}: nichts darüber`).toEqual([]);
      }
    }
  });
}

test('Unter der Unschärfe von iOS: Logo, „Später“ und der Kopf im Training rücken um den Abstand nach unten', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Kopfzeile nur unter 1024 px');
  const clear = (value: string) =>
    page.evaluate((v) => {
      document.documentElement.style.setProperty('--spacing-edge-clear', v);
    }, value);
  // Ohne Abstand (Chromium, Mac): Logo 14 px unter dem oberen Rand, wie bisher.
  await openPage(page, '/heute');
  const before = await inspect(page);
  expect(before.top).toBe(14);
  // Mit dem Abstand von iPhone und iPad (2 rem): unter der Unschärfe.
  await clear('2rem');
  const after = await inspect(page);
  expect(after.top).toBe(46);
  expect(after.top).toBeGreaterThanOrEqual(EDGE_BLUR);
  expect(after.covered).toEqual([]);

  // „Später“ der Anmeldung.
  await openPage(page, '/mehr/synchronisierung');
  await clear('2rem');
  const later = await page
    .getByRole('dialog', { name: 'FORM' })
    .getByRole('button', { name: 'Später' })
    .boundingBox();
  expect(later?.y ?? 0).toBeGreaterThanOrEqual(EDGE_BLUR);

  // Kopf im Training, auch wenn er beim Scrollen oben klebt: Schrift unter der Unschärfe,
  // die Fläche des Kopfes reicht bis an den oberen Rand.
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await clear('2rem');
  const head = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
  const restTop = (await page.getByRole('heading', { level: 1 }).boundingBox())?.y ?? 0;
  expect(restTop).toBeGreaterThanOrEqual(EDGE_BLUR);
  await page.evaluate(() => {
    window.scrollTo(0, 600);
  });
  await expect.poll(async () => (await head.boundingBox())?.y).toBe(0);
  const eyebrow = await head.locator('p.eyebrow').boundingBox();
  expect(eyebrow?.y ?? 0, 'Programm und Woche unter der Unschärfe').toBeGreaterThanOrEqual(
    EDGE_BLUR,
  );
  // Ohne Abstand bleibt der klebende Kopf wie bisher (Schrift 10 px unter dem Rand).
  await clear('0rem');
  expect((await head.locator('p.eyebrow').boundingBox())?.y ?? 0).toBeLessThan(EDGE_BLUR);
});
