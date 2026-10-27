import type { Locator, Page } from '@playwright/test';
import { expect, openPage, pageOverflowX, test } from './fixtures';

/**
 * Aufgaben als bearbeitbar erkennbar (F6 Abschnitt 4, D-335, Vorlage V1): links das Abhakfeld,
 * ein Tipp darauf hakt nur ab; der Rest der Zeile öffnet die Detailansicht; Rhythmus unter dem
 * Namen; erledigt gedämpft statt durchgestrichen. Gleich auf „Heute“ und „Tagesaufgaben“.
 */

/** Montag, 19.10.2026: „Dehnen, 10 Minuten“ an Mo · Mi · Fr, „2 Liter Wasser“ mit Wasserziel. */
async function setUp(page: Page) {
  await page.clock.install({ time: new Date('2026-10-19T09:00:00+02:00') });
  await openPage(page, '/heute/aufgaben');
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  for (const [index, name] of ['Spaziergang', '2 Liter Wasser', 'Dehnen, 10 Minuten'].entries()) {
    await page.getByLabel('Name der Aufgabe').fill(name);
    await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await expect(list.getByRole('link', { name: / bearbeiten$/ })).toHaveCount(index + 1);
    await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  }
  const settings = page.getByRole('region', { name: 'Einstellungen' });
  await list.getByRole('link', { name: '2 Liter Wasser bearbeiten' }).click();
  await settings.getByText('Mit Wasserziel abhaken', { exact: true }).click();
  await settings.getByRole('button', { name: 'Speichern' }).click();
  await expect(settings.getByText('Gespeichert.')).toBeVisible();
  await page.getByRole('link', { name: 'Tagesaufgaben', exact: true }).click();
  await list.getByRole('link', { name: 'Dehnen, 10 Minuten bearbeiten' }).click();
  for (const day of ['Di', 'Do', 'Sa', 'So']) {
    await settings.getByRole('button', { name: `${day} fällig` }).click();
  }
  await settings.getByRole('button', { name: 'Speichern' }).click();
  await expect(settings.getByText('Gespeichert.')).toBeVisible();
}

const decoration = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).textDecorationLine);
const color = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).color);

for (const where of ['/heute', '/heute/aufgaben'] as const) {
  test(`Zeile auf ${where}: Abhakfeld hakt nur ab, die Zeile öffnet die Details, Rhythmus, gedämpft`, async ({
    page,
  }) => {
    test.slow();
    await setUp(page);
    await openPage(page, where);
    const scope =
      where === '/heute'
        ? page.getByRole('region', { name: 'Tagesaufgaben' })
        : page.getByRole('region', { name: 'Meine Aufgaben' });
    const check = scope.getByRole('checkbox', { name: 'Spaziergang abhaken' });
    const row = scope.getByRole('link', { name: 'Spaziergang bearbeiten' });
    // Rhythmus unter dem Namen, für Screenreader als Beschreibung der Zeile.
    await expect(row).toHaveAccessibleDescription('Täglich');
    await expect(
      scope.getByRole('link', { name: '2 Liter Wasser bearbeiten' }),
    ).toHaveAccessibleDescription('Täglich · mit Wasserziel abhaken');
    await expect(
      scope.getByRole('link', { name: 'Dehnen, 10 Minuten bearbeiten' }),
    ).toHaveAccessibleDescription('Mo · Mi · Fr');
    // Chevron rechts in --fg-faint.
    const chevron = row.locator('svg.lucide-chevron-right');
    await expect(chevron).toBeVisible();
    expect(await color(chevron)).toBe(
      await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--fg-faint)';
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      }),
    );
    // Ein Tipp auf das Abhakfeld hakt ab und öffnet nichts.
    const title = row.getByText('Spaziergang', { exact: true });
    const before = await color(title);
    await check.click();
    await expect(check).toBeChecked();
    await expect(page).toHaveURL(new RegExp(`${where}$`));
    expect(await decoration(title), 'nicht durchgestrichen').toBe('none');
    await expect.poll(() => color(title), 'Titel gedämpft').not.toBe(before);
    // Und wieder zurück.
    await check.click();
    await expect(check).not.toBeChecked();
    await expect(page).toHaveURL(new RegExp(`${where}$`));
    // Ein Tipp auf die Zeile öffnet die Detailansicht mit Wochentagen und Einstellungen.
    await row.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Spaziergang' })).toBeVisible();
    const settings = page.getByRole('region', { name: 'Einstellungen' });
    await expect(settings.getByRole('button', { name: / fällig$/ })).toHaveCount(7);
    await expect(settings.getByRole('switch', { name: 'Mit Training abhaken' })).toBeVisible();
    // Zurück führt dorthin, wo die Zeile angetippt wurde.
    await page
      .getByRole('link', { name: where === '/heute' ? 'Heute' : 'Tagesaufgaben', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`${where}$`));
  });

  test(`Zeile auf ${where} mit der Tastatur: Tab zum Abhakfeld, Leertaste; Tab zur Zeile, Enter`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Tastatur am Desktop');
    await setUp(page);
    await openPage(page, where);
    const scope =
      where === '/heute'
        ? page.getByRole('region', { name: 'Tagesaufgaben' })
        : page.getByRole('region', { name: 'Meine Aufgaben' });
    const check = scope.getByRole('checkbox', { name: 'Spaziergang abhaken' });
    await check.focus();
    // Fokus sichtbar am Abhakfeld.
    const mark = check.locator('xpath=following-sibling::span[1]');
    await page.keyboard.press('Space');
    await expect(check).toBeChecked();
    await expect(page).toHaveURL(new RegExp(`${where}$`));
    expect(await mark.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
      'none',
    );
    await page.keyboard.press('Tab');
    await expect(scope.getByRole('link', { name: 'Spaziergang bearbeiten' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Spaziergang' })).toBeVisible();
  });
}

for (const width of [360, 390, 768]) {
  test(`Zeilen ohne Überlauf, Abhakfeld und Chevron auf gleicher Höhe (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.setViewportSize({ width, height: 844 });
    await setUp(page);
    for (const where of ['/heute', '/heute/aufgaben']) {
      await openPage(page, where);
      for (const name of ['Spaziergang', '2 Liter Wasser', 'Dehnen, 10 Minuten']) {
        const check = page.getByRole('checkbox', { name: new RegExp(`^${name} abhaken`) }).first();
        const row = page.getByRole('link', { name: `${name} bearbeiten` }).first();
        const [c, r, chevron] = [
          await check.boundingBox(),
          await row.boundingBox(),
          await row.locator('svg.lucide-chevron-right').boundingBox(),
        ];
        expect(c && r && chevron).toBeTruthy();
        if (!c || !r || !chevron) return;
        expect(c.x + c.width, `${name}: Abhakfeld vor der Zeile`).toBeLessThanOrEqual(r.x + 0.5);
        expect(Math.abs(c.y + c.height / 2 - (r.y + r.height / 2))).toBeLessThanOrEqual(1);
        expect(Math.abs(chevron.y + chevron.height / 2 - (r.y + r.height / 2))).toBeLessThanOrEqual(
          1,
        );
      }
      expect(await pageOverflowX(page), 'waagrechter Überlauf').toBeLessThanOrEqual(0);
    }
  });
}
