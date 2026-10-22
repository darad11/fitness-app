#!/usr/bin/env node
/**
 * Startbilder für die installierte App am iPhone und iPad (Rebranding, Paket D, D-317).
 *
 * iOS zeigt ein `apple-touch-startup-image` nur, wenn die `media`-Abfrage genau zum Gerät passt.
 * Das Markenpaket liefert drei Größen (1170 × 2532, 1290 × 2796, 2048 × 2732); dieses Skript
 * ergänzt die übrigen Größen aktueller Geräte im selben Aufbau wie `public/splash/splash.svg`:
 * Nacht-Fläche, Symbol mittig, 24 % der kurzen Seite breit, Mitte bei 47 % der Höhe. Die drei
 * Bilder aus dem Markenpaket bleiben unverändert. Danach gibt das Skript die `<link>`-Zeilen für
 * `index.html` aus; `src/app/splash.test.ts` prüft Zeilen, Dateien und Pixelmaße.
 *
 * Aufruf: `node tools/splash.mjs` (braucht Chromium von Playwright, in Cloud-Sitzungen über
 * `PW_CHROMIUM_PATH`). Mit `--check` rendert es nur 1170 × 2532 und vergleicht mit dem Bild
 * aus dem Markenpaket.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

/** Bildschirm hochkant in CSS-Pixeln und Pixeldichte; Quelle: Apple, Geräte mit aktuellem iOS. */
const DEVICES = [
  { w: 375, h: 667, dpr: 2, name: 'iPhone SE (2. und 3. Generation)' },
  { w: 375, h: 812, dpr: 3, name: 'iPhone 12 mini, 13 mini, 11 Pro, XS, X' },
  { w: 414, h: 896, dpr: 2, name: 'iPhone 11, XR' },
  { w: 414, h: 896, dpr: 3, name: 'iPhone 11 Pro Max, XS Max' },
  { w: 390, h: 844, dpr: 3, name: 'iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e' },
  { w: 393, h: 852, dpr: 3, name: 'iPhone 14 Pro, 15, 15 Pro, 16' },
  { w: 402, h: 874, dpr: 3, name: 'iPhone 16 Pro, 17, 17 Pro' },
  { w: 420, h: 912, dpr: 3, name: 'iPhone Air' },
  { w: 428, h: 926, dpr: 3, name: 'iPhone 12 Pro Max, 13 Pro Max, 14 Plus' },
  { w: 430, h: 932, dpr: 3, name: 'iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus' },
  { w: 440, h: 956, dpr: 3, name: 'iPhone 16 Pro Max, 17 Pro Max' },
  { w: 744, h: 1133, dpr: 2, name: 'iPad mini (6. und 7. Generation)' },
  { w: 768, h: 1024, dpr: 2, name: 'iPad mini 5, iPad 9,7 Zoll' },
  { w: 810, h: 1080, dpr: 2, name: 'iPad 10,2 Zoll' },
  { w: 820, h: 1180, dpr: 2, name: 'iPad 10,9 und 11 Zoll, iPad Air 11 Zoll' },
  { w: 834, h: 1112, dpr: 2, name: 'iPad Air 10,5 Zoll, iPad Pro 10,5 Zoll' },
  { w: 834, h: 1194, dpr: 2, name: 'iPad Pro 11 Zoll (1. bis 4. Generation)' },
  { w: 834, h: 1210, dpr: 2, name: 'iPad Pro 11 Zoll (M4)' },
  { w: 1024, h: 1366, dpr: 2, name: 'iPad Pro 12,9 Zoll, iPad Air 13 Zoll' },
  { w: 1032, h: 1376, dpr: 2, name: 'iPad Pro 13 Zoll (M4)' },
];

/** Bilder aus dem Markenpaket: werden nicht neu gerendert. */
const FROM_BRAND = new Set(['1170x2532', '1290x2796', '2048x2732']);

const NIGHT = '#0C1219';
const GREEN = '#C7FF46';
/** Ausdehnung des Symbols in seinen eigenen Einheiten (Pfade in `splash.svg`). */
const SYMBOL_WIDTH = 1078.38;
const SYMBOL_HEIGHT = 1000.05;
/** Aus `splash.svg` (1000 × 2160): Breite 240,6 = 24,06 % der Breite, Mitte bei 47,22 % der Höhe. */
const WIDTH_SHARE = 0.2406;
const CENTER_Y = 0.4722;

