import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Aktives Training ohne Sprung (F5, D-323): Bis F5 verschwand beim Erledigen eines Satzes die
 * Karte „Jetzt“ über der Liste, während oben die Pausenkarte erschien; der erledigte und der
 * nächste Satz rutschten hinter Kopf und Pausenkarte. Geprüft wird ein ganzes Training mit fünf
 * Übungen und 17 Sätzen im Handy-Format, abwechselnd abgeschlossen
 * - über die Tastatur: Wert eingeben, mit Enter (Häkchen der Tastaturleiste) bestätigen, dann
 *   „Satz erledigt“, und
 * - direkt: Wert eingeben und bei offener Tastatur „Satz erledigt“ tippen.
 * Vor jedem Satz liegt der aktive Satz direkt unter dem Kopf (der ungünstigste Fall). Während
 * der Eingabe darf sich nichts verschieben; danach liegt der nächste aktive Satz ganz zwischen
 * Kopf (mit Pausenkarte) und Fußleiste.
 */

const currentRow = (page: Page) => page.locator('li[aria-current="step"]');

async function edges(page: Page) {
  const head = await page.locator('header').first().boundingBox();
  const done = page.getByRole('button', { name: 'Satz erledigt', exact: true });
  const foot = await done.locator('xpath=../..').boundingBox();
  return { top: (head?.y ?? 0) + (head?.height ?? 0), bottom: foot?.y ?? Infinity };
}

/** Der Satz liegt ganz sichtbar zwischen Kopf und Fußleiste (wartet auf sanftes Scrollen). */
async function expectUncovered(page: Page, row: Locator, label: string) {
  await expect
    .poll(
      async () => {
        const box = await row.boundingBox();
        const { top, bottom } = await edges(page);
        if (!box) return 'nicht da';
        if (box.y < top - 1) return `verdeckt vom Kopf (${String(Math.round(top - box.y))} px)`;
        if (box.y + box.height > bottom + 1) return 'verdeckt von der Fußleiste';
        return 'sichtbar';
      },
      { message: label, timeout: 3000 },
    )
    .toBe('sichtbar');
}

/** Wert für das erste Feld des Satzes, passend zur Erfassung. */
function valueFor(label: string): string {
  if (label.startsWith('Gewicht')) return '60';
  if (label.startsWith('Zeit')) return '30';
  return '8';
}

test('Ganzes Training im Handy-Format: nach jedem Satz liegt der nächste sichtbar unter Kopf und Pausenkarte (F5, D-323)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Handy-Format');
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A', exact: true })).toBeVisible();
  // Kopf: Programm und Woche klein darüber, als Titel nur der Tag, einzeilig.
  await expect(page.getByText('Ganzkörper A/B · Woche 1', { exact: true })).toBeVisible();
  const title = await page.getByRole('heading', { level: 1 }).boundingBox();
  expect(title?.height ?? 0).toBeLessThan(40);

  const total = 17;
  for (let done = 0; done < total; done += 1) {
    const row = currentRow(page);
    await expect(row).toHaveCount(1);
    const name = (await row.getAttribute('aria-label')) ?? '';
    // Ungünstigster Fall: der aktive Satz direkt unter dem Kopf.
    await row.evaluate((element) => {
      element.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    const fields = row.locator('input');
    const count = await fields.count();
    await fields.first().click();
    // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
    const scrollTop = () => page.evaluate(() => document.getElementById('seite')?.scrollTop);
    const scrollBefore = await scrollTop();
    const rowTop = (await row.boundingBox())?.y;
    for (let i = 0; i < count; i += 1) {
      const field = fields.nth(i);
      if (i > 0) await field.click();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(valueFor((await field.getAttribute('aria-label')) ?? ''), {
        delay: 30,
      });
    }
    await page.waitForTimeout(400); // Speichern nach 300 ms
    expect(await scrollTop(), `${name}: keine Bewegung beim Tippen`).toBe(scrollBefore);
    expect((await row.boundingBox())?.y, `${name}: Satz bleibt stehen`).toBe(rowTop);
    const field = fields.nth(count - 1);
    await expect(field).toBeFocused();
    if (done % 2 === 0) {
      await page.keyboard.press('Enter');
      await expect(field).not.toBeFocused();
    }
    await page.getByRole('button', { name: 'Satz erledigt', exact: true }).tap();
    await expect(page.getByText(`${String(done + 1)} von ${String(total)} Sätzen`)).toBeVisible();
    if (done + 1 < total) {
      await expect(page.getByText('Nächster Satz:', { exact: false }).first()).toBeVisible();
      await expectUncovered(page, currentRow(page), `nach „${name}“`);
    }
    // Jeder dritte Satz: Pause überspringen, der aktive Satz bleibt sichtbar.
    if (done % 3 === 2 && done + 1 < total) {
      await page
        .getByRole('button', { name: /^Pause überspringen|^Überspringen$/ })
        .first()
        .tap();
      await expectUncovered(page, currentRow(page), `nach Überspringen nach „${name}“`);
    }
  }
  await expect(page.getByText(`${String(total)} von ${String(total)} Sätzen`)).toBeVisible();
});
