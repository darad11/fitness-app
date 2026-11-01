#!/usr/bin/env node
/**
 * Bilder zu D-497 bis D-500 in den Größen von iPhone und iPhone Duo: Player nach dem Start
 * („Jetzt“ mit laufender Schleife und Vorschaubild der nächsten Übung), Übungsinfo nach zwei
 * Durchläufen mit dem Symbol zum Wiederholen, Übungsdetails (aufgeklappt Animation und
 * Muskelkarte nebeneinander). Fenster wie am Gerät gemessen (D-393), Bildschirm und Ausrichtung
 * über das Chrome-Protokoll, Bilder ebenfalls darüber (`page.screenshot` setzt den nachgestellten
 * Bildschirm zurück). Zu jedem Bild die Maße der Rahmen (`bericht.json`).
 *
 * Voraussetzung: `pnpm build` und `pnpm preview` (http://localhost:4173, sonst SCREENS_BASE_URL).
 *
 *   node tools/player-wiedergabe-bilder.mjs <ausgabeordner>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const BASIS = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';

const HALTUNGEN = {
  iphone: {
    width: 390,
    height: 844,
    screen: [390, 844],
    quer: false,
    insets: { top: 47, bottom: 34 },
  },
  'duo-zu': { width: 382, height: 678, screen: [466, 678], quer: false, insets: { bottom: 34 } },
  'duo-quer': { width: 867, height: 669, screen: [466, 678], quer: true, insets: { bottom: 34 } },
  // Mit dem Streifen oben, der kommt, sobald die App läuft (D-393): das Fenster im Training.
  'duo-quer-streifen': {
    width: 867,
    height: 587,
    screen: [466, 678],
    quer: true,
    insets: { bottom: 34 },
    nurPlayer: true,
  },
  'duo-hoch': { width: 669, height: 869, screen: [466, 678], quer: false, insets: { bottom: 34 } },
};

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const bericht = {};

for (const [name, h] of Object.entries(HALTUNGEN)) {
  const context = await browser.newContext({
    viewport: { width: h.width, height: h.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    baseURL: BASIS,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, right: 0, bottom: 0, left: 0, ...h.insets },
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: h.width,
    height: h.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: h.screen[0],
    screenHeight: h.screen[1],
    screenOrientation: h.quer
      ? { type: 'landscapePrimary', angle: 90 }
      : { type: 'portraitPrimary', angle: 0 },
  });
  const masse = () =>
    page.evaluate(() =>
      [...globalThis.document.querySelectorAll('[data-demo-frame], [data-muscle-map-beside]')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          const video = el.querySelector('video');
          return {
            was: el.hasAttribute('data-muscle-map-beside')
              ? 'Muskelkarte'
              : el.hasAttribute('data-demo-compact')
                ? 'Schleife klein'
                : 'Schleife',
            box: [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10),
            laeuft: video ? !video.paused : null,
          };
        })
        .filter((m) => m.box[2] > 0),
    );
  const schritte = [];
  const bild = async (schritt) => {
    await page.waitForTimeout(400);
    const cap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const datei = `${name}-${schritt}.png`;
    writeFileSync(`${OUT}/${datei}`, Buffer.from(cap.data, 'base64'));
    schritte.push({ schritt, datei, masse: await masse() });
    console.log(name, schritt);
  };
  const open = async (p) => {
    await page.goto(p);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
  };
  await open('/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
  await open('/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
  await page.waitForTimeout(2000);
  await bild('player');
  if (h.nurPlayer) {
    bericht[name] = schritte;
    await context.close();
    continue;
  }
  // Übungsinfo: zwei Durchläufe, dann angehalten mit dem Symbol.
  await page.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Beinpresse' });
  await dialog.locator('[data-angehalten]').waitFor({ timeout: 15_000 });
  await bild('uebungsinfo-angehalten');
  await dialog.getByRole('button', { name: 'Schließen' }).click();
  // Übungsdetails Latziehen.
  await open('/uebungen');
  await page
    .getByRole('link', { name: /^Latziehen/ })
    .first()
    .click();
  await page.locator('[data-demo-frame]').first().waitFor();
  await page.waitForTimeout(1500);
  await bild('details');
  bericht[name] = schritte;
  await context.close();
}
writeFileSync(`${OUT}/bericht.json`, JSON.stringify(bericht, null, 2));
await browser.close();
