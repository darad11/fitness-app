import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Workout-Player beim iPhone Duo (D-380): aufgeklappt zwei Spalten, zugeklappt die Pause in einer
// Zeile, auf sehr schmalen Bildschirmen der Vorwert in einer zweiten Zeile. Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
}

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height, height: b.height };
}

/** Programm aktivieren, Training starten, ersten Satz mit Werten erledigen: Die Pause läuft. */
async function startWithRest(page: Page) {
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
  const first = page.locator('li[aria-current="step"]');
  await first.getByLabel(/^Gewicht in kg, /).fill('60');
  await first.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toBeVisible();
}

test('Player aufgeklappt: zwei Spalten, rechts Kopf, Pause und „Als Nächstes“ (D-380)', async ({
  page,
}) => {
  test.slow();
  await setDuoPose(page, 'auf');
  await startWithRest(page);
  const head = page.locator('main header');
  const list = page.getByRole('region', { name: 'Beinpresse' });
  const upNext = page.getByRole('region', { name: 'Als Nächstes' });
  const rest = page.getByRole('region', { name: 'Pause' });

  // Rechts die Steuerung mit Pause und den nächsten Übungen, links die Sätze.
  await expect(upNext).toBeVisible();
  await expect(upNext.getByRole('listitem')).toHaveCount(4);
  await expect(upNext).toContainText('Bankdrücken mit Kurzhanteln');
  expect((await box(head)).left).toBeGreaterThan((await box(list)).right);
  expect((await box(rest)).left).toBeGreaterThan((await box(list)).right);
  await expect(rest.getByRole('button', { name: '15 s weniger' })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  // Nach jedem Satz bleibt der nächste ganz sichtbar; der Kopf steht daneben, nicht darüber.
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Pause überspringen' }).click();
    const current = page.locator('li[aria-current="step"]');
    await current.getByLabel(/^Gewicht in kg, /).fill('80');
    await current.getByLabel(/^Wiederholungen, /).fill('8');
    await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
    const footer = await box(page.getByRole('button', { name: 'Satz erledigt', exact: true }));
    await expect
      .poll(
        async () => {
          const row = await box(page.locator('li[aria-current="step"]'));
          return row.top >= 0 && row.bottom <= footer.top;
        },
        `Satz ${String(i + 2)} sichtbar`,
      )
      .toBe(true);
  }

  // Aufgeklappt den aktuellen Satz nach oben scrollen, dann zuklappen: Der Kopf steht wieder über
  // der Liste; der Satz rutscht nicht dahinter, sondern bleibt darunter sichtbar.
  const active = page.locator('li[aria-current="step"]');
  await active.evaluate((row) => {
    window.scrollBy(0, row.getBoundingClientRect().top - 40);
  });
  await page.waitForTimeout(700);
  await setDuoPose(page, 'zu');
  await expect
    .poll(async () => (await box(active)).top >= (await box(head)).bottom - 1, 'unter dem Kopf')
    .toBe(true);

  // Zugeklappt und im Zwischenmaß eine Spalte: Kopf über der Liste, „Als Nächstes“ entfällt.
  for (const pose of ['zu', 'hoch'] as const) {
    await setDuoPose(page, pose);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(upNext, pose).toBeHidden();
    await expect
      .poll(async () => (await box(head)).bottom <= (await box(list)).top, pose)
      .toBe(true);
  }
});

