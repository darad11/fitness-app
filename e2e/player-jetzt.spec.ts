import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Karte „Jetzt“ im Player (D-498): Neben „Danach:“ ein kleines Vorschaubild der nächsten Übung.
 * Schmal (iPhone, Duo zugeklappt) läuft die Schleife der aktuellen Übung klein in der Karte statt
 * des Standbilds; Tippen öffnet die Übungsinfo mit großer Animation und Ausführung. Aufgeklappt
 * steht die große Animation in der rechten Spalte, die kleine ist ausgeblendet und läuft nicht.
 */
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return { left: b.x, top: b.y, width: b.width, height: b.height, bottom: b.y + b.height };
}

/** Zeit der Wiedergabe; -1, solange das Video angehalten ist. */
function playhead(video: Locator): Promise<number> {
  return video.evaluate((v: HTMLVideoElement) => (v.paused ? -1 : v.currentTime));
}

function playingFile(video: Locator): Promise<string> {
  return video.evaluate((v: HTMLVideoElement) =>
    v.currentSrc ? new URL(v.currentSrc).pathname : '',
  );
}

const loop = (stem: string) => new RegExp(`^/uebungen/medien/${stem}-[0-9a-f]{8}\\.(?:mp4|webm)$`);
const preview = (stem: string) =>
  new RegExp(`^/uebungen/medien/${stem}-vorschau-[0-9a-f]{8}\\.webp$`);

/**
 * Wie die installierte App vom Home-Bildschirm, in der am Gerät gemessen wurde (D-393): Mit der
 * Kennung des iPhone im Browser-Tab (WebKit in der CI) zeigt die App sonst über jeder Seite den
 * Hinweis zur Installation (AK-PWA-04), am Duo zugeklappt rutschte der Satz damit unter die
 * Fußleiste (Nachtrag zu D-498).
 */
function installed() {
  Object.defineProperty(Navigator.prototype, 'standalone', {
    configurable: true,
    get: () => true,
  });
}

async function startDayA(page: Page, width: number, height: number) {
  await page.addInitScript(installed);
  await page.setViewportSize({ width, height });
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ })).toBeVisible();
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

/** Lage der Teile des Players von oben nach unten, für die Meldung bei einem Fehlschlag. */
function layoutReport(page: Page): Promise<string> {
  return page.evaluate(() => {
    const span = (el: Element | null | undefined) => {
      if (!el) return 'fehlt';
      const r = el.getBoundingClientRect();
      return `${r.top.toFixed(0)} bis ${r.bottom.toFixed(0)}`;
    };
    const q = (selector: string) => document.querySelector(selector);
    const current = q('li[aria-current="step"]');
    return [
      `Fenster ${String(window.innerWidth)} × ${String(window.innerHeight)}`,
      `niedrig ${String(q('.player-frame')?.hasAttribute('data-niedrig'))}`,
      `Scroll ${String(document.getElementById('seite')?.scrollTop)}`,
      `Kopf ${span(q('.player-head'))}`,
      `Jetzt ${span(q('.player-now'))}`,
      `Name ${span(q('.player-now-name'))}`,
      `Angaben ${span(q('.player-now-info'))}`,
      `Danach ${span(q('.player-next-line'))}`,
      `Schleife ${span(q('[data-demo-compact]'))}`,
      `Übung ${span(current?.closest('section'))}`,
      `Satz ${span(current)}`,
      `Fuß ${span(q('.player-foot'))}`,
    ].join('; ');
  });
}

/** Bild neben „Danach:“: Vorschau der nächsten Übung, stumm; 32 px, im niedrigen Fenster 24 px. */
async function expectNextThumb(now: Locator, stem: string, name: string, size = 32) {
  const line = now.locator('p', { hasText: `Danach: ${name}` });
  const img = line.locator('img');
  await expect(img).toHaveAttribute('src', preview(stem));
  await expect(img).toHaveAttribute('alt', '');
  const thumb = await box(img);
  expect(Math.round(thumb.width)).toBe(size);
  expect(Math.round(thumb.height)).toBe(size);
}

