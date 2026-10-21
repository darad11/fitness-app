#!/usr/bin/env node
/**
 * Screenshots der Marke FORM für `docs/screens/` (Rebranding: F2 Komponenten, E Screens).
 *
 * Voraussetzung: `pnpm build` und ein laufendes `pnpm preview` (http://localhost:4173).
 * Aufruf: `node tools/screenshots.mjs komponenten` bzw. `node tools/screenshots.mjs screens`.
 *
 * Das Skript legt Testdaten nur im frischen Browserprofil von Playwright an (eigene IndexedDB),
 * nie in echten Daten; ins Repository kommen nur die Bilder. Handy 390 × 844 pt, doppelte Dichte,
 * Gerätesprache de-AT, Zeitzone Wien.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const mode = process.argv[2] ?? 'komponenten';
const OUT = mode === 'screens' ? 'docs/screens' : 'docs/screens/komponenten';

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'de-AT',
  timezoneId: 'Europe/Vienna',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);

/** Öffnet eine Seite und wartet, bis Überschrift und Daten da sind (wie e2e/fixtures.ts). */
async function open(path) {
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached' })
    .catch(() => undefined);
  await page.waitForTimeout(300);
}

async function shot(locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await locator.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
  console.log(`${OUT}/${name}.png`);
}

/** Ausschnitt des sichtbaren Bildschirms (z. B. die Tab-Leiste unten). */
async function clip(name, { top, height }) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: top, width: 390, height },
    animations: 'disabled',
  });
  console.log(`${OUT}/${name}.png`);
}

/** Tagesziel für den Kalorien-Ring (Ernährung › Ziel). */
async function setNutritionTarget() {
  await open('/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2200');
  await page.getByLabel('Eiweiß (g)').fill('140');
  await page.getByLabel('Kohlenhydrate (g)').fill('230');
  await page.getByLabel('Fett (g)').fill('75');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await page
    .getByText(/^2\D?200 kcal$/)
    .first()
    .waitFor();
}

async function activateProgram() {
  await open('/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
}

async function components() {
  await setNutritionTarget();
  await activateProgram();

  await open('/heute');
  const main = page.locator('main');
  // Knopf: Bühne „Heute geplant“ mit Primärknopf (Lime) und leisem Knopf.
  await shot(main.locator('section').filter({ hasText: 'Heute geplant' }).first(), 'knopf');
  // Ring und Balken: „Ernährung heute“.
  await shot(main.locator('section').filter({ hasText: 'Ernährung heute' }).first(), 'ring');
  // Chips: Schnellmengen beim Wasser; Balken mit Zielmarke.
  const water = main.getByRole('region', { name: 'Wasser' });
  await water.getByRole('button', { name: /250 ml hinzufügen/ }).click();
  await shot(water, 'chip-und-balken');
  // Toast: letzten Eintrag entfernen, „Rückgängig“.
  await water.getByRole('button', { name: /^Letzten Eintrag entfernen/ }).click();
  const toast = page.getByRole('status').filter({ hasText: 'Rückgängig' });
  await shot(toast, 'toast');
  await toast.getByRole('button', { name: 'Rückgängig' }).click();
  // Karte: Wochenziel mit Sekundärknopf.
  await shot(main.getByRole('region', { name: 'Wochenziel' }), 'karte');

  // Tab-Leiste: ausgeklappt und beim Runterscrollen als Kreis rechts.
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await clip('tab-leiste', { top: 844 - 110, height: 110 });
  await page.evaluate(() => {
    // Eigenes Scrollen wie in e2e/tabbar.spec.ts: Taste, dann Bewegung.
    globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'ArrowDown' }));
    globalThis.scrollBy(0, 400);
  });
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .last()
    .and(page.locator('.minimized'))
    .waitFor();
  await page.waitForTimeout(600);
  await clip('tab-leiste-kreis', { top: 844 - 110, height: 110 });

  // Listenzeilen: Einstiege unter „Training“.
  await open('/training');
  await shot(page.locator('main ul').last(), 'listenzeile');

  // Eingabe: Profil, Feld „Name“ mit Fokus.
  await open('/mehr/profil');
  const name = page.getByLabel('Name', { exact: false }).first();
  await name.fill('Dalia');
  await name.focus();
  await shot(page.locator('main section').first(), 'eingabe');

  // Leerzustand: Fortschritt ohne Daten.
  await open('/fortschritt');
  await shot(page.locator('main > div').last(), 'leerzustand');

  // Sheet: „Meine Küche“ am Handy.
  await open('/ernaehrung');
  await page.getByRole('button', { name: 'Meine Küche' }).click();
  await page.waitForTimeout(400);
  await shot(page.locator('dialog[open]'), 'sheet');
}

await mkdir(OUT, { recursive: true });
try {
  if (mode === 'komponenten') await components();
  else throw new Error(`Unbekannter Modus: ${mode}`);
} finally {
  await browser.close();
}
