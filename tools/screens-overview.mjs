#!/usr/bin/env node
/**
 * Übersicht und Archiv der Screenshots für die Übergabe (Rebranding, D-321).
 *
 * Baut aus den Bildern in `docs/screens/` und `docs/screens/komponenten/` zuerst das
 * Übersichtsbild `docs/screens/uebersicht.png` (alle Bilder verkleinert, mit Titel und
 * Dateiname) und danach das Archiv `docs/screens.zip` mit allen Bildern in voller Auflösung,
 * die Übersicht eingeschlossen. Neue Bilder kommen ohne Änderung am Skript mit; ohne Eintrag in
 * `SCREENS` oder `PARTS` steht der Dateiname als Titel. Das Archiv hat eine feste Reihenfolge
 * und als Zeitstempel das Datum des Stands, damit gleiche Bilder am selben Tag dasselbe Archiv
 * ergeben.
 *
 * Voraussetzung: die Bilder aus `node tools/screenshots.mjs komponenten` und `screens`; ein
 * laufender Server ist nicht nötig. Aufruf: `node tools/screens-overview.mjs` (braucht Chromium
 * von Playwright, in Cloud-Sitzungen über `PW_CHROMIUM_PATH`).
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const DIR = 'docs/screens';
const OVERVIEW = 'uebersicht.png';
const ARCHIVE = 'docs/screens.zip';

/** Screens in der Reihenfolge der App, Titel wie in `brand-tokens.md` Abschnitt 6. */
const SCREENS = [
  ['heute-ganz.png', 'Heute, ganze Seite'],
  ['heute.png', 'Heute'],
  ['tab-leiste-ausgeklappt.png', 'Tab-Leiste ausgeklappt'],
  ['tab-leiste-kreis.png', 'Tab-Leiste als Kreis'],
  ['training.png', 'Training'],
  ['training-programme.png', 'Training, Programme'],
  ['aktives-workout.png', 'Aktives Workout'],
  ['abschluss.png', 'Abschluss'],
  ['uebungsdetails.png', 'Übungsdetails'],
  ['ernaehrung.png', 'Ernährung'],
  ['fortschritt.png', 'Fortschritt, leer'],
  ['fortschritt-mit-daten.png', 'Fortschritt mit Daten'],
  ['mehr.png', 'Mehr'],
  ['anmeldung.png', 'Anmeldung'],
  ['ueber-die-app.png', 'Über die App'],
  ['rueckkehr-flow.png', 'Rückkehr-Flow'],
  ['rueckkehr-leichtes-training.png', 'Rückkehr, leichtes Training'],
];

const PARTS = [
  ['komponenten/knopf.png', 'Knopf'],
  ['komponenten/karte.png', 'Karte'],
  ['komponenten/chip-und-balken.png', 'Chip und Balken'],
  ['komponenten/ring.png', 'Ring'],
  ['komponenten/listenzeile.png', 'Listenzeile'],
  ['komponenten/eingabe.png', 'Eingabe'],
  ['komponenten/leerzustand.png', 'Leerzustand'],
  ['komponenten/toast.png', 'Toast'],
  ['komponenten/sheet.png', 'Sheet'],
  ['komponenten/tab-leiste.png', 'Tab-Leiste ausgeklappt'],
  ['komponenten/tab-leiste-kreis.png', 'Tab-Leiste als Kreis'],
];

