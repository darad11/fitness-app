#!/usr/bin/env node
/**
 * Bilder der Muskelkarte (D-401) für den Bericht: Übungsdetails, Reiter „Muskeln“, für
 * Bankdrücken und Kniebeuge mit Langhantel, iPhone-Breite 390 px, doppelte Auflösung.
 *
 * Voraussetzung: `pnpm build` und ein laufendes `pnpm preview` (http://localhost:4173).
 * Aufruf: `node tools/muskelkarte-screens.mjs`. Ergebnis in `docs/screens/uebungen/`.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const OUT = 'docs/screens/uebungen';
const SHOTS = [
  ['Bankdrücken mit Langhantel', 'muskelkarte-bankdruecken.png'],
  ['Kniebeuge mit Langhantel', 'muskelkarte-kniebeuge.png'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
for (const [name, file] of SHOTS) {
  await page.goto(`${BASE}/uebungen`);
  await page
    .getByRole('link', { name: new RegExp(`^${name}`) })
    .first()
    .click();
  await page.getByRole('tab', { name: 'Muskeln' }).click();
  const map = page.getByRole('img', { name: /^Muskelkarte\./ });
  await map.waitFor();
  await page.getByRole('tabpanel').screenshot({ path: `${OUT}/${file}` });
  console.log(`${OUT}/${file}`);
}
await browser.close();
