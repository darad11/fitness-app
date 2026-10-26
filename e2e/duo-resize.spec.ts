import type { Locator, Page } from '@playwright/test';
import { setDuoPose, type DuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Auf- und Zuklappen beim iPhone Duo (D-375): Das Fenster ändert seine Größe; nichts darf dabei
// verloren gehen (Leitlinien Kapitel 6). Chromium und WebKit, Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

/** Element des Inhalts auf der Leselinie (ein Viertel der Fensterhöhe), markiert für den Test. */
async function markReadingLine(page: Page): Promise<Locator> {
  const found = await page.evaluate(() => {
    const main = document.getElementById('inhalt');
    if (!main) return false;
    const box = main.getBoundingClientRect();
    const hit = document
      .elementsFromPoint(box.left + box.width / 2, window.innerHeight / 4)
      .find(
        (element) =>
          element !== main &&
          main.contains(element) &&
          element.getBoundingClientRect().height < window.innerHeight,
      );
    hit?.setAttribute('data-test-reading', '');
    return Boolean(hit);
  });
  expect(found, 'Element auf der Leselinie').toBe(true);
  return page.locator('[data-test-reading]');
}

async function topOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element nicht sichtbar');
  return box.y;
}

for (const path of ['/heute', '/training/programme']) {
  test(`Leseposition auf ${path} bleibt beim Auf- und Zuklappen (D-375)`, async ({ page }) => {
    await setDuoPose(page, 'zu');
    await openPage(page, path);
    await page.evaluate(() => {
      // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
      const scroller = document.getElementById('seite');
      scroller?.scrollTo(0, (scroller.scrollHeight - scroller.clientHeight) * 0.5);
    });
    await page.waitForTimeout(300);
    const reading = await markReadingLine(page);
    const before = await topOf(reading);
    for (const pose of ['auf', 'hoch', 'zu'] as const) {
      await setDuoPose(page, pose);
      await expect.poll(() => topOf(reading), `${pose}: Leselinie`).toBeCloseTo(before, -0.5);
    }
  });
}

/** Restzeit der Pause in Sekunden aus „Restzeit 1:58“. */
async function restSeconds(page: Page): Promise<number> {
  const label = (await page.getByRole('timer').first().getAttribute('aria-label')) ?? '';
  const match = /(\d+):(\d{2})/.exec(label);
  if (!match) throw new Error(`Keine Restzeit: ${label}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

test('Training: Satz, Werte, Pause, Menü, Notiz und Position bleiben beim Auf- und Zuklappen (D-375)', async ({
  page,
}) => {
  await setDuoPose(page, 'zu');
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
  const url = page.url();

  // Ersten Satz mit Werten erledigen: Die Pause läuft.
  const first = page.locator('li[aria-current="step"]');
  await first.getByLabel(/^Gewicht in kg, /).fill('60');
  await first.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('timer').first()).toBeVisible();
  // Im nächsten Satz einen Wert tippen und das Menü des Satzes öffnen.
  const current = page.locator('li[aria-current="step"]');
  const setId = await current.getAttribute('data-set-id');
  await current.getByLabel(/^Gewicht in kg, /).fill('77');
  const more = current.getByRole('button', { name: /^Weitere Aktionen/ });
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  const rows = await page.locator('li[data-set-id]').count();
  const rowTop = await topOf(current);
  let rest = await restSeconds(page);

  // Erst in einer Spalte (Zwischenmaß, zugeklappt), dann aufgeklappt in zwei Spalten und zurück.
  let twoColumnsSeen = false;
  for (const pose of ['hoch', 'zu', 'auf', 'zu'] as const satisfies readonly DuoPose[]) {
    await setDuoPose(page, pose);
    await page.waitForTimeout(300);
    expect(page.url(), `${pose}: dieselbe Einheit`).toBe(url);
    await expect(current, `${pose}: derselbe Satz`).toHaveAttribute('data-set-id', setId ?? '');
    await expect(current.getByLabel(/^Gewicht in kg, /)).toHaveValue('77');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(await page.locator('li[data-set-id]').count(), `${pose}: keine Aktion doppelt`).toBe(
      rows,
    );
    // Die Pause läuft weiter und beginnt nicht von vorn.
    const now = await restSeconds(page);
    expect(now).toBeLessThanOrEqual(rest);
    expect(now).toBeGreaterThan(0);
    rest = now;
    if (pose === 'auf') twoColumnsSeen = true;
    if (twoColumnsSeen) {
      // Aufgeklappt zwei Spalten (D-380): Der Kopf steht neben der Liste, der Satz rückt um die
      // Höhe des Kopfs nach oben; ganz oben kann die Seite das nicht ausgleichen. Er bleibt ganz
      // sichtbar über der Fußleiste, zugeklappt wieder unter dem Kopf, nicht dahinter.
      const head = pose === 'auf' ? null : await page.locator('main header').boundingBox();
      const top = head ? head.y + head.height : 0;
      await expect
        .poll(async () => {
          const box = await current.boundingBox();
          const foot = await page
            .getByRole('button', { name: 'Satz erledigt', exact: true })
            .boundingBox();
          return Boolean(box && foot && box.y >= top - 1 && box.y + box.height <= foot.y + 1);
        }, `${pose}: sichtbar`)
        .toBe(true);
    } else {
      // In einer Spalte steht der Satz an derselben Stelle.
      expect(Math.abs((await topOf(current)) - rowTop), `${pose}: Position`).toBeLessThanOrEqual(4);
    }
  }

  // Offener Dialog mit getipptem Text bleibt offen.
  await page.getByRole('button', { name: 'Notiz zur Einheit' }).click();
  const note = page.getByRole('dialog', { name: 'Notiz zur Einheit' });
  await note.getByLabel('Notiz', { exact: true }).fill('Gut geschlafen');
  for (const pose of ['auf', 'zu'] as const) {
    await setDuoPose(page, pose);
    await expect(note).toBeVisible();
    await expect(note.getByLabel('Notiz', { exact: true })).toHaveValue('Gut geschlafen');
  }
});
