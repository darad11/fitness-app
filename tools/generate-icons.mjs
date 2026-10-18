// Erzeugt die App-Icons (PNG) aus einer SVG-Vorlage mit dem Chromium von Playwright.
// Aufruf: pnpm icons  (in der Cloud-Umgebung mit PW_CHROMIUM_PATH=/opt/pw-browsers/chromium)
// Eigenes, schlichtes Motiv (Hantel auf Akzentfläche); Arbeitstitel „Fitness" (D-222).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const ACCENT = '#256abf';
const OUT_DIR = new URL('../public/icons/', import.meta.url);

const GLYPH = `
  <g fill="#ffffff">
    <rect x="9" y="22" width="7" height="20" rx="2"/>
    <rect x="17" y="17" width="7" height="30" rx="2"/>
    <rect x="40" y="17" width="7" height="30" rx="2"/>
    <rect x="48" y="22" width="7" height="20" rx="2"/>
    <rect x="24" y="29" width="16" height="6" rx="1"/>
  </g>`;

/**
 * rounded: abgerundete Ecken mit Transparenz (Zweck „any").
 * Ohne Rundung: volle Fläche für „maskable" (Motiv innerhalb der sicheren Zone von 80 %)
 * und für das Apple-Touch-Icon (iOS rundet selbst und füllt Transparenz schwarz).
 */
function svg({ size, rounded, scale }) {
  const offset = (64 - 64 * scale) / 2;
  const background = rounded
    ? `<rect width="64" height="64" rx="14" fill="${ACCENT}"/>`
    : `<rect width="64" height="64" fill="${ACCENT}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    ${background}
    <g transform="translate(${offset} ${offset}) scale(${scale})">${GLYPH}</g>
  </svg>`;
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  { file: 'maskable-512.png', size: 512, rounded: false, scale: 0.72 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 0.86 },
];

const launchOptions = process.env.PW_CHROMIUM_PATH
  ? { executablePath: process.env.PW_CHROMIUM_PATH }
  : {};

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch(launchOptions);
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const target of TARGETS) {
    await page.setViewportSize({ width: target.size, height: target.size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">${svg(target)}</body></html>`,
    );
    const png = await page.locator('svg').screenshot({ omitBackground: true, type: 'png' });
    await writeFile(new URL(target.file, OUT_DIR), png);
    console.log(`${target.file} (${target.size} × ${target.size})`);
  }
} finally {
  await browser.close();
}
