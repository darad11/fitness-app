import type { Locator, Page } from '@playwright/test';
import { DUO, setDuoPose, type DuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Feste Leisten beim iPhone Duo (D-384): Tab-Leiste, Kreis und die Fußleiste im Training kleben
// jederzeit am unteren Rand, beim Scrollen, am Seitenende, nach Auf- und Zuklappen und Drehen.
// Die Seite scrollt im Rahmen der App (`#seite`), nicht im Fenster; die Leisten liegen außerhalb,
// kein Vorfahre bildet einen eigenen Bezugsrahmen für `position: fixed`, und nichts setzt ihre
// Lage beim Scrollen neu. Chromium und WebKit, Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

/**
 * Vorfahren, die für `position: fixed` einen eigenen Bezugsrahmen bilden (CSS Positioned Layout,
 * Transforms, Filter Effects, Containment): Darin hinge die Leiste an ihnen statt am Fenster.
 */
function framingAncestors(locator: Locator): Promise<string[]> {
  return locator.evaluate((element) => {
    const found: string[] = [];
    const set = (value: string | undefined, ...neutral: string[]) =>
      value !== undefined && value !== '' && !neutral.includes(value);
    for (let node = element.parentElement; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      const reasons: string[] = [];
      for (const name of ['transform', 'translate', 'rotate', 'scale', 'perspective', 'filter']) {
        const value = s.getPropertyValue(name);
        if (set(value, 'none')) reasons.push(`${name}: ${value}`);
      }
      const backdrop =
        s.getPropertyValue('backdrop-filter') || s.getPropertyValue('-webkit-backdrop-filter');
      if (set(backdrop, 'none')) reasons.push(`backdrop-filter: ${backdrop}`);
      if (s.getPropertyValue('transform-style') === 'preserve-3d') reasons.push('preserve-3d');
      const willChange = s.getPropertyValue('will-change');
      if (/transform|translate|rotate|scale|perspective|filter|contain/.test(willChange))
        reasons.push(`will-change: ${willChange}`);
      const contain = s.getPropertyValue('contain');
      if (/layout|paint|strict|content/.test(contain)) reasons.push(`contain: ${contain}`);
      const containerType = s.getPropertyValue('container-type');
      if (set(containerType, 'normal')) reasons.push(`container-type: ${containerType}`);
      const visibility = s.getPropertyValue('content-visibility');
      if (set(visibility, 'visible')) reasons.push(`content-visibility: ${visibility}`);
      const offset = s.getPropertyValue('offset-path');
      if (set(offset, 'none')) reasons.push(`offset-path: ${offset}`);
      if (reasons.length > 0) {
        const name = `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${node.className}`;
        found.push(`${name}: ${reasons.join(', ')}`);
      }
    }
    return found;
  });
}

/** Lage im Fenster, gerundet auf halbe Pixel. */
async function place(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('Leiste nicht sichtbar');
  const round = (v: number) => Math.round(v * 2) / 2;
  return { left: round(b.x), bottom: round(b.y + b.height), width: round(b.width) };
}

/**
 * Prüft den Aufbau: Die Leiste ist fest, ohne eigene Lage per Skript, außerhalb des Rahmens, in
 * dem die Seite scrollt; das Fenster scrollt nicht.
 */
async function expectFixedOutsideFrame(fixed: Locator, label: string, scrolls = true) {
  expect(await framingAncestors(fixed), `${label}: Vorfahren mit eigenem Bezugsrahmen`).toEqual([]);
  const setup = await fixed.evaluate((element) => {
    const frame = document.getElementById('seite');
    const s = getComputedStyle(element);
    return {
      position: s.position,
      inlineStyle: element.getAttribute('style') ?? '',
      inFrame: frame?.contains(element) ?? true,
      frameScrolls: frame ? frame.scrollHeight > frame.clientHeight : false,
      windowRoom: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
  expect(setup.position, label).toBe('fixed');
  expect(setup.inlineStyle, `${label}: keine Lage per Skript`).toBe('');
  expect(setup.inFrame, `${label}: außerhalb des scrollenden Rahmens`).toBe(false);
  if (scrolls) expect(setup.frameScrolls, `${label}: die Seite scrollt im Rahmen`).toBe(true);
  expect(setup.windowRoom, `${label}: das Fenster scrollt nicht`).toBeLessThanOrEqual(0);
}

/** Merkt jede Änderung an Klasse und Stil der festen Leiste selbst (nicht ihres Inhalts). */
async function watch(fixed: Locator) {
  await fixed.evaluate((element) => {
    const log: string[] = [];
    (window as unknown as { __leiste: string[] }).__leiste = log;
    new MutationObserver((records) => {
      for (const record of records) log.push(record.attributeName ?? '?');
    }).observe(element, { attributes: true, attributeFilter: ['style', 'class'] });
  });
}

function changes(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __leiste: string[] }).__leiste);
}

/** Scrollen wie mit Finger oder Mausrad: Absicht (Taste), dann Bewegung im Rahmen. */
async function userScroll(page: Page, dy: number) {
  await page.evaluate((delta) => {
    const key = () =>
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: delta > 0 ? 'ArrowDown' : 'ArrowUp' }),
      );
    window.addEventListener('scroll', key, { capture: true, once: true });
    key();
    document.getElementById('seite')?.scrollBy(0, delta);
  }, dy);
}

/** Erwarteter Abstand der Unterkante zum Fensterrand: sicherer Bereich (nur Chromium) plus Rand. */
function bottomGap(chromium: boolean, pose: DuoPose, margin: number): number {
  return (chromium ? DUO[pose].insets.bottom : 0) + margin;
}

