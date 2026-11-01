#!/usr/bin/env node
/**
 * Aufnahme des Scrollens im Player, iPhone Duo aufgeklappt quer (867 × 669, D-495): Training
 * „Ganzkörper A/B“ mit laufender Pause, dann Scroll-Gesten mit Nachlauf (Chrome-Protokoll) und
 * schnelle Mausrad-Folgen bis ans Seitenende und zurück. Protokolliert in jedem Bild die Lage der
 * rechten Spalte und der Animation (`protokoll.json`); die Bilder kommen aus dem Screencast des
 * Chrome-Protokolls (Playwright bräuchte für Videos ein eigenes ffmpeg). Touch-Gesten scrollen im
 * Chromium ohne Fenster nicht, deshalb Mausrad und Gesten der Maus.
 *
 *   node tools/duo-player-aufnahme.mjs <ausgabeordner>
 *   cd <ausgabeordner> && ffmpeg -f concat -safe 0 -i liste.txt -vsync vfr \
 *     -vf "scale=1300:-2,fps=30" -pix_fmt yuv420p -c:v libx264 -crf 24 -movflags +faststart aufnahme.mp4
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const BASIS = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const context = await browser.newContext({
  viewport: { width: 867, height: 669 },
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
  insets: { top: 0, right: 0, bottom: 34, left: 0 },
});
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
const s = page.locator('li[aria-current="step"]');
await s.getByLabel(/^Gewicht in kg, /).fill('60');
await s.getByLabel(/^Wiederholungen, /).fill('10');
await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
await page.getByRole('region', { name: 'Pause' }).waitFor();
await page.evaluate(() => globalThis.document.activeElement?.blur());
await page.waitForTimeout(1000);
// Bilder über den Screencast des Chrome-Protokolls (Playwright braucht für Videos ein eigenes ffmpeg).
const bilder = [];
cdp.on('Page.screencastFrame', async (e) => {
  bilder.push({ data: e.data, t: e.metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => undefined);
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 88,
  maxWidth: 1734,
  maxHeight: 1338,
  everyNthFrame: 1,
});
await page.waitForTimeout(800);
// Protokoll in jedem Bild.
await page.evaluate(() => {
  const log = [];
  globalThis.spaltenLog = log;
  const side = globalThis.document.querySelector('.player-side');
  const video = globalThis.document.querySelector('.player-demo video');
  const seite = globalThis.document.getElementById('seite');
  const step = () => {
    log.push([
      seite.scrollTop,
      side.getBoundingClientRect().top,
      video ? video.getBoundingClientRect().top : null,
    ]);
    globalThis.requestAnimationFrame(step);
  };
  globalThis.requestAnimationFrame(step);
});
const geste = (dy, speed) =>
  cdp.send('Input.synthesizeScrollGesture', {
    x: 250,
    y: 400,
    yDistance: dy,
    speed,
    gestureSourceType: 'mouse',
    preventFling: false,
    repeatCount: 1,
  });
await geste(-700, 1600); // Wischen nach oben: Liste nach unten, mit Schwung
await page.waitForTimeout(1200);
await geste(-900, 2400);
await page.waitForTimeout(1200);
await geste(-1200, 3000); // bis ans Ende
await page.waitForTimeout(1500);
// Rasch hintereinander mit dem Mausrad: wie schnelles Wischen.
await page.mouse.move(250, 400);
for (let i = 0; i < 14; i += 1) {
  await page.mouse.wheel(0, -160);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(1200);
await geste(1500, 3000); // zurück nach oben
await page.waitForTimeout(1500);
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
console.log('Bilder', bilder.length);
const log = await page.evaluate(() => globalThis.spaltenLog);
const seiten = log.map((l) => l[0]);
const spalte = log.map((l) => l[1]);
const video = log.map((l) => l[2]).filter((v) => v !== null);
const ergebnis = {
  bilder: log.length,
  scrollVon: Math.min(...seiten),
  scrollBis: Math.max(...seiten),
  spalteMin: Math.min(...spalte),
  spalteMax: Math.max(...spalte),
  animationMin: Math.min(...video),
  animationMax: Math.max(...video),
};
console.log(JSON.stringify(ergebnis));
writeFileSync(`${OUT}/protokoll.json`, JSON.stringify({ ergebnis, log }, null, 1));
await context.close();
await browser.close();
