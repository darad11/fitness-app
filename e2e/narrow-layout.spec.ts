import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Schmale Breiten (F5 Abschnitt 9, D-331): Knopftexte einzeilig, kein Wort getrennt, Feldnamen
 * ragen nicht in die Nachbarspalte, Knöpfe der Woche brechen gemeinsam um.
 */

/** Zeilen je sichtbarem Textknoten (Vorlesetext mit 1 × 1 px zählt nicht). */
function lineCounts(locator: Locator) {
  return locator.evaluate((element) => {
    const counts: number[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !(node.textContent ?? '').trim()) continue;
      const box = parent.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      counts.push(new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size);
    }
    return counts;
  });
}

/** Wörter, die über zwei Zeilen laufen (Umbruch nur an Leerzeichen und nach „/“). */
function splitWords(locator: Locator) {
  return locator.evaluate((element) => {
    const found: string[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const match of (node.textContent ?? '').matchAll(/[^\s/]+\/?/g)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        if (new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size > 1)
          found.push(match[0]);
      }
    }
    return found;
  });
}

async function setWidth(page: Page, width: number, isMobile: boolean) {
  test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
  await page.setViewportSize({ width, height: 844 });
}

for (const width of [360, 390, 768]) {
  test(`Knöpfe einzeilig: Ziel, Meine Küche, Übernehmen, Heute trainieren (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    await setWidth(page, width, isMobile);
    await openPage(page, '/ernaehrung');
    const shortcuts = page.getByRole('navigation', { name: 'Ziel und Meine Küche' });
    for (const name of ['Ziel', 'Meine Küche']) {
      const control = shortcuts.getByRole(name === 'Ziel' ? 'link' : 'button', { name });
      expect(await lineCounts(control), `${name} in einer Zeile`).toEqual([1]);
    }
    await openPage(page, '/training/vorlagen/winterprogramm-2026');
    const adopt = page.getByRole('button', { name: 'Übernehmen und anpassen' });
    expect(await lineCounts(adopt), 'Übernehmen in einer Zeile').toEqual([1]);
    // Sichtbar „Heute trainieren“, der Name nennt den Tag.
    const day = page.getByRole('button', {
      name: 'Tag 14 · Unterkörper und Bauch heute trainieren',
    });
    await expect(day).toHaveText('Heute trainieren');
    expect(await lineCounts(day), 'Heute trainieren in einer Zeile').toEqual([1]);
  });

  test(`Schnelleintrag: Feldnamen bleiben in ihrer Spalte (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    await setWidth(page, width, isMobile);
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
    await page.getByRole('button', { name: 'Schnelleintrag' }).click();
    const dialog = page.getByRole('dialog', { name: 'Schnelleintrag' });
    const names = ['Eiweiß (g, optional)', 'Kohlenhydrate (g, optional)', 'Fett (g, optional)'];
    const boxes = [];
    for (const name of names) {
      const field = dialog.getByLabel(name);
      await expect(field).toBeVisible();
      const label = dialog.locator('label', { hasText: name.split(' ')[0] ?? name }).first();
      const box = await label.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const own = element.getBoundingClientRect();
        return { left: text.left, right: text.right, ownLeft: own.left, ownRight: own.right };
      });
      expect(box.right, `${name}: Text in der eigenen Spalte`).toBeLessThanOrEqual(
        box.ownRight + 0.5,
      );
      expect(await splitWords(label), `${name}: kein Wort getrennt`).toEqual([]);
      boxes.push(box);
    }
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i]?.left ?? 0, 'keine Überlappung').toBeGreaterThanOrEqual(
        (boxes[i - 1]?.right ?? 0) - 0.5,
      );
    }
  });

  test(`Programm bearbeiten: Wochenname ungeteilt, Knöpfe in einer Reihe (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    await setWidth(page, width, isMobile);
    await openPage(page, '/training/vorlagen/full_body_ab');
    await page.getByRole('button', { name: 'Übernehmen und anpassen' }).click();
    await expect(page).toHaveURL(/\/training\/programme\/[^/]+$/);
    await openPage(page, `${new URL(page.url()).pathname}/bearbeiten`);
    const week = page.getByRole('heading', { level: 3, name: 'Woche 1' });
    expect(await splitWords(week), 'Woche 1 ungeteilt').toEqual([]);
    const tops = await Promise.all(
      ['Woche 1 umbenennen', 'Woche 1 nach oben', 'Woche 1 nach unten', 'Woche 1 duplizieren'].map(
        async (name) => (await page.getByRole('button', { name }).boundingBox())?.y ?? -1,
      ),
    );
    const remove = (await page.getByRole('button', { name: 'Woche 1 löschen' }).boundingBox())?.y;
    for (const top of tops)
      expect(Math.abs(top - (remove ?? 0)), 'Knöpfe in einer Reihe').toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
