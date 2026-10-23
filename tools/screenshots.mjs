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

  await markings();
}

/**
 * Erledigt-Markierungen nebeneinander (F6 Abschnitt 3, D-334): „Verlauf“ und „Je Aufgabe“ auf
 * „Tagesaufgaben“ und der Kalender der Auswertung, nach drei Tagen mit zwei Aufgaben. Eigener
 * Kontext mit fester Uhr; die drei Ausschnitte stehen mit Titel auf einem Bild.
 */
async function markings() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const tab = await ctx.newPage();
  await tab.clock.install({ time: new Date('2026-10-20T09:00:00+02:00') });
  const go = async (path) => {
    await tab.goto(`${BASE}${path}`);
    await tab.getByRole('heading', { level: 1 }).first().waitFor();
    await tab.waitForTimeout(300);
  };
  await go('/heute/aufgaben');
  for (const name of ['Lesen', 'Dehnen']) {
    await tab.getByLabel('Name der Aufgabe').fill(name);
    await tab.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await tab.waitForTimeout(200);
  }
  for (const [day, names] of [
    ['2026-10-20', ['Lesen']],
    ['2026-10-21', ['Lesen', 'Dehnen']],
    ['2026-10-22', ['Lesen', 'Dehnen']],
  ]) {
    await tab.clock.setSystemTime(new Date(`${day}T09:00:00+02:00`));
    await go('/heute');
    const card = tab.getByRole('region', { name: 'Tagesaufgaben' });
    for (const name of names) {
      await card.getByText(name, { exact: true }).click();
      await tab.waitForTimeout(150);
    }
  }
  await go('/heute/aufgaben');
  // Zeiger weg vom Diagramm, sonst zeigt der Verlauf einen Hinweis zum Balken darunter.
  await tab.mouse.move(0, 0);
  const parts = [];
  for (const [name, title] of [
    ['Verlauf', 'Verlauf · 14 px'],
    ['Je Aufgabe', 'Je Aufgabe · 16 px'],
  ]) {
    const region = tab.getByRole('region', { name });
    await region.scrollIntoViewIfNeeded();
    parts.push([title, await region.screenshot({ animations: 'disabled' })]);
  }
  // Dehnen: am 20. nicht erledigt, so zeigt der Kalender alle drei Arten (Zahl, Haken, heute).
  await tab.getByRole('link', { name: 'Dehnen: Auswertung öffnen' }).click();
  await tab.getByRole('heading', { level: 1, name: 'Dehnen' }).waitFor();
  const calendar = tab.getByRole('region', { name: 'Kalender' });
  await calendar.scrollIntoViewIfNeeded();
  parts.push(['Kalender · 16 px', await calendar.screenshot({ animations: 'disabled' })]);
  // Nebeneinander auf einem Bild, oben bündig, in der Größe der Aufnahme (doppelte Dichte).
  const board = await ctx.newPage();
  await board.setViewportSize({ width: 1200, height: 600 });
  const figures = parts
    .map(
      ([title, png]) =>
        `<figure><figcaption>${title}</figcaption><img src="data:image/png;base64,${png.toString('base64')}" width="350"></figure>`,
    )
    .join('');
  await board.setContent(
    `<!doctype html><html><body style="margin:0;background:#0c1219;font:600 15px system-ui;color:#aab2be"><main style="display:flex;gap:20px;align-items:flex-start;padding:20px">${figures}</main></body></html>`,
  );
  await board.addStyleTag({ content: 'figure{margin:0}figcaption{margin:0 0 8px 4px}' });
  await board.locator('main').screenshot({ path: `${OUT}/markierungen.png` });
  console.log(`${OUT}/markierungen.png`);
  await ctx.close();
}

/** Bildschirm wie am Handy (390 × 844 pt). */
async function screen(name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
  console.log(`${OUT}/${name}.png`);
}

/** Ganze Seite ohne die schwebende Tab-Leiste (sie hat eigene Bilder). */
async function fullPage(name) {
  const style = await page.addStyleTag({ content: '.tabbar { visibility: hidden !important; }' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, animations: 'disabled' });
  await style.evaluate((node) => node.remove());
  console.log(`${OUT}/${name}.png`);
}

/** Uhrzeit festhalten, damit Gruß, Datum und Dauer in den Bildern stimmen. */
async function at(iso) {
  await page.clock.setFixedTime(new Date(iso));
}

async function quickEntry(slot, name, kcal, protein, carbs, fat) {
  await open(`/ernaehrung/hinzufuegen?mahlzeit=${slot}`);
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Bezeichnung (optional)').fill(name);
  await quick.getByLabel('Energie (kcal)').fill(String(kcal));
  await quick.getByLabel('Eiweiß (g, optional)').fill(String(protein));
  await quick.getByLabel('Kohlenhydrate (g, optional)').fill(String(carbs));
  await quick.getByLabel('Fett (g, optional)').fill(String(fat));
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByRole('heading', { level: 1, name: 'Ernährung' }).waitFor();
}

