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

/**
 * „Weitere Nährwerte“ kompakt (D-363): jede Zeile einzeilig, nichts ragt hinaus. Mit vollem Namen
 * bis 360 pt; erst darunter (Liste schmaler als 16 rem) „Ges. Fettsäuren“.
 */
for (const width of [320, 360, 390]) {
  test(`Weitere Nährwerte: jede Zeile einzeilig (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.slow();
    await setWidth(page, width, isMobile);
    // Butter (viele gesättigte Fettsäuren) und ein Schnelleintrag ohne diese Werte (Sternchen).
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.getByLabel('Lebensmittel suchen').fill('Butter');
    await page.getByRole('button', { name: /^Butter\s*BLS/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Butter hinzufügen' });
    await dialog.getByLabel('Menge in g').fill('100');
    await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
    await page.getByRole('button', { name: 'Schnelleintrag' }).click();
    const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
    await quick.getByLabel('Energie (kcal)').fill('300');
    await quick.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(quick).toBeHidden();
    await openPage(page, '/ernaehrung');
    await page.locator('summary[aria-label="Weitere Nährwerte"]').click();
    const extras = page.getByRole('group', { name: 'Weitere Nährwerte' });
    await expect(extras).toContainText('56* (nicht bei allen Einträgen angegeben) / 20 g');
    const rows = extras.locator('dl > div');
    await expect(rows).toHaveCount(4);
    for (const row of await rows.all()) {
      const label = (await row.textContent()) ?? '';
      const counts = await lineCounts(row);
      expect(counts.length, `${label}: Text sichtbar`).toBeGreaterThan(0);
      expect(Math.max(...counts), `${label}: kein Umbruch`).toBe(1);
      const box = await row.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        overflow: element.scrollWidth > element.clientWidth,
      }));
      expect(box.height, `${label}: eine Zeile`).toBeLessThan(box.lineHeight * 1.5);
      expect(box.overflow, `${label}: ragt nicht hinaus`).toBe(false);
    }
    const short = extras.getByText('Ges. Fettsäuren', { exact: true });
    if (width < 360) await expect(short).toBeVisible();
    else await expect(short).toBeHidden();
  });
}

/**
 * Nährwerttabelle im Lebensmittel-Blatt (D-364): Köpfe und Werte einzeilig in festen Spalten,
 * die zweite Spalte nur, wenn die Menge von 100 g abweicht. Namen dürfen umbrechen,
 * „davon gesättigte Fettsäuren“ höchstens in zwei Zeilen.
 */
for (const width of [360, 390]) {
  test(`Nährwerttabelle: Köpfe und Werte einzeilig, Feta 100 g eine Spalte, 150 g zwei (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    await setWidth(page, width, isMobile);
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.getByLabel('Lebensmittel suchen').fill('Feta');
    await page.getByRole('button', { name: /^Feta\s*BLS/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Feta hinzufügen' });
    const table = dialog.getByRole('table', { name: 'Nährwerte' });
    await expect(table.getByRole('columnheader')).toHaveText(['je 100 g']);
    const widths = async () =>
      table
        .locator('tbody tr:first-child td')
        .evaluateAll((cells) =>
          cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
        );
    for (const amount of ['150', '1500']) {
      await dialog.getByLabel('Menge in g').fill(amount);
      await expect(table.getByRole('columnheader')).toHaveText([
        'je 100 g',
        amount === '150' ? 'für 150 g' : /^für 1\D500 g$/,
      ]);
      for (const cell of await table.locator('thead th, tbody td').all()) {
        const text = (await cell.textContent()) ?? '';
        expect(Math.max(...(await lineCounts(cell))), `${text}: eine Zeile`).toBe(1);
      }
      const saturated = table.getByRole('rowheader', { name: 'davon gesättigte Fettsäuren' });
      expect(
        Math.max(...(await lineCounts(saturated))),
        'Name in höchstens zwei Zeilen',
      ).toBeLessThanOrEqual(2);
      expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
    }
    // Feste Spaltenbreite: 150 g und 1.500 g ergeben dieselben Spalten.
    const wide = await widths();
    await dialog.getByLabel('Menge in g').fill('150');
    expect(await widths(), 'Spalten gleich breit').toEqual(wide);
    expect(await headerGap(table), 'Abstand zwischen den Köpfen').toBeGreaterThanOrEqual(6);
  });

  test(`Nährwerttabelle: „für 1,5 Scheiben“ einzeilig mit Abstand zum Nachbarkopf (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    await setWidth(page, width, isMobile);
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.getByLabel('Lebensmittel suchen').fill('Schwarzbrot');
    await page.getByRole('button', { name: /^Schwarzbrot\s*BLS/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Schwarzbrot hinzufügen' });
    await dialog.getByRole('button', { name: 'Anzahl erhöhen' }).click();
    const table = dialog.getByRole('table', { name: 'Nährwerte' });
    await expect(table.getByRole('columnheader')).toHaveText(['je 100 g', 'für 1,5 Scheiben']);
    for (const cell of await table.locator('thead th, tbody td').all()) {
      const text = (await cell.textContent()) ?? '';
      expect(Math.max(...(await lineCounts(cell))), `${text}: eine Zeile`).toBe(1);
    }
    expect(await headerGap(table), 'Abstand zwischen den Köpfen').toBeGreaterThanOrEqual(6);
    expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
  });
}

/** Abstand in px zwischen dem Text des ersten und des zweiten Spaltenkopfs. */
function headerGap(table: Locator) {
  return table.locator('thead th').evaluateAll((cells) => {
    const [first, second] = cells.map((cell) => {
      const range = document.createRange();
      range.selectNodeContents(cell);
      return range.getBoundingClientRect();
    });
    return first && second ? second.left - first.right : Number.NaN;
  });
}
