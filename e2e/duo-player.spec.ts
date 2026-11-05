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
  const b = await lage(locator);
  if (!b) throw new Error('nicht sichtbar');
  return b;
}

/**
 * Wie `box`, aber für `expect.poll` (D-512): Ohne Fläche, etwa während der Player nach einer neuen
 * Fenstergröße umbaut, gibt es `null`, und die Abfrage wartet weiter. `box` würde werfen, und
 * `expect.poll` bricht bei einem Fehler in der Abfrage sofort ab, statt sie zu wiederholen.
 */
async function lage(locator: Locator): Promise<Box | null> {
  const b = await locator.boundingBox();
  return b
    ? { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height, height: b.height }
    : null;
}

/** Breite für `expect.poll`; ohne Fläche `NaN`, das keinen Vergleich besteht. */
const breite = (b: Box | null) => (b ? b.right - b.left : Number.NaN);

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

test('Player aufgeklappt: zwei Spalten, Kopf links im niedrigen Fenster, sonst rechts mit Pause und „Als Nächstes“ (D-380, D-495, D-502)', async ({
  page,
}) => {
  test.slow();
  await setDuoPose(page, 'auf');
  await startWithRest(page);
  const head = page.locator('main header');
  const list = page.getByRole('region', { name: 'Beinpresse' });
  const upNext = page.getByRole('region', { name: 'Als Nächstes' });
  const rest = page.getByRole('region', { name: 'Pause' });
  const axe = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  };
  /**
   * Im niedrigen Fenster (Duo quer) steht der Kopf mit der Pause links über der Liste, oben im
   * Fenster, mit seiner Fläche bis an den linken Rand (D-502). Die Meldung nennt die Lage der Teile.
   */
  const expectHeadLeft = async () => {
    await expect
      .poll(async () => {
        const [h, l, r] = [await lage(head), await lage(list), await lage(rest)];
        if (!h || !l || !r) {
          return `nicht sichtbar: Kopf ${h ? 'ja' : 'nein'}, Liste ${l ? 'ja' : 'nein'}, Pause ${r ? 'ja' : 'nein'}`;
        }
        const ok =
          h.left <= l.left + 1 &&
          Math.abs(h.right - l.right) <= 1 &&
          h.top >= 0 &&
          h.top <= 40 &&
          r.left >= h.left - 1 &&
          r.right <= h.right + 1 &&
          r.top >= h.top &&
          r.bottom <= h.bottom + 1;
        const where = (b: Box) =>
          [b.left, b.right, b.top, b.bottom].map((v) => String(Math.round(v))).join('/');
        return ok ? 'links' : `Kopf ${where(h)}, Liste ${where(l)}, Pause ${where(r)}`;
      })
      .toBe('links');
    await expect(rest.getByRole('button', { name: 'Pause überspringen' })).toBeVisible();
  };

  // Links die Sätze, darüber der Kopf mit Programm, Fortschritt, „Beenden“ und der Pause in einer
  // Zeile (D-502); rechts die Animation, in der Pause darunter „Als Nächstes“ („Jetzt“ entfällt),
  // nur ganze Einträge (D-495).
  await expect(upNext.getByRole('listitem').first()).toBeVisible();
  await expect(rest).toContainText('Beinpresse, Aufwärmsatz 2');
  await expectHeadLeft();
  await axe();

  // In einem höheren Fenster steht rechts die Steuerung mit Kopf, Pause (±15 s) und allen nächsten
  // Übungen, links nur die Sätze. Mit neuer Breite: Ob das Fenster niedrig ist, misst der Player
  // beim Öffnen und bei neuer Breite, nicht bei der Tastatur (D-498).
  await page.setViewportSize({ width: 1000, height: 1100 });
  await expect(upNext).toBeVisible();
  await expect(upNext.getByRole('listitem')).toHaveCount(4);
  await expect(upNext).toContainText('Bankdrücken mit Kurzhanteln');
  await expect
    .poll(async () => {
      const [h, l] = [await lage(head), await lage(list)];
      return h !== null && l !== null && h.left > l.right;
    })
    .toBe(true);
  expect((await box(rest)).left).toBeGreaterThan((await box(list)).right);
  await expect(rest.getByRole('button', { name: '15 s weniger' })).toBeVisible();
  await axe();
  await setDuoPose(page, 'auf');
  await expectHeadLeft();

  // Nach jedem Satz bleibt der nächste ganz sichtbar, unter dem Kopf und über der Fußleiste. Bis
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
      const top = (await box(head)).bottom;
      shown = row.top >= top - 1 && row.bottom <= footer.top;
      where = `Satz ${String(Math.round(row.top))} bis ${String(Math.round(row.bottom))}, Kopf bis ${String(Math.round(top))}, Fußleiste ab ${String(Math.round(footer.top))}`;
      if (!shown) await page.waitForTimeout(200);
    }
    const history = shown ? '' : await takeScrollLog(page);
    expect(shown, `Satz ${String(i + 2)} sichtbar (${where}; ${history})`).toBe(true);
  }

  // Aufgeklappt den aktuellen Satz knapp unter den Kopf scrollen, dann zuklappen: Der Kopf steht
  // über der ganzen Breite; der Satz rutscht nicht dahinter, sondern bleibt darunter sichtbar.
  const active = page.locator('li[aria-current="step"]');
  const headBottom = (await box(head)).bottom;
  await active.evaluate((row, below) => {
    document.getElementById('seite')?.scrollBy(0, row.getBoundingClientRect().top - below - 16);
  }, headBottom);
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

