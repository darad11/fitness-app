import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Befunde E1 und E2 aus dem Rundgang durch den Player (D-496), entschieden vom Produktinhaber
 * (D-525), am iPhone hoch wie im Befund (390 × 844):
 * - E1: Zahlen bleiben beim Wort. „Ziel 10“ und „Satz 1 von 5“ brechen nicht zwischen Wort und
 *   Zahl um (geschütztes Leerzeichen); vorher stand „Ziel“ am Zeilenende und „10“ allein darunter.
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

test('E1: „Ziel“, „Satz“ und „von“ bleiben in „Jetzt“ in einer Zeile mit ihrer Zahl', async ({
  page,
}) => {
  await startDayA(page);
  const info = page.locator('.player-now-info');
  await expect(info).toContainText('Ziel');
  for (const part of [`Satz${NBSP}1`, `von${NBSP}5`, `Ziel${NBSP}10`]) {
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
