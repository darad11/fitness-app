#!/usr/bin/env node
/**
 * Kompaktes Kopfzeilen-Logo (F5, D-325): grüne Kachel mit dem F in Nacht, rechts daneben die
 * Wortmarke. Zusammengesetzt aus den vorhandenen Pfaden, keine neue Zeichnung: das F aus
 * `public/brand/symbol-f-gruen.svg`, die Gruppe `wortmarke` aus `logo-kopfzeile-dunkel.svg`.
 *
 * Maße in Einheiten einer Kachel von 1400 (Auftrag F5 Abschnitt 4.1): Kachel 1400 × 1400 mit
 * Radius 22,5 % (315), Fläche `--accent`; das F 0,64-fach (Höhe 45,7 % der Kachel), um 1,2 % der
 * Kachelbreite nach rechts und 1,9 % nach unten aus der Mitte versetzt, in `--accent-fg`; die
 * Wortmarke 0,625-fach (Versalhöhe 625), 500 rechts der Kachel, Oberkante bei 387,5, in `--fg`.
 * In der Kopfzeile ist die Kachel 28 pt hoch: Versalhöhe 12,5 pt, Abstand 10 pt.
 *
 * Ganze Pixel (F6, D-332): Die Dateien tragen ihre Anzeigegröße (Kachel 28 × 28, Logo 106 × 28);
 * die Breite des Logos ist auf den nächsten ganzen Pixel aufgerundet, rechts bleibt ein halber
 * Pixel frei. So gibt es keine Skalierung mit Bruchteilen von Pixeln (vorher 105,46 px breit).
 *
 * Schreibt `public/brand/logo-kopfzeile-kompakt.svg` (Gruppen `kachel`, `symbol`, `wortmarke`)
 * und `public/brand/kachel-kompakt.svg` (nur Kachel und F, für die eingeklappte Seitenleiste).
 * Aufruf: `node tools/brand-compact.mjs` (braucht Chromium von Playwright für die Maße der Pfade).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const TILE = 1400;
const RADIUS = 0.225 * TILE;
const ACCENT = '#C7FF46';
const ACCENT_FG = '#0C1219';
const FG = '#F2F3F4';
const F_SCALE = 0.64;
const F_SHIFT_X = 0.012 * TILE;
const F_SHIFT_Y = 0.019 * TILE;
const WORD_SCALE = 0.625;
const WORD_GAP = 500;
const WORD_TOP = 387.5;
/** Anzeigegröße der Kachel in der Kopfzeile (`--spacing-logo`, 28 px). */
const TILE_PX = 28;
const UNITS_PER_PX = TILE / TILE_PX;

function group(svg, id) {
  const match = new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`).exec(svg);
  if (!match?.[1]) throw new Error(`Gruppe ${id} nicht gefunden`);
  return match[1].trim();
}

/** Ausmaße einer Gruppe von Pfaden, gemessen im Browser (getBBox). */
async function bbox(page, paths) {
  return page.evaluate((inner) => {
    const doc = globalThis.document;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = doc.createElementNS(ns, 'svg');
    const g = doc.createElementNS(ns, 'g');
    g.innerHTML = inner;
    svg.append(g);
    doc.body.append(svg);
    const box = g.getBBox();
    svg.remove();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }, paths);
}

const n = (value) => Number(value.toFixed(3));

const symbolSvg = await readFile('public/brand/symbol-f-gruen.svg', 'utf8');
const headerSvg = await readFile('public/brand/logo-kopfzeile-dunkel.svg', 'utf8');
const symbol = group(symbolSvg, 'symbol');
const wordmark = group(headerSvg, 'wortmarke');

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  const f = await bbox(page, symbol);
  const word = await bbox(page, wordmark);

  // F: Mitte der Kachel plus Versatz.
  const fx = TILE / 2 + F_SHIFT_X - (f.x + f.width / 2) * F_SCALE;
  const fy = TILE / 2 + F_SHIFT_Y - (f.y + f.height / 2) * F_SCALE;
  // Wortmarke: linke Kante 500 rechts der Kachel, Oberkante bei 387,5.
  const wx = TILE + WORD_GAP - word.x * WORD_SCALE;
  const wy = WORD_TOP - word.y * WORD_SCALE;
  const drawn = TILE + WORD_GAP + word.width * WORD_SCALE;
  // Auf ganze Pixel der Anzeigegröße aufrunden.
  const widthPx = Math.ceil(drawn / UNITS_PER_PX - 1e-6);
  const width = widthPx * UNITS_PER_PX;

  const tile = `<g id="kachel"><rect width="${String(TILE)}" height="${String(TILE)}" rx="${String(RADIUS)}" fill="${ACCENT}"/></g>`;
  const f0 = `<g id="symbol" fill="${ACCENT_FG}" transform="translate(${String(n(fx))} ${String(n(fy))}) scale(${String(F_SCALE)})">\n${symbol}\n</g>`;
  const w0 = `<g id="wortmarke" fill="${FG}" transform="translate(${String(n(wx))} ${String(n(wy))}) scale(${String(WORD_SCALE)})">\n${wordmark}\n</g>`;
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(n(width))} ${String(TILE)}" width="${String(widthPx)}" height="${String(TILE_PX)}">\n${tile}\n${f0}\n${w0}\n</svg>\n`;
  const kachel = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(TILE)} ${String(TILE)}" width="${String(TILE_PX)}" height="${String(TILE_PX)}">\n${tile}\n${f0}\n</svg>\n`;
  await writeFile('public/brand/logo-kopfzeile-kompakt.svg', logo);
  await writeFile('public/brand/kachel-kompakt.svg', kachel);
  console.log(
    `F ${String(n(f.width))} × ${String(n(f.height))}, Wortmarke ${String(n(word.width))} × ${String(n(word.height))}; Logo ${String(n(drawn))} × ${String(TILE)}, Datei ${String(widthPx)} × ${String(TILE_PX)} px`,
  );
} finally {
  await browser.close();
}