// Beim Öffnen steht der Kopf von Anfang an links, nichts springt: Vorher kamen Muskel-Etiketten und
// Vorwerte erst nach dem ersten Bild, die erste Karte wuchs um 13 px, und der Player schob die
// Seite samt Kopf um diese Höhe (D-502). Bild für Bild gemessen, 2,5 s ab „Training starten“.
for (const height of [669, 587]) {
  test(`Duo quer ${String(height)} px hoch: Öffnen ohne Sprung, Kopf links von Anfang an (D-502)`, async ({
    page,
  }) => {
    await setDuoPose(page, 'auf');
    await page.setViewportSize({ width: 951, height });
    await openPage(page, '/training/vorlagen/compound_ab_4');
    await page.getByRole('button', { name: 'Programm aktivieren' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }),
    ).toBeVisible();
    await openPage(page, '/heute');
    await page.evaluate(() => {
      const log: string[] = [];
      (window as unknown as { __bilder: string[] }).__bilder = log;
      const start = performance.now();
      const step = () => {
        const head = document.querySelector('main header');
        const card = document.querySelector('.player-main section');
        if (head && card) {
          const h = head.getBoundingClientRect();
          const c = card.getBoundingClientRect();
          const scroll = document.getElementById('seite')?.scrollTop ?? -1;
          const left = head.closest('.player-main') ? 'links' : 'rechts';
          const entry = `${left} Kopf ${String(Math.round(h.top))} Karte ${String(Math.round(c.top))}/${String(Math.round(c.height))} Scroll ${String(Math.round(scroll))}`;
          if (log.at(-1) !== entry) log.push(entry);
        }
        if (performance.now() - start < 2500) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    await page.getByRole('button', { name: 'Training starten' }).click();
    await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
    await page.waitForTimeout(2600);
    const frames = await page.evaluate(
      () => (window as unknown as { __bilder: string[] }).__bilder,
    );
    // Ein einziger Stand vom ersten Bild an: Kopf links, Seite nicht gescrollt.
    expect(frames, frames.join(' | ')).toHaveLength(1);
    expect(frames[0]).toMatch(/^links .* Scroll 0$/);
  });
}

test('Pause zugeklappt in einer Zeile, ±15 s in der großen Pause (D-380)', async ({ page }) => {
  await setDuoPose(page, 'zu');
  await startWithRest(page);
  const rest = page.getByRole('region', { name: 'Pause' });
  // Eine Zeile: Zeit, nächster Satz, „Überspringen“; vorher rund 150 px hoch.
  await expect.poll(async () => (await lage(rest))?.height ?? Number.NaN).toBeLessThanOrEqual(80);
  await expect(rest.getByRole('button', { name: 'Pause überspringen' })).toBeVisible();
  await expect(rest.getByRole('button', { name: '15 s mehr' })).toBeHidden();
  // Der nächste Satz bleibt für Screenreader genannt und steht sichtbar neben der Zeit, in
  // höchstens zwei Zeilen (vorher eine Zeile mit „Beinpress…“).
  await expect(rest).toContainText('Nächster Satz:');
  // `\s`: Zwischen Wort und Zahl steht ein geschütztes Leerzeichen (D-525).
  const nextSet = rest.getByText(/Aufwärmsatz\s2/);
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
  await expect.poll(async () => (await lage(rest))?.height ?? Number.NaN).toBeGreaterThan(100);
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
  await expect.poll(async () => (await lage(rest))?.height ?? Number.NaN).toBeLessThanOrEqual(80);
  await expect.poll(async () => breite(await lage(nextSet))).toBe(1);
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
      const [p, w] = [await lage(previous), await lage(weight)];
      return p !== null && w !== null && p.top < w.bottom && p.bottom > w.top;
    })
    .toBe(true);

  // 360 pt: Vorwert mit Namen unter den Feldern; „102,5“ passt ins Feld.
  await page.setViewportSize({ width: 360, height: 800 });
  await expect
    .poll(async () => {
      const [p, w] = [await lage(previous), await lage(weight)];
      return p !== null && w !== null && p.top >= w.bottom;
    })
    .toBe(true);
  // Der Name „Vorwert:“ steht jetzt sichtbar davor (sonst nur für Screenreader).
  await expect
    .poll(async () => breite(await lage(row.getByText('Vorwert:', { exact: true }))))
    .toBeGreaterThan(20);
  await weight.fill('102,5');
  await weight.blur();
  expect(
    await weight.evaluate((input: HTMLInputElement) => input.scrollWidth - input.clientWidth),
  ).toBeLessThanOrEqual(0);

  // 320 pt: weiter zwei Zeilen, die Felder mindestens 44 px breit (vorher 25 px).
  await page.setViewportSize({ width: 320, height: 640 });
  await expect.poll(async () => breite(await lage(weight))).toBeGreaterThanOrEqual(44);
});