/** Alle Bilder: hochkant und quer je Gerät, ohne doppelte Pixelmaße. */
function startupImages() {
  const seen = new Set();
  const list = [];
  for (const device of DEVICES) {
    for (const orientation of ['portrait', 'landscape']) {
      const pw = device.w * device.dpr;
      const ph = device.h * device.dpr;
      const [width, height] = orientation === 'portrait' ? [pw, ph] : [ph, pw];
      const key = `${String(device.w)}x${String(device.h)}@${String(device.dpr)}-${orientation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        ...device,
        orientation,
        width,
        height,
        file: `splash-${String(width)}x${String(height)}.png`,
      });
    }
  }
  return list;
}

function mediaQuery({ w, h, dpr, orientation }) {
  return `(device-width: ${String(w)}px) and (device-height: ${String(h)}px) and (-webkit-device-pixel-ratio: ${String(dpr)}) and (orientation: ${orientation})`;
}

async function symbolPaths() {
  const svg = await readFile('public/splash/splash.svg', 'utf8');
  const group = /<g id="symbol"[^>]*>([\s\S]*?)<\/g>/.exec(svg);
  if (!group?.[1]) throw new Error('Symbol in splash.svg nicht gefunden');
  return group[1];
}

function svgFor(width, height, paths) {
  const scale = (WIDTH_SHARE * Math.min(width, height)) / SYMBOL_WIDTH;
  const x = width / 2 - (SYMBOL_WIDTH * scale) / 2;
  const y = CENTER_Y * height - (SYMBOL_HEIGHT * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" width="${String(width)}" height="${String(height)}"><rect width="${String(width)}" height="${String(height)}" fill="${NIGHT}"/><g fill="${GREEN}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">${paths}</g></svg>`;
}

async function render(browser, width, height, paths) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${NIGHT}">${svgFor(width, height, paths)}</body></html>`,
  );
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  await page.close();
  return png;
}

/** Mittlere Abweichung je Farbkanal (0 bis 255) zwischen zwei PNGs gleicher Größe. */
async function difference(browser, a, b) {
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ([first, second]) => {
      const load = async (data) => {
        const image = new globalThis.Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = new globalThis.OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const [pa, pb] = await Promise.all([load(first), load(second)]);
      let sum = 0;
      for (let i = 0; i < pa.length; i += 4) {
        sum +=
          Math.abs(pa[i] - pb[i]) +
          Math.abs(pa[i + 1] - pb[i + 1]) +
          Math.abs(pa[i + 2] - pb[i + 2]);
      }
      return sum / ((pa.length / 4) * 3);
    },
    [a.toString('base64'), b.toString('base64')],
  );
  await page.close();
  return result;
}

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  const paths = await symbolPaths();
  // Abgleich mit dem Markenpaket: dieselbe Regel muss dessen drei Bilder treffen.
  for (const size of FROM_BRAND) {
    const [width, height] = size.split('x').map(Number);
    const ours = await render(browser, width, height, paths);
    const brand = await readFile(`public/splash/splash-${size}.png`);
    const diff = await difference(browser, ours, brand);
    console.log(
      `Abgleich ${size} mit dem Markenpaket: mittlere Abweichung ${diff.toFixed(3)} von 255`,
    );
    if (diff > 1) throw new Error(`Die Regel trifft das Bild ${size} aus dem Markenpaket nicht`);
  }

  if (!process.argv.includes('--check')) {
    for (const image of startupImages()) {
      const size = `${String(image.width)}x${String(image.height)}`;
      const path = `public/splash/${image.file}`;
      if (FROM_BRAND.has(size) && existsSync(path)) continue;
      await writeFile(path, await render(browser, image.width, image.height, paths));
      console.log(path);
    }
    console.log('\nZeilen für index.html:');
    for (const image of startupImages()) {
      console.log(
        `    <link rel="apple-touch-startup-image" media="${mediaQuery(image)}" href="/splash/${image.file}" />`,
      );
    }
  }
} finally {
  await browser.close();
}