for (const pose of ['zu', 'auf'] as const) {
  test(`Duo ${pose}: Tab-Leiste und Kreis kleben beim Scrollen und am Seitenende unten (D-384)`, async ({
    page,
  }) => {
    test.slow();
    const chromium = await setDuoPose(page, pose);
    await openPage(page, '/uebungen');
    const bar = page.locator('nav.tabbar');
    const fixed = bar.locator('xpath=..');
    await expectFixedOutsideFrame(fixed, `${pose}, Tab-Leiste`);
    // Gegenprobe: Ein Vorfahre mit `will-change: transform` oder `container-type` fällt auf.
    await page.addStyleTag({
      content: '.app-shell { will-change: transform } body { container-type: inline-size }',
    });
    const probe = await framingAncestors(fixed);
    expect(probe.join(' | '), 'Gegenprobe').toMatch(/div\.app-shell: will-change: transform/);
    expect(probe.join(' | '), 'Gegenprobe').toMatch(/body\.: container-type: inline-size/);
    await page.evaluate(() => {
      document.head.lastElementChild?.remove();
    });
    expect(await framingAncestors(fixed)).toEqual([]);
    const height = page.viewportSize()?.height ?? 0;
    const full = await place(bar);
    expect(full.bottom, 'über dem sicheren Bereich').toBe(height - bottomGap(chromium, pose, 8));
    await watch(fixed);

    // Runter: Die Leiste wird zum Kreis und bleibt dann bei jedem Schritt an derselben Stelle.
    await userScroll(page, 400);
    await expect(bar).toHaveClass(/minimized/);
    await expect.poll(async () => (await place(bar)).width).toBeLessThan(80);
    await page.waitForTimeout(500);
    const circle = await place(bar);
    expect(circle.bottom, 'Kreis unten').toBe(height - bottomGap(chromium, pose, 8 + 4));
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.move(120, height / 2);
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(60);
      expect(await place(bar), `Schritt ${String(i + 1)}`).toEqual(circle);
    }
    // Ans Seitenende und darüber hinaus: Der Rahmen hält an, die Leiste bleibt.
    await page.evaluate(() => {
      const frame = document.getElementById('seite');
      frame?.scrollTo(0, frame.scrollHeight);
    });
    for (let i = 0; i < 3; i += 1) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(60);
      expect(await place(bar), `Seitenende ${String(i + 1)}`).toEqual(circle);
    }
    expect(await page.evaluate(() => window.scrollY), 'Fenster bleibt oben').toBe(0);

    // Hoch: wieder die ganze Leiste an ihrer Stelle.
    await userScroll(page, -200);
    await expect(bar).not.toHaveClass(/minimized/);
    await expect.poll(() => place(bar)).toEqual(full);
    // An der festen Leiste selbst hat nichts Klasse oder Stil geändert.
    expect(await changes(page)).toEqual([]);
  });
}

test('Duo: Tab-Leiste nach Auf- und Zuklappen und Drehen unten, auch mitten auf der Seite (D-384)', async ({
  page,
}) => {
  const chromium = await setDuoPose(page, 'zu');
  await openPage(page, '/heute');
  const bar = page.locator('nav.tabbar');
  const fixed = bar.locator('xpath=..');
  await page.evaluate(() => {
    const frame = document.getElementById('seite');
    frame?.scrollTo(0, (frame.scrollHeight - frame.clientHeight) / 2);
  });
  for (const pose of ['auf', 'hoch', 'zu', 'auf'] as const) {
    await setDuoPose(page, pose);
    const height = DUO[pose].height;
    await expect
      .poll(async () => (await place(bar)).bottom, pose)
      .toBe(height - bottomGap(chromium, pose, 8));
    // Im Zwischenmaß passt „Heute“ ohne Einträge womöglich ganz ins Fenster.
    await expectFixedOutsideFrame(fixed, `${pose}, Tab-Leiste`, pose !== 'hoch');
  }
});

test('Duo zu: Fußleiste und Kopf im Training bleiben beim Scrollen an ihrer Stelle (D-384)', async ({
  page,
}) => {
  test.slow();
  await setDuoPose(page, 'zu');
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  const done = page.getByRole('button', { name: 'Satz erledigt', exact: true });
  await expect(done).toBeVisible();
  const footer = done.locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
  await expectFixedOutsideFrame(footer, 'Fußleiste');
  const head = page.locator('main header');
  const height = DUO.zu.height;
  const start = await place(footer);
  expect(start.bottom, 'Fußleiste am unteren Rand').toBe(height);
  await watch(footer);

  for (let i = 0; i < 8; i += 1) {
    await page.mouse.move(120, height / 2);
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(60);
    expect(await place(footer), `Fußleiste, Schritt ${String(i + 1)}`).toEqual(start);
    // Der Kopf klebt oben am Rahmen, er scrollt nicht mit.
    expect((await head.boundingBox())?.y ?? -1, `Kopf, Schritt ${String(i + 1)}`).toBe(0);
  }
  await page.evaluate(() => {
    const frame = document.getElementById('seite');
    frame?.scrollTo(0, frame.scrollHeight);
  });
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(60);
  expect(await place(footer), 'Fußleiste am Seitenende').toEqual(start);
  expect(await page.evaluate(() => window.scrollY), 'Fenster bleibt oben').toBe(0);
  expect(await changes(page)).toEqual([]);
});
