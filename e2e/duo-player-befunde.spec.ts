import type { CDPSession, Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Befunde A bis D aus dem Gerätetest „Ganzkörper A/B“ am iPhone Duo, aufgeklappt quer (D-495).
 * Die Fenster sind die am Gerät gemessenen (D-393): Die Systemstreifen liegen neben dem Fenster,
 * nicht darin; iOS meldet den Bildschirm hochkant mit 466 × 678.
 *
 * - A: Vollbildansichten stehen in der Mitte des ganzen Bildschirms, wie die Startfläche
 *   (D-393, D-394); Bedienelemente bleiben im Fenster.
 * - B: Die Animation füllt ihren Rahmen, ohne Streifen in einer anderen Farbe.
 * - C: Die Animation bleibt ganz sichtbar; in „Als Nächstes“ ist die Zahl der Sätze ganz zu lesen.
 * - D: Die rechte Spalte passt in die Höhe über der Fußleiste und steht fest; nur die Sätze
 *   scrollen, auch am Seitenende.
 */

interface Pose {
  width: number;
  height: number;
  quer: boolean;
  /** Mitte des ganzen Bildschirms in Koordinaten des Fensters. */
  mitte: { x: number; y: number };
}

/** Am Gerät gemessene Fenster (D-393) und die Mitte des Bildschirms darin. */
const GERAET: Record<'quer' | 'querOben' | 'zu', Pose> = {
  // Aufgeklappt quer: Bildschirm 951 × 669, Streifen rechts 84 pt.
  quer: { width: 867, height: 669, quer: true, mitte: { x: 475.5, y: 334.5 } },
  // Dazu oben 82 pt, sobald die App läuft: Das Fenster beginnt 82 pt unter dem Bildschirmrand.
  querOben: { width: 867, height: 587, quer: true, mitte: { x: 475.5, y: 252.5 } },
  // Zugeklappt hoch: Bildschirm 466 × 678, Streifen rechts 84 pt.
  zu: { width: 382, height: 678, quer: false, mitte: { x: 233, y: 339 } },
};

/** Fenster, Bildschirm und Ausrichtung wie am Gerät (nur Chromium, Chrome-Protokoll). */
async function emulateDevice(page: Page, pose: Pose, cdp?: CDPSession): Promise<CDPSession> {
  const session = cdp ?? (await page.context().newCDPSession(page));
  await session.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, right: 0, bottom: 34, left: 0 },
  });
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: pose.width,
    height: pose.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 466,
    screenHeight: 678,
    screenOrientation: pose.quer
      ? { type: 'landscapePrimary', angle: 90 }
      : { type: 'portraitPrimary', angle: 0 },
  });
  return session;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return {
    left: b.x,
    right: b.x + b.width,
    top: b.y,
    bottom: b.y + b.height,
    width: b.width,
    height: b.height,
  };
}

/** Programm „Ganzkörper A/B“ aktivieren und Tag A starten; mit `rest` läuft danach die Pause. */
async function startTraining(page: Page, rest = false) {
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
  if (!rest) return;
  const first = page.locator('li[aria-current="step"]');
  await first.getByLabel(/^Gewicht in kg, /).fill('60');
  await first.getByLabel(/^Wiederholungen, /).fill('10');
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toBeVisible();
}

/** Mitte eines Elements. */
function center(b: Box) {
  return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
}