// Unter 45 rem Fensterhöhe (Duo zugeklappt) ist „Jetzt“ kompakter: Schleife 6 statt 7 rem,
// Vorschaubild 24 statt 32 px; der erste Satz bleibt so auch in WebKit über der Fußleiste.
for (const [label, width, height, frameWidth, thumb] of [
  ['iPhone', 390, 844, 112, 32],
  ['Duo zugeklappt', 382, 678, 96, 24],
] as const) {
  test(`${label}: die Schleife läuft klein in „Jetzt“, Tippen öffnet die Übungsinfo`, async ({
    page,
  }) => {
    await startDayA(page, width, height);
    const now = page.getByRole('region', { name: 'Jetzt' });
    const frame = now.locator('[data-demo-compact]');
    const video = frame.locator('video');
    await expect.poll(() => playingFile(video)).toMatch(loop('beinpresse'));
    await expect.poll(() => playhead(video), { timeout: 10_000 }).toBeGreaterThan(0.2);
    // Größer als das Vorschaubild vorher (56 × 56), im Seitenverhältnis des Videos.
    const size = await box(frame);
    expect(size.width).toBe(frameWidth);
    expect(size.height).toBe((frameWidth * 3) / 4);
    // Der aktuelle Satz bleibt über der Fußleiste; die Meldung nennt die Lage der Teile (WebKit
    // läuft nur in der CI).
    const footTop = (await box(page.locator('.player-foot'))).top;
    const setBottom = (await box(page.locator('li[aria-current="step"]'))).bottom;
    expect(setBottom, await layoutReport(page)).toBeLessThan(footTop);
    await expectNextThumb(now, 'bankdruecken_kh', 'Bankdrücken mit Kurzhanteln', thumb);

    await now.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).click();
    const dialog = page.getByRole('dialog', { name: 'Beinpresse' });
    await expect(dialog.locator('[data-demo-frame] video')).toBeVisible();
    await expect.poll(() => playhead(dialog.locator('video'))).toBeGreaterThan(0);
    await expect(dialog.getByRole('heading', { name: 'Ausführung' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Schließen' }).click();
  });
}

test('iPhone: nach dem Wechsel die Schleife und das Vorschaubild der neuen Übung', async ({
  page,
}) => {
  await startDayA(page, 390, 844);
  const now = page.getByRole('region', { name: 'Jetzt' });
  const card = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name: 'Beinpresse', exact: true }),
  });
  const row = card.locator('li[data-set-id]').last();
  await row.getByLabel(/^Gewicht in kg, /).fill('100');
  await row.getByLabel(/^Wiederholungen, /).fill('10');
  await row.getByRole('button', { name: /^Satz erledigt, / }).click();
  await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
  const video = now.locator('[data-demo-compact] video');
  await expect.poll(() => playingFile(video)).toMatch(loop('bankdruecken_kh'));
  // Der Player scrollt zum nächsten Satz; liegt die Karte dabei außerhalb des Bilds, steht die
  // Schleife (nur sichtbar, D-497). Wieder im Bild läuft sie.
  const inView = await now.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  });
  if (!inView) {
    await page.waitForTimeout(300);
    expect(await playhead(video), 'außerhalb des Bilds angehalten').toBe(-1);
  }
  await page.evaluate(() => {
    document.getElementById('seite')?.scrollTo(0, 0);
  });
  await expect.poll(() => playhead(video), { timeout: 10_000 }).toBeGreaterThan(0.2);
  await expectNextThumb(now, 'rudern_kabel', 'Rudern am Kabel, sitzend');
  // Weggescrollt hält sie an.
  await page.evaluate(() => {
    const seite = document.getElementById('seite');
    seite?.scrollTo(0, seite.scrollHeight);
  });
  await expect.poll(() => playhead(video)).toBe(-1);
});

test('Duo aufgeklappt: die kleine Schleife ist aus und läuft nicht, die große läuft', async ({
  page,
}) => {
  await startDayA(page, 867, 669);
  const now = page.getByRole('region', { name: 'Jetzt' });
  await expect(now.locator('[data-demo-compact]')).toBeHidden();
  const big = page.getByRole('region', { name: 'Ausführung der aktuellen Übung' }).locator('video');
  await expect.poll(() => playhead(big), { timeout: 10_000 }).toBeGreaterThan(0.2);
  await page.waitForTimeout(500);
  expect(await playhead(now.locator('[data-demo-compact] video'))).toBe(-1);
  // Niedriges Fenster (unter 45 rem): auch in zwei Spalten 24 px, damit „Jetzt“ flach bleibt
  // und die Animation darüber mehr Platz hat (D-500).
  await expectNextThumb(now, 'bankdruecken_kh', 'Bankdrücken mit Kurzhanteln', 24);
});
