import type { Locator, Page } from '@playwright/test';
import { DUO, setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

/**
 * Scroll-Balken (D-392): Am Touch-Gerät ist in keinem scrollbaren Bereich ein Balken zu sehen,
 * weder im Rahmen der Seite noch in Blättern, Listen und Dialogen. Gescrollt wird wie bisher, auch
 * bei offener Tastatur. Am Computer mit Maus bleiben sie, dünn und dunkel in den Farben der App
 * (`--scrollbar-thumb` auf durchsichtiger Spur), und die Scroll-Tasten scrollen weiter.
 */

interface Scroller {
  name: string;
  width: string;
  color: string;
}

/** Alle Bereiche, die gerade scrollen können: Inhalt höher oder breiter als der Bereich. */
function scrollers(page: Page): Promise<Scroller[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('*')].flatMap((element) => {
      const style = getComputedStyle(element);
      const scrolls = (overflow: string) => overflow === 'auto' || overflow === 'scroll';
      const y = scrolls(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
      const x = scrolls(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
      if (!x && !y) return [];
      const classes = [...element.classList].slice(0, 2).join('.');
      const name = element.id
        ? `#${element.id}`
        : `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
      return [{ name, width: style.scrollbarWidth, color: style.scrollbarColor }];
    }),
  );
}

/** Scrollt mit dem Mausrad über dem Bereich und meldet, wie weit er gescrollt hat. */
async function wheelScrolls(page: Page, area: Locator): Promise<number> {
  const box = await area.boundingBox();
  if (!box) return 0;
  const before = await area.evaluate((element) => element.scrollTop);
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 200));
  await page.mouse.wheel(0, 300);
  await expect.poll(() => area.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
  return (await area.evaluate((element) => element.scrollTop)) - before;
}

test.describe('am Touch-Gerät', () => {
  test.skip(({ isMobile }) => !isMobile, 'nur am Touch-Gerät');
  test.beforeEach(async ({ page }) => {
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    test.skip(!coarse, 'Engine meldet keinen Touch-Zeiger (pointer: coarse)');
    const supported = await page.evaluate(() => CSS.supports('scrollbar-width', 'none'));
    test.skip(!supported, 'Engine kennt scrollbar-width nicht');
  });

  test('keine Scroll-Balken im Rahmen, in Blättern, Listen und Dialogen; Scrollen wie bisher (D-392)', async ({
    page,
  }) => {
    await setDuoPose(page, 'zu');
    // Rahmen der Seite: lange Übungsliste.
    await openPage(page, '/uebungen');
    const frame = page.locator('#seite');
    let found = await scrollers(page);
    expect(found.map((s) => s.name)).toContain('#seite');
    expect(found.filter((s) => s.width !== 'none')).toEqual([]);
    expect(await wheelScrolls(page, frame)).toBeGreaterThan(0);

    // Blatt mit Liste: Übung auswählen im freien Training.
    await openPage(page, '/training');
    await page.getByRole('button', { name: 'Freies Training starten' }).click();
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
    const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
    await expect(picker).toBeVisible();
    found = await scrollers(page);
    const inSheet = await picker.evaluate(
      (dialog) =>
        [...dialog.querySelectorAll('*')].filter(
          (element) => element.scrollHeight > element.clientHeight + 1,
        ).length,
    );
    expect(inSheet, 'im Blatt scrollt etwas').toBeGreaterThan(0);
    expect(found.filter((s) => s.width !== 'none')).toEqual([]);
    const list = picker.locator('.overflow-y-auto').first();
    expect(await wheelScrolls(page, list)).toBeGreaterThan(0);
  });

  test('bei offener Tastatur scrollt die Seite wie bisher, ohne Balken (D-392)', async ({
    page,
  }) => {
    await setDuoPose(page, 'zu');
    await openPage(page, '/ernaehrung/ziele');
    const field = page.getByLabel('Energie (kcal)');
    await field.focus();
    // Tastatur: Das Fenster wird um gut die Hälfte niedriger (wie D-391).
    await page.setViewportSize({ width: DUO.zu.width, height: Math.round(DUO.zu.height * 0.45) });
    const frame = page.locator('#seite');
    expect(await wheelScrolls(page, frame)).toBeGreaterThan(0);
    expect((await scrollers(page)).filter((s) => s.width !== 'none')).toEqual([]);
    await expect(field).toBeFocused();
  });
});

test.describe('am Computer', () => {
  test.skip(({ isMobile }) => isMobile, 'nur am Computer');

  test('Scroll-Balken dünn und dunkel in den Farben der App, Scroll-Tasten wie bisher (D-392)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openPage(page, '/uebungen');
    const support = await page.evaluate(() => ({
      width: CSS.supports('scrollbar-width', 'thin'),
      color: CSS.supports('scrollbar-color', 'red blue'),
    }));
    const found = await scrollers(page);
    expect(found.map((s) => s.name)).toContain('#seite');
    // Dünn, in jedem scrollbaren Bereich (ohne `scrollbar-width` zeichnet die App sie selbst).
    if (support.width) {
      for (const scroller of found) expect(scroller.width, scroller.name).toBe('thin');
    }
    // Dunkel in den Farben der App: Griff aus `--scrollbar-thumb`, Spur durchsichtig.
    const thumb = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-thumb').trim(),
    );
    expect(thumb).toMatch(/^#[0-9a-f]{6}$/i);
    if (support.color) {
      const [r, g, b] = [1, 3, 5].map((i) => String(parseInt(thumb.slice(i, i + 2), 16)));
      for (const scroller of found) {
        expect(scroller.color, scroller.name).toBe(`rgb(${r}, ${g}, ${b}) rgba(0, 0, 0, 0)`);
      }
    }
    // Schmaler als ein Balken ohne Vorgabe, wenn die Engine Balken mit eigener Breite zeichnet
    // (Playwright blendet sie in Chromium ohne Fenster aus; dann ist beides 0).
    const widths = await page.evaluate(() => {
      const frame = document.getElementById('seite');
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;top:0;left:0;width:100px;height:100px;overflow:scroll;scrollbar-width:auto';
      document.body.append(probe);
      const auto = probe.offsetWidth - probe.clientWidth;
      probe.remove();
      return { frame: frame ? frame.offsetWidth - frame.clientWidth : -1, auto };
    });
    if (support.width && widths.auto > 0) {
      expect(widths.frame, 'Balken zu sehen').toBeGreaterThan(0);
      expect(widths.frame, 'dünner als ohne Vorgabe').toBeLessThan(widths.auto);
    }
    // Scroll-Tasten ohne Fokus scrollen den Rahmen wie bisher (D-384).
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    const frame = page.locator('#seite');
    await page.keyboard.press('PageDown');
    await expect.poll(() => frame.evaluate((element) => element.scrollTop)).toBeGreaterThan(300);
  });
});