test.describe('A: Vollbildansichten in der Mitte des ganzen Bildschirms (D-495)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Bildschirm und Ausrichtung lassen sich nur in Chromium nachstellen (wie D-393, D-394).',
  );

  test('Große Pause: Mitte des Bildschirms, Bedienung im Fenster, zugeklappt in zwei Zeilen', async ({
    page,
  }) => {
    test.slow();
    const cdp = await emulateDevice(page, GERAET.quer);
    await startTraining(page, true);
    for (const name of ['quer', 'querOben', 'zu'] as const) {
      const pose = GERAET[name];
      await emulateDevice(page, pose, cdp);
      await expect.poll(() => page.evaluate(() => window.innerWidth), name).toBe(pose.width);
      await page.getByRole('button', { name: 'Pause groß anzeigen' }).click();
      // Groß gibt es nur noch diese eine Pause (die Karte im Kopf weicht ihr).
      const big = page.getByRole('region', { name: 'Pause' });
      const timer = big.getByRole('timer');
      await expect(timer).toBeVisible();
      // Waagrecht: die Zeit in der Mitte des Bildschirms (vorher in der Mitte des Fensters,
      // 42 pt links davon).
      await expect
        .poll(async () => Math.round(center(await box(timer)).x * 2) / 2, name)
        .toBeCloseTo(pose.mitte.x, 0);
      // Senkrecht: der ganze Inhalt mittig auf dem Bildschirm (mit Streifen oben 41 pt höher).
      const parts = await big.evaluate((section) =>
        [...section.children].map((child) => {
          const r = child.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
      );
      const top = Math.min(...parts.map((p) => p.top));
      const bottom = Math.max(...parts.map((p) => p.bottom));
      expect(Math.abs((top + bottom) / 2 - pose.mitte.y), name).toBeLessThanOrEqual(2);
      // Alle Knöpfe ganz im Fenster, mit Seitenrand; keiner in den Streifen.
      for (const button of await big.getByRole('button').all()) {
        const b = await box(button);
        expect(b.left, name).toBeGreaterThanOrEqual(15.5);
        expect(b.right, name).toBeLessThanOrEqual(pose.width - 15.5);
      }
      // Zugeklappt reicht die Breite nicht für drei Knöpfe nebeneinander: ±15 s nebeneinander,
      // „Überspringen“ darunter, jeder Knopf mindestens 44 pt breit.
      const minus = await box(big.getByRole('button', { name: '15 s weniger' }));
      const skip = await box(big.getByRole('button', { name: 'Pause überspringen' }));
      expect(minus.width, name).toBeGreaterThanOrEqual(44);
      if (name === 'zu') expect(skip.top, name).toBeGreaterThan(minus.bottom);
      await big.getByRole('button', { name: 'Pause klein anzeigen' }).click();
      await expect(page.getByRole('button', { name: 'Pause groß anzeigen' })).toBeVisible();
    }
  });

  test('Übungsinfo und Anmeldung: in der Mitte des Bildschirms, ganz im Fenster', async ({
    page,
  }) => {
    test.slow();
    const pose = GERAET.quer;
    await emulateDevice(page, pose);
    await startTraining(page);
    await page.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).first().click();
    const info = page.getByRole('dialog', { name: 'Beinpresse' });
    await expect(info).toBeVisible();
    await expect
      .poll(async () => Math.round(center(await box(info)).x * 2) / 2)
      .toBeCloseTo(pose.mitte.x, 0);
    expect((await box(info)).right).toBeLessThanOrEqual(pose.width);
    await info.getByRole('button', { name: 'Schließen' }).click();

    // Vollbild-Anmeldung: Logo und Felder in der Mitte des Bildschirms wie die Startfläche.
    await openPage(page, '/mehr/synchronisierung');
    const login = page.getByRole('dialog', { name: 'FORM' });
    await expect(login).toBeVisible();
    const logo = login.getByRole('img', { name: 'FORM' });
    await expect
      .poll(async () => Math.round(center(await box(logo)).x * 2) / 2)
      .toBeCloseTo(pose.mitte.x, 0);
    const email = await box(login.getByLabel('E-Mail'));
    expect(email.right).toBeLessThanOrEqual(pose.width - 15.5);
  });
});

