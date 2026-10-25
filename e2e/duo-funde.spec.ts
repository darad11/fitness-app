import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Weitere Funde der Prüfung in drei Breiten (D-377). Handy-Profil; der Test zum sicheren Bereich
// nur in Chromium (D-371).
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

test('Training: Der Kopf ist so breit wie der Inhalt, auch neben dem Systemrand (D-377)', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Sicherer Bereich nur in Chromium nachstellbar');
  await setDuoPose(page, 'zu');
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
  const edges = await page.evaluate(() => {
    const inner = (el: Element) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        left: box.left + parseFloat(style.paddingLeft),
        right: box.right - parseFloat(style.paddingRight),
        outerLeft: box.left,
        outerRight: box.right,
      };
    };
    const header = document.querySelector('main header');
    const main = document.querySelector('main');
    if (!header || !main) throw new Error('Kopf fehlt');
    return { header: inner(header), main: inner(main), width: window.innerWidth };
  });
  // Fläche bis an den Fensterrand, Inhalt bündig mit dem Inhalt der Seite.
  expect(edges.header.outerLeft).toBeLessThanOrEqual(0.5);
  expect(edges.header.outerRight).toBeGreaterThanOrEqual(edges.width - 0.5);
  expect(Math.abs(edges.header.right - edges.main.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(edges.header.left - edges.main.left)).toBeLessThanOrEqual(1);
});

test('Lebensmittel hinzufügen: Die Mahlzeit bleibt in jeder Breite lesbar (D-377)', async ({
  page,
}) => {
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=snacks');
  const select = page.getByLabel('Mahlzeit');
  for (const width of [382, 466, 600, 640, 669, 700, 767, 768, 951]) {
    await page.setViewportSize({ width, height: 800 });
    const box = await select.boundingBox();
    // „Mittagessen“ samt Pfeil braucht rund 150 px.
    expect(box?.width ?? 0, `${String(width)} px`).toBeGreaterThanOrEqual(150);
  }
});

/** Liegt die Mitte des Elements frei, also nicht unter der Tab-Leiste oder außerhalb? */
async function uncovered(page: Page, name: string) {
  return page.evaluate((label) => {
    const link = [...document.querySelectorAll('a')].find((a) =>
      a.textContent.trim().startsWith(label),
    );
    if (!link) return 'fehlt';
    const box = link.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    if (y < 0 || y > window.innerHeight) return 'außerhalb';
    const hit = document.elementFromPoint(x, y);
    return hit && link.contains(hit) ? 'frei' : 'verdeckt';
  }, name);
}

test('Meine Küche aufgeklappt: Das Menü ist ganz zu sehen, nichts unter der Tab-Leiste (D-377)', async ({
  page,
}) => {
  await setDuoPose(page, 'auf');
  await openPage(page, '/ernaehrung');
  await page.getByRole('button', { name: /Meine Küche/ }).click();
  for (const name of ['Meine Lebensmittel', 'Rezepte', 'Einkaufsliste', 'Vorlagen']) {
    await expect.poll(() => uncovered(page, name), name).toBe('frei');
  }
});

test('Barrierefreiheit mit Daten: Namen enthalten den sichtbaren Text (D-377, WCAG 2.5.3)', async ({
  page,
}) => {
  test.slow();
  // Eine Aufgabe, ein Schnelleintrag, eine Messung.
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill('Lesen');
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(page.getByRole('link', { name: 'Lesen bearbeiten' })).toBeVisible();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Bezeichnung (optional)').fill('Haferflocken');
  await quick.getByLabel('Energie (kcal)').fill('420');
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  await openPage(page, '/fortschritt/gewicht');
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill('80,7');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();

  for (const path of ['/heute', '/heute/aufgaben', '/ernaehrung', '/fortschritt/gewicht']) {
    await openPage(page, path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
      path,
    ).toEqual([]);
  }
  // Die Namen bleiben, die Nebenzeilen beschreiben.
  await openPage(page, '/ernaehrung');
  await expect(
    page.getByRole('button', { name: 'Haferflocken bearbeiten' }),
  ).toHaveAccessibleDescription(/420 kcal/);
  await openPage(page, '/heute/aufgaben');
  await expect(
    page.getByRole('link', { name: 'Lesen – Auswertung öffnen' }),
  ).toHaveAccessibleDescription(/noch nichts zu werten/);
});

test('Tagesaufgabe: Wochentage im Kalender mindestens 11 px (D-377)', async ({ page }) => {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill('Dehnen');
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await page.getByRole('link', { name: 'Dehnen bearbeiten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Dehnen' })).toBeVisible();
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('ul[aria-hidden="true"] > li')]
      .filter((li) => /^(Mo|Di|Mi|Do|Fr|Sa|So)$/.test(li.textContent.trim()))
      .map((li) => parseFloat(getComputedStyle(li).fontSize)),
  );
  expect(sizes.length).toBe(7);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(11);
});

test('Pause: Minus und Plus bleiben auch in schmaler Pause zu sehen (D-377)', async ({ page }) => {
  // 320 pt: Die Pause im Kopf ist so schmal wie zugeklappt vor der Korrektur des Kopfs.
  await page.setViewportSize({ width: 320, height: 640 });
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  const first = page.locator('li[aria-current="step"]');
  await first.getByLabel(/^Gewicht in kg, /).fill('60');
  await first.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('timer').first()).toBeVisible();
  for (const name of ['15 s weniger', '15 s mehr']) {
    const icon = page.getByRole('button', { name }).first().locator('svg');
    const box = await icon.boundingBox();
    // Symbol 16 × 16 px; vorher auf 0 px gestaucht, zu sehen war zweimal „15 s“.
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(15.5);
  }
});

test('Satzzeile: „102,5“ passt ins Feld, zugeklappt und auf iPhones (D-378)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  const current = page.locator('li[aria-current="step"]');
  const weight = current.getByLabel(/^Gewicht in kg, /);
  await weight.fill('102,5');
  await current.getByLabel(/^Wiederholungen, /).fill('12');
  await weight.blur();
  /** Wie viele Pixel der Wert über das Feld hinausragt (0: passt). */
  const overflow = () =>
    weight.evaluate((input: HTMLInputElement) => input.scrollWidth - input.clientWidth);
  // iPhone 15 und Safari am Duo zugeklappt (382 pt), dann die App am Duo zugeklappt
  // (466 pt mit 84 pt Systemrand). Vorher ragte der Wert 10, 14 und 4 px hinaus.
  for (const width of [390, 382]) {
    await page.setViewportSize({ width, height: 740 });
    await expect.poll(overflow, `${String(width)} pt`).toBeLessThanOrEqual(0);
  }
  await setDuoPose(page, 'zu');
  await expect.poll(overflow, 'zugeklappt').toBeLessThanOrEqual(0);
  await expect(weight).toHaveValue('102,5');
});