test('Pause zugeklappt in einer Zeile, ±15 s in der großen Pause (D-380)', async ({ page }) => {
  await setDuoPose(page, 'zu');
  await startWithRest(page);
  const rest = page.getByRole('region', { name: 'Pause' });
  // Eine Zeile: Zeit, nächster Satz, „Überspringen“; vorher rund 150 px hoch.
  await expect.poll(async () => (await box(rest)).height).toBeLessThanOrEqual(80);
  await expect(rest.getByRole('button', { name: 'Pause überspringen' })).toBeVisible();
  await expect(rest.getByRole('button', { name: '15 s mehr' })).toBeHidden();
  // Der nächste Satz bleibt für Screenreader genannt und steht sichtbar neben der Zeit, in
  // höchstens zwei Zeilen (vorher eine Zeile mit „Beinpress…“).
  await expect(rest).toContainText('Nächster Satz:');
  const nextSet = rest.getByText(/Aufwärmsatz 2/);
  const nextBox = await box(nextSet);
  expect(nextBox.right - nextBox.left).toBeGreaterThan(60);
  expect(nextBox.height).toBeGreaterThan(30);
  expect(nextBox.height).toBeLessThanOrEqual(44);

  await rest.getByRole('button', { name: 'Pause groß anzeigen' }).click();
  const large = page.getByRole('region', { name: 'Pause' });
  await expect(large.getByRole('button', { name: '15 s mehr' })).toBeVisible();
  await large.getByRole('button', { name: 'Pause klein anzeigen' }).click();

  // Hohes Fenster (Zwischenmaß): die Karte wie bisher mit ±15 s.
  await setDuoPose(page, 'hoch');
  await expect(rest.getByRole('button', { name: '15 s mehr' })).toBeVisible();
  await expect.poll(async () => (await box(rest)).height).toBeGreaterThan(100);

  // iPhone SE (320 × 568): eine Zeile ohne Wortrest; der nächste Satz nur für Screenreader.
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(async () => (await box(rest)).height).toBeLessThanOrEqual(80);
  await expect.poll(async () => (await box(nextSet)).right - (await box(nextSet)).left).toBe(1);
  await expect(rest).toContainText('Nächster Satz:');
});

test('Satzzeile unter 20 rem: Vorwert in einer zweiten Zeile, Felder breit genug (D-380)', async ({
  page,
}) => {
  test.slow();
  // Ein Satz Beinpresse mit 102,5 × 10, dann ein neues Training mit derselben Übung: Vorwert.
  for (const round of [1, 2]) {
    await openPage(page, '/training');
    await page.getByRole('button', { name: 'Freies Training starten' }).click();
    await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
    const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
    await picker.getByLabel('Übungen suchen').fill('beinpresse');
    await picker.getByRole('button', { name: /^Beinpresse Oberschenkel/ }).click();
    await expect(picker).toBeHidden();
    if (round === 2) break;
    const set = 'Beinpresse, Arbeitssatz 1';
    await page.getByLabel(`Gewicht in kg, ${set}`).fill('102,5');
    await page.getByLabel(`Wiederholungen, ${set}`).fill('10');
    await page.getByRole('button', { name: `Satz erledigt, ${set}` }).click();
    await page.getByRole('button', { name: 'Beenden', exact: true }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
    ).toBeVisible();
  }
  const row = page.locator('li[data-set-id]').first();
  const weight = row.getByLabel(/^Gewicht in kg, /);
  const previous = row.getByText('102,5 × 10');

  // 390 pt: Vorwert in derselben Zeile wie die Felder.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect
    .poll(async () => {
      const [p, w] = [await box(previous), await box(weight)];
      return p.top < w.bottom && p.bottom > w.top;
    })
    .toBe(true);

  // 360 pt: Vorwert mit Namen unter den Feldern; „102,5“ passt ins Feld.
  await page.setViewportSize({ width: 360, height: 800 });
  await expect.poll(async () => (await box(previous)).top >= (await box(weight)).bottom).toBe(true);
  // Der Name „Vorwert:“ steht jetzt sichtbar davor (sonst nur für Screenreader).
  await expect
    .poll(
      async () =>
        (await box(row.getByText('Vorwert:', { exact: true }))).right -
        (await box(row.getByText('Vorwert:', { exact: true }))).left,
    )
    .toBeGreaterThan(20);
  await weight.fill('102,5');
  await weight.blur();
  expect(
    await weight.evaluate((input: HTMLInputElement) => input.scrollWidth - input.clientWidth),
  ).toBeLessThanOrEqual(0);

  // 320 pt: weiter zwei Zeilen, die Felder mindestens 44 px breit (vorher 25 px).
  await page.setViewportSize({ width: 320, height: 640 });
  await expect
    .poll(async () => (await box(weight)).right - (await box(weight)).left)
    .toBeGreaterThanOrEqual(44);
});