test.describe('B bis D: Player aufgeklappt quer (D-495)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

  /** Rahmen der Animation und das Bild darin: gleiche Lage, Seitenverhältnis der Datei. */
  async function frameFilled(frame: Locator, label: string) {
    // Erst wenn das Video ein Bild hat; vorher wäre der Rahmen leer.
    const video = frame.locator('video');
    if ((await video.count()) > 0) {
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), label)
        .toBeGreaterThanOrEqual(2);
    }
    const outer = await box(frame);
    const media = await box(frame.locator('video, img').first());
    expect(outer.width / outer.height, `${label}: Seitenverhältnis`).toBeCloseTo(720 / 540, 2);
    expect(Math.abs(media.left - outer.left), `${label}: links`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(media.right - outer.right), `${label}: rechts`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(media.top - outer.top), `${label}: oben`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(media.bottom - outer.bottom), `${label}: unten`).toBeLessThanOrEqual(0.5);
    // Am Rand des Rahmens die Farbe des Videos, nicht die Fläche `surface` (#141b25).
    const shot = await frame.screenshot({ animations: 'disabled' });
    const edges = await frame.page().evaluate(async (png) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];
      ctx.drawImage(image, 0, 0);
      const y = Math.round(image.height / 2);
      return [3, image.width - 4].map((x) => {
        const [r = 0, g = 0, b = 0] = ctx.getImageData(x, y, 1, 1).data;
        return { r, g, b };
      });
    }, shot.toString('base64'));
    for (const { r, g, b } of edges) {
      const surface = Math.abs(r - 20) + Math.abs(g - 27) + Math.abs(b - 37);
      expect(
        surface,
        `${label}: Rand in der Farbe der Fläche (${String([r, g, b])})`,
      ).toBeGreaterThan(6);
    }
  }

  test('B: Die Animation füllt ihren Rahmen im Player, in der Übungsinfo und in den Details', async ({
    page,
  }) => {
    test.slow();
    for (const [width, height] of [
      [867, 669],
      [867, 587],
      [951, 669],
      [382, 678],
      [669, 869],
      [390, 844],
    ] as const) {
      const label = `${String(width)} × ${String(height)}`;
      await page.setViewportSize({ width, height });
      await openPage(page, '/uebungen');
      await page
        .getByRole('link', { name: /^Kniebeuge mit Langhantel/ })
        .first()
        .click();
      // Rahmen = Element um das Video (alter und neuer Stand gleich gefunden).
      const details = page.locator('[data-demo="bild"] video').first().locator('xpath=..');
      await expect(details.locator('video')).toBeVisible();
      await frameFilled(details, `Details ${label}`);
    }
    await page.setViewportSize({ width: 867, height: 669 });
    await startTraining(page);
    await frameFilled(page.locator('.player-demo video').locator('xpath=..'), 'Player');
    await page.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).first().click();
    const info = page.getByRole('dialog', { name: 'Beinpresse' });
    await expect(info.locator('[data-demo="bild"] video')).toBeVisible();
    await frameFilled(info.locator('[data-demo="bild"] video').locator('xpath=..'), 'Übungsinfo');
  });

  test('C und D: rechte Spalte fest über der Fußleiste, Animation ganz sichtbar, nur die Sätze scrollen', async ({
    page,
  }) => {
    test.slow();
    for (const height of [669, 587]) {
      await page.setViewportSize({ width: 867, height });
      if (height === 669) await startTraining(page, true);
      const side = page.locator('.player-side');
      const demo = page.locator('.player-demo video');
      const foot = page.locator('.player-foot');
      await expect(demo).toBeVisible();
      // Die Spalte scrollt nicht für sich (vorher `overflow-y: auto`, 853 statt 558 px Inhalt).
      const scrolled = await side.evaluate((element) => {
        element.scrollTop = 120;
        return element.scrollTop;
      });
      expect(scrolled, `Höhe ${String(height)}: Spalte scrollt für sich`).toBe(0);
      // Seite in kleinen Schritten bis zum Ende scrollen: Die Spalte steht still, alles darin ist
      // ganz zu sehen und endet über der Fußleiste.
      const steps = await page.evaluate(async () => {
        const frame = document.getElementById('seite');
        const column = document.querySelector('.player-side');
        if (!frame || !column) return [];
        const parts = ['.player-head', '.player-demo video', '.player-now'];
        const results: { top: number; bottom: number; partsTop: number; partsBottom: number }[] =
          [];
        const end = frame.scrollHeight - frame.clientHeight;
        for (let i = 0; i <= 20; i += 1) {
          frame.scrollTop = (end * i) / 20;
          await new Promise((resolve) =>
            requestAnimationFrame(() => {
              resolve(null);
            }),
          );
          const c = column.getBoundingClientRect();
          const visible = parts
            .map((selector) => column.querySelector(selector)?.getBoundingClientRect())
            .filter((r): r is DOMRect => r !== undefined && r.height > 0);
          results.push({
            top: c.top,
            bottom: c.bottom,
            partsTop: Math.min(...visible.map((r) => r.top)),
            partsBottom: Math.max(...visible.map((r) => r.bottom)),
          });
        }
        return results;
      });
      const footTop = (await box(foot)).top;
      const first = steps[0];
      if (!first) throw new Error('keine Messung');
      for (const [i, step] of steps.entries()) {
        const where = `Höhe ${String(height)}, Schritt ${String(i)}`;
        expect(Math.abs(step.top - first.top), `${where}: Spalte bewegt sich`).toBeLessThanOrEqual(
          1,
        );
        expect(step.partsTop, `${where}: oben aus dem Bild`).toBeGreaterThanOrEqual(-0.5);
        expect(step.partsBottom, `${where}: hinter der Fußleiste`).toBeLessThanOrEqual(
          footTop + 0.5,
        );
        expect(step.bottom, `${where}: Spalte höher als der Platz`).toBeLessThanOrEqual(
          footTop + 0.5,
        );
      }
      await page.evaluate(() => {
        document.getElementById('seite')?.scrollTo(0, 0);
      });
    }
  });

  test('C: „Als Nächstes“ zeigt nur ganze Einträge, die Zahl der Sätze immer ganz', async ({
    page,
  }) => {
    test.slow();
    // Größer (iPad quer) zeigt die Spalte Einträge, niedrig (iPhone quer) scrollt sie für sich.
    for (const [width, height] of [
      [1180, 820],
      [844, 390],
    ] as const) {
      await page.setViewportSize({ width, height });
      if (width === 1180) await startTraining(page);
      const upNext = page.getByRole('region', { name: 'Als Nächstes' });
      const items = upNext.getByRole('listitem');
      await expect(items.first()).toBeVisible();
      const card = await box(upNext);
      for (const item of await items.all()) {
        const row = await box(item);
        const count = item.locator('span').last();
        const c = await box(count);
        const label = `${String(width)} × ${String(height)}: ${(await item.textContent()) ?? ''}`;
        expect(await count.textContent(), label).toMatch(/^\d+ Sätze?$/);
        expect(c.right, `${label}: Zahl ragt aus dem Eintrag`).toBeLessThanOrEqual(row.right + 0.5);
        expect(row.right, `${label}: Eintrag ragt aus der Karte`).toBeLessThanOrEqual(
          card.right - 15.5,
        );
        expect(
          await count.evaluate((el) => el.scrollWidth <= el.clientWidth),
          `${label}: Zahl abgeschnitten`,
        ).toBe(true);
        if (height === 820) {
          expect(row.bottom, `${label}: Eintrag angeschnitten`).toBeLessThanOrEqual(
            card.bottom + 0.5,
          );
        }
      }
    }
  });
});
