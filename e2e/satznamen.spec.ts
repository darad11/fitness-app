import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Gleiche Satznamen überall (D-537, Entscheidung des Produktinhabers vom 07.11.2026): Der
 * Aufwärmsatz heißt „Aufwärmsatz“, danach „Arbeitssatz 1 von 3“ und so weiter, in „Jetzt“, in der
 * Pause und in der Satzliste gleich. Beim Gerätetest am Duo (Dali’s PPLC, Push) stand für denselben
 * Satz in „Jetzt“ „Arbeitssatz · Satz 3 von 4“ und in der Pause „Arbeitssatz 2“.
 */
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

const PUSH = 'Dumbbell Bench Press';

async function startPush(page: Page) {
  await openPage(page, '/training/vorlagen/dalis-pplc');
  await page.getByRole('button', { name: 'Push heute trainieren' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

/** Aktuellen Satz mit Werten erledigen; danach läuft die Pause. */
async function finishSet(page: Page) {
  const row = page.locator('li[aria-current="step"]');
  await row.getByLabel(/^Gewicht in kg, /).fill('20');
  await row.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toBeVisible();
}

/** Zeile unter dem Namen in „Jetzt“, Leerzeichen vereinheitlicht. */
async function nowInfo(now: Locator): Promise<string> {
  const text = await now.locator('.player-now-info').textContent();
  return (text ?? '').replace(/\s+/g, ' ');
}

/** Hervorgehobener Satz der Liste: sein Name für Screenreader. */
function current(page: Page) {
  return page.locator('li[aria-current="step"]');
}

/** Steht das letzte Zeichen des Textes in den sichtbaren Zeilen, oder schneidet die Pause ab? */
async function lastCharShown(text: Locator): Promise<boolean> {
  return text.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent?.trim()) last = node as Text;
    }
    if (!last) return false;
    const range = document.createRange();
    range.setStart(last, last.length - 1);
    range.setEnd(last, last.length);
    const rect = [...range.getClientRects()].pop();
    return !!rect && rect.bottom <= el.getBoundingClientRect().top + el.clientHeight + 1;
  });
}

test('Duo aufgeklappt: „Jetzt“, Pause und Satzliste nennen den Satz gleich (D-537)', async ({
  page,
}) => {
  test.slow();
  // Fenster wie am Gerät gemessen (Duo quer, D-393): rechts auch in der Pause „Jetzt“ (D-533).
  await page.setViewportSize({ width: 867, height: 669 });
  await startPush(page);
  const now = page.getByRole('region', { name: 'Jetzt' });
  const rest = page.getByRole('region', { name: 'Pause' });

  await expect.poll(() => nowInfo(now)).toMatch(/^Aufwärmsatz · Ziel 8–⁠?10/);
  await expect(current(page)).toHaveAccessibleName(`${PUSH}, Aufwärmsatz`);

  for (const n of [1, 2, 3]) {
    await finishSet(page);
    const name = `Arbeitssatz ${String(n)} von 3`;
    await expect(rest).toContainText(`${PUSH}, ${name}`);
    // Im Kopf links bis zum Ziel zu sehen, nicht abgeschnitten nach „von 3 ·…“.
    expect(
      await lastCharShown(rest.locator('.rest-next-text')),
      `Ziel in der Pause vor ${name}`,
    ).toBe(true);
    await expect(now, `„Jetzt“ in der Pause vor ${name}`).toBeVisible();
    await expect.poll(() => nowInfo(now)).toMatch(new RegExp(`^${name} · Ziel 6–⁠?10`));
    await expect(current(page)).toHaveAccessibleName(`${PUSH}, ${name}`);
    // Die alte Zählung über alle Sätze der Übung („Satz 3 von 4“) gibt es nicht mehr.
    await expect(page.getByText(/(^|\s)Satz\s\d\svon\s\d/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
    await expect(rest).toHaveCount(0);
  }
});

test('iPhone hoch: Pause und danach „Jetzt“ nennen denselben Arbeitssatz (D-537)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startPush(page);
  const now = page.getByRole('region', { name: 'Jetzt' });
  await expect.poll(() => nowInfo(now)).toMatch(/^Aufwärmsatz · Ziel/);
  await finishSet(page);
  // Eine Spalte: Die Pause steht an der Stelle von „Jetzt“ und nennt den nächsten Satz.
  await expect(page.getByRole('region', { name: 'Pause' })).toContainText(
    `${PUSH}, Arbeitssatz 1 von 3`,
  );
  await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
  await expect.poll(() => nowInfo(now)).toMatch(/^Arbeitssatz 1 von 3 · Ziel/);
  await expect(current(page)).toHaveAccessibleName(`${PUSH}, Arbeitssatz 1 von 3`);
});
