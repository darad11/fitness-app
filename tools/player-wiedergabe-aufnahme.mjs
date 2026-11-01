#!/usr/bin/env node
/**
 * Aufnahme des Players (D-497, D-498, D-500): Start von „Ganzkörper A/B“, die Schleife der ersten
 * Übung läuft gleich, neben „Danach:“ das Vorschaubild der nächsten Übung; Tippen öffnet die
 * Übungsinfo, die große Schleife läuft zweimal und hält an, das Symbol erscheint, Tippen spielt
 * sie wieder ab; dann Wechsel zur nächsten Übung, deren Schleife gleich läuft (am Duo zweimal, der
 * Rahmen bleibt gleich groß). Haltung `iphone` (390 × 844, die kleine Schleife in „Jetzt“) oder
 * `duo-quer-streifen` (867 × 587, Duo aufgeklappt quer mit dem Streifen oben, D-393).
 * Protokolliert, ob und wie lange die Videos liefen, und den Rahmen der Animation
 * (`protokoll.json`); die Bilder kommen aus dem Screencast des Chrome-Protokolls (Playwright
 * bräuchte für Videos ein eigenes ffmpeg).
 *
 *   HALTUNG=iphone node tools/player-wiedergabe-aufnahme.mjs <ausgabeordner>
 *   cd <ausgabeordner> && ffmpeg -f concat -safe 0 -i liste.txt -vsync vfr \
 *     -vf "scale=780:-2,fps=30" -pix_fmt yuv420p -c:v libx264 -crf 24 -movflags +faststart aufnahme.mp4
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const BASIS = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const HALTUNGEN = {
  iphone: { width: 390, height: 844, insets: { top: 47, bottom: 34 }, wechsel: 1 },
  'duo-quer-streifen': {
    width: 867,
    height: 587,
    insets: { bottom: 34 },
    screen: [466, 678],
    wechsel: 2,
  },
};
const h = HALTUNGEN[process.env.HALTUNG ?? 'iphone'];
if (!h) throw new Error(`Haltung unbekannt: ${String(process.env.HALTUNG)}`);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
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
if (h.screen) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: h.width,
    height: h.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: h.screen[0],
    screenHeight: h.screen[1],
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
}
const open = async (p) => {
  await page.goto(p);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
};
await open('/training/vorlagen/compound_ab_4');
await page.getByRole('button', { name: 'Programm aktivieren' }).click();
await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
await open('/heute');
await page.waitForTimeout(800);

const bilder = [];
cdp.on('Page.screencastFrame', async (e) => {
  bilder.push({ data: e.data, t: e.metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => undefined);
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 88,
  maxWidth: h.width * 2,
  maxHeight: h.height * 2,
  everyNthFrame: 1,
});
const protokoll = [];
/** Zeit und Zustand aller sichtbaren Videos. */
const notiere = async (schritt) => {
  const videos = await page.evaluate(() =>
    [...globalThis.document.querySelectorAll('video')]
      .filter((v) => v.getBoundingClientRect().width > 0)
      .map((v) => ({
        datei: (v.currentSrc || '').split('/').pop(),
        laeuft: !v.paused,
        zeit: Math.round(v.currentTime * 100) / 100,
        ende: v.ended,
        rahmen: (() => {
          const r = v.getBoundingClientRect();
          return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
        })(),
      })),
  );
  protokoll.push({ schritt, videos });
  console.log(schritt, JSON.stringify(videos));
};
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Training starten' }).click();
await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
await page.waitForTimeout(2500);
await notiere('nach dem Start');
// Schmal die kleine Schleife in „Jetzt“, aufgeklappt die große rechts.
await page
  .getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' })
  .locator('visible=true')
  .first()
  .click();
const dialog = page.getByRole('dialog', { name: 'Beinpresse' });
await dialog.waitFor();
await page.waitForTimeout(1500);
await notiere('Übungsinfo, erster Durchlauf');
await dialog.locator('[data-angehalten]').waitFor({ timeout: 15_000 });
await page.waitForTimeout(1500);
await notiere('Übungsinfo nach zwei Durchläufen');
await dialog.getByRole('button', { name: 'Animation wiederholen' }).click();
await page.waitForTimeout(2000);
await notiere('Übungsinfo nach dem Tippen');
await dialog.getByRole('button', { name: 'Schließen' }).click();
await page.waitForTimeout(800);
// Letzten Satz der aktuellen Übung erledigen: Wechsel zur nächsten Übung.
for (let i = 0; i < h.wechsel; i += 1) {
  const name = (
    await page.getByRole('region', { name: 'Jetzt' }).locator('.player-now-name').textContent()
  )?.trim();
  const karte = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name, exact: true }),
  });
  const satz = karte.locator('li[data-set-id]').last();
  await satz.scrollIntoViewIfNeeded();
  for (const feld of await satz.locator('input').all()) {
    const label = (await feld.getAttribute('aria-label')) ?? '';
    await feld.fill(label.startsWith('Gewicht') ? '40' : label.startsWith('Wieder') ? '10' : '30');
  }
  await page.evaluate(() => globalThis.document.activeElement?.blur());
  await satz.getByRole('button', { name: /^Satz erledigt, / }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
  await page.evaluate(() => globalThis.document.getElementById('seite')?.scrollTo({ top: 0 }));
  await page.waitForTimeout(3000);
  await notiere(`nach dem Wechsel ${String(i + 1)}`);
}
await cdp.send('Page.stopScreencast');

mkdirSync(`${OUT}/bilder`, { recursive: true });
const zeilen = [];
bilder.forEach((b, i) => {
  const name = `b${String(i).padStart(4, '0')}.jpg`;
  writeFileSync(`${OUT}/bilder/${name}`, Buffer.from(b.data, 'base64'));
  const dauer = i + 1 < bilder.length ? bilder[i + 1].t - b.t : 0.5;
  zeilen.push(`file 'bilder/${name}'`, `duration ${Math.max(0.001, dauer).toFixed(4)}`);
});
zeilen.push(`file 'bilder/b${String(bilder.length - 1).padStart(4, '0')}.jpg'`);
writeFileSync(`${OUT}/liste.txt`, zeilen.join('\n') + '\n');
writeFileSync(`${OUT}/protokoll.json`, JSON.stringify(protokoll, null, 1));
console.log('Bilder', bilder.length);
await context.close();
await browser.close();
