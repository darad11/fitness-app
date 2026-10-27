import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';
import { startScrollLog, takeScrollLog } from './scroll-log';

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

  // Nach jedem Satz bleibt der nächste ganz sichtbar; der Kopf steht daneben, nicht darüber. Bis
  // zu 5 s warten; scheitert es, nennt die Meldung Lage und Verlauf (Nachtrag zu D-384).
  await startScrollLog(page);
  for (let i = 0; i < 3; i += 1) {
    await takeScrollLog(page);
    await page.getByRole('button', { name: 'Pause überspringen' }).click();
    const current = page.locator('li[aria-current="step"]');
    await current.getByLabel(/^Gewicht in kg, /).fill('80');
    await current.getByLabel(/^Wiederholungen, /).fill('8');
    await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
    const footer = await box(page.getByRole('button', { name: 'Satz erledigt', exact: true }));
    let shown = false;
    let where = '';
    for (let attempt = 0; attempt < 25 && !shown; attempt += 1) {
      const row = await box(page.locator('li[aria-current="step"]'));
      shown = row.top >= 0 && row.bottom <= footer.top;
      where = `Satz ${String(Math.round(row.top))} bis ${String(Math.round(row.bottom))}, Fußleiste ab ${String(Math.round(footer.top))}`;
      if (!shown) await page.waitForTimeout(200);
    }
    const history = shown ? '' : await takeScrollLog(page);
    expect(shown, `Satz ${String(i + 2)} sichtbar (${where}; ${history})`).toBe(true);
  }

  // Aufgeklappt den aktuellen Satz nach oben scrollen, dann zuklappen: Der Kopf steht wieder über
  // der Liste; der Satz rutscht nicht dahinter, sondern bleibt darunter sichtbar.
  const active = page.locator('li[aria-current="step"]');
  await active.evaluate((row) => {
    document.getElementById('seite')?.scrollBy(0, row.getBoundingClientRect().top - 40);
  });
  await page.waitForTimeout(700);
  await takeScrollLog(page);
  await setDuoPose(page, 'zu');
  // Bis zu 5 s warten; die Meldung nennt den Verlauf: Scrollposition, Satz und Unterkante des
  // Kopfs (WebKit war einmal dahinter, Nachtrag zu D-384).
  const states: string[] = [];
  let below = false;
  for (let attempt = 0; attempt < 25 && !below; attempt += 1) {
    const [row, top] = [await box(active), await box(head)];
    const scroll = await page.evaluate(() => document.getElementById('seite')?.scrollTop ?? -1);
    states.push(
      `s${String(scroll)} r${String(Math.round(row.top))} k${String(Math.round(top.bottom))}`,
    );
    below = row.top >= top.bottom - 1;
    if (!below) await page.waitForTimeout(200);
  }
  const history = below ? '' : await takeScrollLog(page);
  expect(below, `unter dem Kopf (${states.join(' | ')}; ${history})`).toBe(true);

  // Zugeklappt und im Zwischenmaß eine Spalte: Der Kopf steht über der Liste, so breit wie die
  // Seite, nicht daneben; „Als Nächstes“ entfällt. Unabhängig davon, wohin die Seite gescrollt ist.
  for (const pose of ['zu', 'hoch'] as const) {
    await setDuoPose(page, pose);
    await expect(upNext, pose).toBeHidden();
    await expect
      .poll(async () => {
        const [h, l] = [await box(head), await box(list)];
        return h.left <= l.left + 1 && h.right >= l.right - 1;
      }, pose)
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

  // Hohes Fenster (Zwischenmaß): die Karte wie bisher mit ±15 s. Der Kopf wird dabei 72 px höher;
  // der aktuelle Satz bleibt schon im ersten Bild nach dem Wechsel an seiner Stelle, nicht erst
  // beim nächsten Takt der Pause; läge er dort hinter dem höheren Kopf, steht er schon in diesem
  // Bild 12 px darunter. Das ist hier der Fall, seit das Antippen eines Feldes den Satz unter den
  // Kopf holt (D-391). Gemessen wird in diesem Bild, nach dem Ausgleich der App.
  const current = page.locator('li[aria-current="step"]');
  const before = (await box(current)).top;
  await page.evaluate(() => {
    window.addEventListener(
      'resize',
      () => {
        requestAnimationFrame(() => {
          const row = document.querySelector('li[aria-current="step"]');
          const head = document.querySelector('main header');
          document.documentElement.dataset.headBottom = String(
            head?.getBoundingClientRect().bottom,
          );
          document.documentElement.dataset.rowTop = String(row?.getBoundingClientRect().top);
        });
      },
      { once: true },
    );
  });
  await setDuoPose(page, 'hoch');
  await expect.poll(() => page.locator('html').getAttribute('data-row-top')).not.toBeNull();
  const firstFrame = Number(await page.locator('html').getAttribute('data-row-top'));
  const headBottom = Number(await page.locator('html').getAttribute('data-head-bottom'));
  const expected = Math.max(before, headBottom + 12);
  expect(
    Math.abs(firstFrame - expected),
    `erstes Bild nach dem Wechsel (vorher ${String(before)}, Kopf bis ${String(headBottom)})`,
  ).toBeLessThanOrEqual(4);
  await expect(rest.getByRole('button', { name: '15 s mehr' })).toBeVisible();
  await expect.poll(async () => (await box(rest)).height).toBeGreaterThan(100);
  // ±15 s wirken in der Karte wie bisher.
  const timer = rest.getByRole('timer');
  const seconds = async () => {
    const [m, sec] = ((await timer.textContent()) ?? '0:00').split(':').map(Number);
    return (m ?? 0) * 60 + (sec ?? 0);
  };
  const start = await seconds();
  await rest.getByRole('button', { name: '15 s mehr' }).click();
  await expect.poll(seconds).toBeGreaterThanOrEqual(start + 14);

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