/** Satz im Player: Gewicht eintragen (Wiederholungen kommen aus dem Ziel) und erledigen. */
async function completeCurrentSet(weight, reps) {
  const current = page.locator('li[aria-current="step"]');
  const field = current.getByLabel(/^Gewicht in kg, /);
  if ((await field.count()) > 0) await field.fill(String(weight));
  const repsField = current.getByLabel(/^Wiederholungen, /);
  if ((await repsField.count()) > 0) await repsField.fill(String(reps));
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await page.waitForTimeout(400);
}

async function screens() {
  await at('2026-10-22T08:15:00+02:00');
  // Fortschritt ohne Daten: Leerzustand.
  await open('/fortschritt');
  await screen('fortschritt');
  await open('/mehr');
  await screen('mehr');
  // Anmeldung (C): Logo, Claim und Unterzeile; „Über die App“ mit dem Logo ohne Claim.
  await open('/mehr/synchronisierung');
  const login = page.getByRole('dialog', { name: 'FORM' });
  await login.waitFor();
  await page.waitForTimeout(400);
  await screen('anmeldung');
  await login.getByRole('button', { name: 'Später' }).click();
  await open('/mehr/ueber');
  await screen('ueber-die-app');

  await setNutritionTarget();
  await activateProgram();
  await quickEntry('breakfast', 'Haferflocken mit Banane', 420, 14, 68, 9);
  await quickEntry('lunch', 'Linsensuppe', 380, 21, 52, 8);
  await open('/heute');
  const water = page.getByRole('region', { name: 'Wasser' });
  await water.getByRole('button', { name: /250 ml hinzufügen/ }).click();
  await water.getByRole('button', { name: /500 ml hinzufügen/ }).click();
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await screen('heute');
  await fullPage('heute-ganz');
  await screen('tab-leiste-ausgeklappt');
  await page.evaluate(() => {
    globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'ArrowDown' }));
    globalThis.scrollBy(0, 500);
  });
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .last()
    .and(page.locator('.minimized'))
    .waitFor();
  await page.waitForTimeout(600);
  await screen('tab-leiste-kreis');

  await open('/training');
  await screen('training');
  await open('/training/programme');
  await screen('training-programme');

  await open('/ernaehrung');
  await screen('ernaehrung');

  // Aktives Workout: Training von „Heute“ starten, drei Sätze erfassen; die Pause läuft.
  await open('/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
  await completeCurrentSet(60, 10);
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await completeCurrentSet(80, 5);
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await completeCurrentSet(100, 10);
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await at('2026-10-22T08:31:24+02:00');
  await completeCurrentSet(100, 9);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await screen('aktives-workout');

  // Abschluss nach 48 Minuten.
  await at('2026-10-22T09:03:00+02:00');
  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Training beenden?' })
    .getByRole('button', { name: 'Training beenden' })
    .click();
  await page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }).waitFor();
  await screen('abschluss');

  // Übungsdetails mit eigener Notiz als Tipp-Karte.
  await open('/uebungen');
  await page.getByLabel('Übungen suchen').fill('Bankdrücken mit Langhantel');
  await page
    .getByRole('link', { name: /^Bankdrücken mit Langhantel/ })
    .first()
    .click();
  await page.getByRole('heading', { level: 1, name: 'Bankdrücken mit Langhantel' }).waitFor();
  await page
    .getByLabel('Notiz (z. B. Sitzhöhe, Griff)')
    .fill('Schulterblätter zusammen, Füße fest am Boden.');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await page.getByText('Gespeichert').first().waitFor();
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await screen('uebungsdetails');

  // Fortschritt mit Daten (nach dem Training).
  await open('/fortschritt');
  await screen('fortschritt-mit-daten');

  // Rückkehr-Flow (G): 19 Tage nach dem letzten Eintrag; danach „Ein leichtes Training“.
  await at('2026-11-10T08:15:00+01:00');
  await open('/heute');
  const back = page.getByRole('dialog', { name: 'Schön, dass du da bist.' });
  await back.waitFor();
  await page.waitForTimeout(400);
  await screen('rueckkehr-flow');
  await back.getByRole('button', { name: 'Ein leichtes Training' }).click();
  await page.getByRole('note').waitFor();
  await screen('rueckkehr-leichtes-training');
}

await mkdir(OUT, { recursive: true });
try {
  if (mode === 'komponenten') await components();
  else if (mode === 'screens') await screens();
  else throw new Error(`Unbekannter Modus: ${mode}`);
} finally {
  await browser.close();
}