/** Datum des Stands in Wien, z. B. 22.10.2026. */
const STAND = new Intl.DateTimeFormat('de-AT', {
  timeZone: 'Europe/Vienna',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date());

const escape = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Bekannte Bilder in fester Reihenfolge, danach unbekannte mit dem Dateinamen als Titel. */
function ordered(files, known) {
  const titles = new Map(known);
  const first = known.map(([path]) => path).filter((path) => files.includes(path));
  const rest = files.filter((path) => !titles.has(path)).sort();
  return [...first, ...rest].map((path) => ({ path, title: titles.get(path) ?? path }));
}

/** Erstes Bild je Inhalt: gleiche Bilder (z. B. „Heute“ mit ausgeklappter Tab-Leiste) markieren. */
const firstWithContent = new Map();

async function load(images) {
  const loaded = await Promise.all(
    images.map(async (image) => {
      const data = await readFile(`${DIR}/${image.path}`);
      // Breite und Höhe stehen im IHDR-Block jeder PNG-Datei.
      return { ...image, data, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
    }),
  );
  return loaded.map((image) => {
    const hash = createHash('sha256').update(image.data).digest('hex');
    const first = firstWithContent.get(hash);
    if (!first) firstWithContent.set(hash, image.path);
    return { ...image, sameAs: first };
  });
}

function figure(image, className, style = '') {
  const src = `data:image/png;base64,${image.data.toString('base64')}`;
  const file = image.sameAs ? `${image.path}, gleiches Bild wie ${image.sameAs}` : image.path;
  return `<figure class="${className}"><img src="${src}" alt="" style="${style}"><figcaption>${escape(image.title)}<span>${escape(file)}</span></figcaption></figure>`;
}

function page({ screens, parts, logo }) {
  const screenFigures = screens
    .map((image) => figure(image, image.height / image.width > 3 ? 'tall' : ''))
    .join('');
  // Komponenten in halber Größe der Aufnahme: 1 px je pt wie am Handy.
  const partFigures = parts
    .map((image) => figure(image, '', `width:${String(image.width / 2)}px`))
    .join('');
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>
  :root { --bg: #0c1219; --border: #232b36; --fg: #f2f3f4; --muted: #aab2be; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 2300px; padding: 80px; background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  header { display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px;
    border-bottom: 1px solid var(--border); }
  header img { height: 60px; width: auto; align-self: flex-start; margin-bottom: 12px; }
  h1 { font-size: 44px; font-weight: 600; }
  header p { font-size: 24px; line-height: 1.4; color: var(--muted); }
  h2 { margin: 64px 0 32px; font-size: 32px; font-weight: 600; }
  h2 span { margin-left: 16px; font-size: 24px; font-weight: 400; color: var(--muted); }
  .screens { display: grid; grid-template-columns: repeat(6, 1fr); gap: 48px; align-items: start; }
  .tall { grid-row: span 2; }
  .screens img { display: block; width: 100%; height: auto; border: 1px solid var(--border);
    border-radius: 28px; }
  .parts { columns: 5; column-gap: 48px; }
  .parts figure { break-inside: avoid; margin-bottom: 48px; }
  .parts img { display: block; max-width: 100%; height: auto; border: 1px solid var(--border);
    border-radius: 16px; }
  figcaption { margin-top: 14px; font-size: 22px; font-weight: 600; line-height: 1.3; }
  figcaption span { display: block; margin-top: 2px; font-size: 18px; font-weight: 400;
    color: var(--muted); }
</style></head><body>
<header>
  <img src="data:image/svg+xml;base64,${logo.toString('base64')}" alt="FORM">
  <h1>Screens und Komponenten</h1>
  <p>Dunkel, Handy 390 × 844 pt, Testdaten im frischen Browserprofil. Stand ${STAND}.<br>
  Alle Bilder in voller Auflösung: docs/screens.zip</p>
</header>
<h2>Screens<span>${String(screens.length)} Bilder in docs/screens/</span></h2>
<section class="screens">${screenFigures}</section>
<h2>Komponenten<span>${String(parts.length)} Bilder in docs/screens/komponenten/</span></h2>
<section class="parts">${partFigures}</section>
</body></html>`;
}

/**
 * Kleines ZIP ohne Abhängigkeit: Deflate (oder gespeichert, wenn das nicht kleiner wird),
 * UTF-8-Namen, Dateirechte 644, ohne eigene Einträge für Verzeichnisse.
 */
function zip(entries) {
  const [day, month, year] = STAND.split('.').map(Number);
  const date = ((year - 1980) << 9) | (month << 5) | day;
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const file = Buffer.from(name, 'utf8');
    const deflated = deflateRawSync(data, { level: 9 });
    const method = deflated.length < data.length ? 8 : 0;
    const body = method === 8 ? deflated : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // Version 2.0
    local.writeUInt16LE(0x0800, 6); // Namen in UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10); // 00:00 Uhr
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(file.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // erstellt unter Unix, Version 2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(file.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // normale Datei, rw-r--r--
    central.writeUInt32LE(offset, 42);
    locals.push(local, file, body);
    centrals.push(central, file);
    offset += local.length + file.length + body.length;
  }
  const size = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

async function pngFiles() {
  const files = await readdir(DIR, { recursive: true });
  return files
    .map((path) => path.split(sep).join('/'))
    .filter((path) => path.endsWith('.png'))
    .sort();
}

const files = (await pngFiles()).filter((path) => path !== OVERVIEW);
const screens = await load(
  ordered(
    files.filter((path) => !path.includes('/')),
    SCREENS,
  ),
);
const parts = await load(
  ordered(
    files.filter((path) => path.includes('/')),
    PARTS,
  ),
);
const logo = await readFile('public/brand/logo-kopfzeile-dunkel.svg');

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  const tab = await browser.newPage({ viewport: { width: 2300, height: 1200 } });
  await tab.setContent(page({ screens, parts, logo }));
  await tab.screenshot({ path: `${DIR}/${OVERVIEW}`, fullPage: true });
  console.log(`${DIR}/${OVERVIEW}: ${String(screens.length + parts.length)} Bilder`);
} finally {
  await browser.close();
}

const entries = await Promise.all(
  (await pngFiles()).map(async (path) => ({
    name: `screens/${path}`,
    data: await readFile(`${DIR}/${path}`),
  })),
);
await writeFile(ARCHIVE, zip(entries));
console.log(`${ARCHIVE}: ${String(entries.length)} Bilder`);
