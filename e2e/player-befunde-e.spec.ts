import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Befunde E1 und E2 aus dem Rundgang durch den Player (D-496), entschieden vom Produktinhaber
 * (D-525), am iPhone hoch wie im Befund (390 × 844):
 * - E1: Zahlen bleiben beim Wort. „Ziel 10“ und „Aufwärmsatz 1 von 2“ (seit D-537, vorher „Satz 1
 *   von 5“) brechen nicht zwischen Wort und Zahl um (geschütztes Leerzeichen); vorher stand „Ziel“
 *   am Zeilenende und „10“ allein darunter.
 * - E2: In der kleinen Pause steht der nächste Satz mit vollem Namen der Übung; vorher nur
 *   „Beinpresse,…“, weil „Nächster Satz:“ eine der zwei Zeilen brauchte. Die Bezeichnung bleibt
 *   für Screenreader.
 */
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

const NBSP = ' ';

/** Wie die installierte App vom Home-Bildschirm (ohne Hinweis zur Installation, D-498). */
function installed() {
  Object.defineProperty(Navigator.prototype, 'standalone', {
    configurable: true,
    get: () => true,
  });
}

async function startDayA(page: Page) {
  await page.addInitScript(installed);
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

/** Aktuellen Satz mit Werten erledigen; danach läuft die Pause. */
async function finishSet(page: Page) {
  const current = page.locator('li[aria-current="step"]');
  await current.getByLabel(/^Gewicht in kg, /).fill('60');
  await current.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toBeVisible();
}

/**
 * Lage eines Stücks Text im Element: Zahl der Zeilen, über die es läuft, und ob es ganz im
 * sichtbaren Teil steht (eine Zeilenbegrenzung schneidet den Rest ab). `null`, wenn es fehlt.
 */
function placeOf(
  element: Locator,
  part: string,
): Promise<{ lines: number; visible: boolean } | null> {
  return element.evaluate((el, text) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const value = node.textContent ?? '';
      const at = value.indexOf(text);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + text.length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      const bottom = el.getBoundingClientRect().top + el.clientHeight;
      return {
        lines: new Set(rects.map((r) => Math.round(r.top))).size,
        visible: rects.every((r) => r.bottom <= bottom + 1),
      };
    }
    return null;
  }, part);
}

test('E1: „Ziel“, „Aufwärmsatz“ und „von“ bleiben in „Jetzt“ in einer Zeile mit ihrer Zahl', async ({
  page,
}) => {
  await startDayA(page);
  const info = page.locator('.player-now-info');
  await expect(info).toContainText('Ziel');
  // Erster Satz des Tages: „Aufwärmsatz 1 von 2 · Ziel 10“ (D-537).
  for (const part of [`Aufwärmsatz${NBSP}1`, `von${NBSP}2`, `Ziel${NBSP}10`]) {
    expect(await placeOf(info, part), part).toEqual({ lines: 1, visible: true });
  }
});

test('E2: kleine Pause mit vollem Namen der nächsten Übung, auch bei langem Namen', async ({
  page,
}) => {
  test.slow();
  await startDayA(page);
  await finishSet(page);
  const rest = page.getByRole('region', { name: 'Pause' });
  const text = rest.locator('.rest-next-text');
  // „Nächster Satz“ nur für Screenreader: im Text, aber ohne sichtbare Fläche.
  await expect(text).toContainText('Nächster Satz');
  const label = await rest.locator('.rest-next-label').boundingBox();
  expect(label?.width ?? 0).toBeLessThanOrEqual(1);
  expect(await placeOf(text, 'Beinpresse, Aufwärmsatz')).toMatchObject({ visible: true });
  expect(await placeOf(text, `Ziel${NBSP}5`)).toEqual({ lines: 1, visible: true });

  // Letzter Satz der Beinpresse: Danach kommt die Übung mit dem längsten Namen des Tages.
  const sets = await page.locator('li[aria-current="step"]').count();
  expect(sets).toBe(1);
  for (let i = 0; i < 10; i += 1) {
    const next = (await text.textContent()) ?? '';
    if (!next.includes('Beinpresse')) break;
    await rest.getByRole('button', { name: 'Pause überspringen' }).click();
    await finishSet(page);
  }
  await expect(text).toContainText('Bankdrücken mit Kurzhanteln');
  expect(await placeOf(text, 'Bankdrücken mit Kurzhanteln')).toMatchObject({ visible: true });
});

/** Dali’s PPLC, Push, mit dem Fenster `size`: zuerst Dumbbell Bench Press, Ziel 6–10. */
async function startPush(page: Page, size: { width: number; height: number }) {
  await page.addInitScript(installed);
  await page.setViewportSize(size);
  await openPage(page, '/training/vorlagen/dalis-pplc');
  await page.getByRole('button', { name: 'Push heute trainieren' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

test('Kleine Pause: Spannen wie „6–10“ bleiben in einer Zeile (D-535)', async ({ page }) => {
  await startPush(page, { width: 390, height: 844 });
  await finishSet(page);
  await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
  await finishSet(page);
  const text = page.getByRole('region', { name: 'Pause' }).locator('.rest-next-text');
  await expect(text).toContainText('Arbeitssatz');
  // Vorher brach der Text nach dem Strich um: „Ziel 6–“ am Zeilenende, „10“ darunter.
  const range = await text.evaluate((el) => {
    const match = /6\u2013\u2060?10/.exec(el.textContent);
    return match ? match[0] : '';
  });
  expect(range, 'Spanne im Text').not.toBe('');
  expect(await placeOf(text, range)).toEqual({ lines: 1, visible: true });
});

test('Kleine Pause: Die Spaltenköpfe der aktuellen Übung bleiben unter der Pause sichtbar (D-535)', async ({
  page,
}) => {
  test.slow();
  // iPhone hoch und Duo zugeklappt wie am Gerät gemessen (D-393).
  for (const size of [
    { width: 390, height: 844 },
    { width: 382, height: 678 },
  ]) {
    await startPush(page, size);
    const head = page.locator('main header.player-head');
    const card = page.locator('section', {
      has: page.getByRole('heading', { level: 2, name: 'Dumbbell Bench Press', exact: true }),
    });
    const columns = card.getByText('#', { exact: true });
    const foot = page.getByRole('button', { name: 'Satz erledigt', exact: true });
    // Aufwärmsatz, Arbeitssatz 1 und 2: Jedes Mal erscheint die Pause und schiebt den Kopf nach unten.
    for (let i = 0; i < 3; i += 1) {
      if (i > 0) await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
      await finishSet(page);
      await page.waitForTimeout(400);
      const label = `${String(size.width)} × ${String(size.height)}, Satz ${String(i + 1)}`;
      const h = await head.boundingBox();
      const c = await columns.boundingBox();
      const row = await page.locator('li[aria-current="step"]').boundingBox();
      const f = await foot.boundingBox();
      expect(h && c && row && f, label).toBeTruthy();
      if (!h || !c || !row || !f) return;
      expect(c.y, `${label}: Spaltenköpfe unter der Pause`).toBeGreaterThanOrEqual(
        h.y + h.height - 1,
      );
      expect(row.y + row.height, `${label}: aktiver Satz über der Fußleiste`).toBeLessThanOrEqual(
        f.y,
      );
    }
    await page.getByRole('button', { name: 'Beenden', exact: true }).click();
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: /beenden/i })
      .last()
      .click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
    ).toBeVisible();
  }
});
