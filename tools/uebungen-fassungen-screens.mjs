#!/usr/bin/env node
/**
 * App-Ansichten der Fassungen zum Vergleich (Korrekturrunde D-420, Abschnitt 9): je Fassung der
 * kleine Player am iPhone, der aufgeklappte Player (Duo auf), die Übungsübersicht und die
 * Übungsdetails, mit den Standbildern der Fassung statt der produktiven Medien.
 *
 * Voraussetzung: `pnpm build`, ein laufendes `pnpm preview` (http://localhost:4173) und je Fassung
 * ein Ordner `<FASSUNGEN_MEDIEN>/<Fassung>/` mit `kniebeuge-poster.webp`, `kniebeuge-vorschau.webp`,
 * `bankdruecken-poster.webp`, `bankdruecken-vorschau.webp`, `latziehen-vorschau.webp`. Die Dateien
 * werden nur in `dist/uebungen/medien/` getauscht (Ausgabe des Builds, nicht im Repository) und am
 * Ende zurückgesetzt; die Seiten laufen mit „Bewegung reduzieren“, dann zeigt der Player das
 * Standbild (D-403). Aufruf:
 *
 *   FASSUNGEN_MEDIEN=/tmp/app-medien FASSUNGEN_AUS=/tmp/app-screens \
 *     node tools/uebungen-fassungen-screens.mjs D-A1 D-A2 D-B Cm-A1 ...
 *
 * Ergebnis: `<FASSUNGEN_AUS>/<Fassung>-{player-iphone,player-auf,liste,details}.png`.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const MEDIEN = process.env.FASSUNGEN_MEDIEN ?? '/tmp/app-medien';
const OUT = process.env.FASSUNGEN_AUS ?? '/tmp/app-screens';
const DIST = 'dist/uebungen/medien';
const POSES = {
  iphone: { width: 390, height: 844, insets: { top: 47, right: 0, bottom: 34, left: 0 } },
  auf: { width: 951, height: 669, insets: { top: 0, right: 84, bottom: 20, left: 0 } },
};
const DATEIEN = [
  'kniebeuge-poster.webp',
  'kniebeuge-vorschau.webp',
  'bankdruecken-poster.webp',
  'bankdruecken-vorschau.webp',
  'latziehen-vorschau.webp',
];
const fassungen = process.argv.slice(2);
if (fassungen.length === 0) {
  console.error('Fassungen angeben, z. B. D-A1 D-A2 D-B');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
const sicherung = `${OUT}/_original`;
await mkdir(sicherung, { recursive: true });
for (const datei of DATEIEN) await copyFile(`${DIST}/${datei}`, `${sicherung}/${datei}`);

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);

async function newPage() {
  const context = await browser.newContext({
    viewport: { width: POSES.iphone.width, height: POSES.iphone.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.cdp = await context.newCDPSession(page);
  return page;
}

async function setPose(page, pose) {
  const p = POSES[pose];
  await page.setViewportSize({ width: p.width, height: p.height });
  await page.cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: p.insets });
  await page.waitForTimeout(400);
}

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.waitForTimeout(600);
}

async function shot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  console.log(path);
}

async function startWith(page, search, name) {
  await open(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await page.getByRole('heading', { level: 1, name: 'Freies Training' }).waitFor();
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill(search);
  await picker
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click();
  await picker.waitFor({ state: 'hidden' });
  await page.waitForTimeout(800);
}

try {
  for (const fassung of fassungen) {
    const vorhanden = await readdir(`${MEDIEN}/${fassung}`);
    for (const datei of DATEIEN) {
      if (!vorhanden.includes(datei)) throw new Error(`${fassung}: ${datei} fehlt`);
      await copyFile(`${MEDIEN}/${fassung}/${datei}`, `${DIST}/${datei}`);
    }
    const page = await newPage();
    await startWith(page, 'kniebeuge mit lang', 'Kniebeuge mit Langhantel');
    await shot(page, `${fassung}-player-iphone`);
    await setPose(page, 'auf');
    await page.waitForTimeout(800);
    await shot(page, `${fassung}-player-auf`);
    await page.context().close();
    // Übersicht und Details in einem neuen Kontext, ohne das laufende Training (keine Hinweisleiste).
    // Die Suche „Langhantel“ zeigt die Pilot-Übungen mit Vorschaubild neben Übungen mit Symbol.
    const seite = await newPage();
    await open(seite, '/uebungen');
    await seite.getByLabel('Übungen suchen').fill('Langhantel');
    await seite.waitForTimeout(800);
    await shot(seite, `${fassung}-liste`);
    await seite
      .getByRole('link', { name: /^Kniebeuge mit Langhantel/ })
      .first()
      .click();
    await seite.getByRole('heading', { level: 1, name: 'Kniebeuge mit Langhantel' }).waitFor();
    await seite.waitForTimeout(1000);
    await shot(seite, `${fassung}-details`);
    await seite.context().close();
  }
} finally {
  for (const datei of DATEIEN) await copyFile(`${sicherung}/${datei}`, `${DIST}/${datei}`);
  await browser.close();
  console.log('dist/uebungen/medien zurückgesetzt');
}
