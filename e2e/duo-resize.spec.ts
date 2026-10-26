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
  // Erst messen, wenn die Seite steht: Nach „Satz erledigt“ scrollt der Player sanft zum nächsten
  // Satz (D-323), das kann in WebKit noch laufen (Nachtrag zu D-384).
  const frameTop = () => page.evaluate(() => document.getElementById('seite')?.scrollTop ?? 0);
  await expect
    .poll(async () => {
      const start = await frameTop();
      await page.waitForTimeout(100);
      return (await frameTop()) - start;
    }, 'Seite steht')
    .toBe(0);
  const rowTop = await topOf(current);
  let rest = await restSeconds(page);
  // Verlauf je Größenwechsel für die Meldung: Scrollposition, Lage des Satzes und Höhe des Kopfs
  // beim Ereignis `resize`, bei jedem Scrollen und in den 20 Bildern danach.
  await page.evaluate(() => {
    const w = window as unknown as { verlauf: string[] };
    w.verlauf = [];
    const start = performance.now();
    const sample = (why: string) => {
      const frame = document.getElementById('seite');
      const row = document.querySelector('li[aria-current="step"]')?.getBoundingClientRect();
      const head = document.querySelector('main header')?.getBoundingClientRect();
      const at = Math.round(performance.now() - start);
      w.verlauf.push(
        `${why} ${String(at)}: s${String(frame?.scrollTop)} r${String(Math.round(row?.top ?? -1))} k${String(Math.round(head?.height ?? -1))}`,
      );
    };
    // Wer scrollt den Rahmen? Aufrufe von `scrollTo` und `scrollBy` mit der Stelle im Code.
    const proto = Element.prototype as unknown as Record<
      'scrollTo' | 'scrollBy',
      (...args: unknown[]) => void
    >;
    for (const name of ['scrollTo', 'scrollBy'] as const) {
      const original = proto[name];
      proto[name] = function (this: Element, ...args: unknown[]) {
        if (this.id === 'seite') {
          const stack = (new Error().stack ?? '')
            .split('\n')
            .filter((line) => !line.startsWith('Error'));
          const where = stack
            .slice(1, 3)
            .map((line) => line.trim().slice(0, 40))
            .join(' < ');
          w.verlauf.push(`${name} ${JSON.stringify(args[0])} ${where}`);
        }
        Reflect.apply(original, this, args);
      };
    }
    // Nach dem Ausgleich des Players für die neue Höhe des Kopfs (sein Beobachter kam zuerst).
    const head = document.querySelector('main header');
    if (head) {
      new ResizeObserver(() => {
        sample('kopf');
      }).observe(head);
    }
    window.addEventListener('resize', () => {
      sample('resize');
      let count = 0;
      const tick = () => {
        sample('bild');
        count += 1;
        if (count < 20) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    document.getElementById('seite')?.addEventListener(
      'scroll',
      () => {
        sample('scroll');
      },
      { passive: true },
    );
  });
  const history = () =>
    page.evaluate(() => {
      const w = window as unknown as { verlauf: string[] };
      const entries = w.verlauf.splice(0);
      return entries.join(' | ');
    });

  // Erst in einer Spalte (Zwischenmaß, zugeklappt), dann aufgeklappt in zwei Spalten und zurück.
  let twoColumnsSeen = false;
  for (const pose of ['hoch', 'zu', 'auf', 'zu'] as const satisfies readonly DuoPose[]) {
    await history();
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
      // In einer Spalte steht der Satz an derselben Stelle. In der Meldung der Verlauf seit dem
      // Größenwechsel, falls nicht (WebKit war 52 und 53 px daneben, Nachtrag zu D-384).
      const offset = Math.abs((await topOf(current)) - rowTop);
      const anchoring = await page.evaluate(() => CSS.supports('overflow-anchor', 'none'));
      const where =
        offset > 4 ? `overflow-anchor ${anchoring ? 'ja' : 'nein'}; ${await history()}` : '';
      expect(
        offset,
        `${pose}: Position (Satz vorher bei ${String(rowTop)}; ${where})`,
      ).toBeLessThanOrEqual(4);
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

test('Training: Scrollt die Seite kurz nach dem Größenwechsel noch, steht der Satz wieder an seiner Stelle (Nachtrag zu D-384)', async ({
  page,
}) => {
  await setDuoPose(page, 'zu');
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
  await expect(page.getByRole('timer').first()).toBeVisible();
  const current = page.locator('li[aria-current="step"]');
  // Warten, bis der Player den nächsten Satz fertig gezeigt hat.
  await page.waitForTimeout(800);
  const rowTop = await topOf(current);

  // Wie ein Browser, der die neue Anordnung erst später fertig hat: 150 ms nach dem Größenwechsel
  // scrollt die Seite noch um 60 px. Der Player hält den Satz an seiner Stelle.
  await page.evaluate(() => {
    window.addEventListener(
      'resize',
      () => {
        setTimeout(() => {
          document.getElementById('seite')?.scrollBy({ top: 60, behavior: 'instant' });
        }, 150);
      },
      { once: true },
    );
  });
  await setDuoPose(page, 'hoch');
  await page.waitForTimeout(700);
  expect(Math.abs((await topOf(current)) - rowTop), 'Satz an seiner Stelle').toBeLessThanOrEqual(4);
});
