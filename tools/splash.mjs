#!/usr/bin/env node
/**
 * Startbilder und Startfläche der installierten App (Rebranding D, D-317; F5 Abschnitt 4.5,
 * Variante C3, D-325).
 *
 * Regel C3: Fläche Nacht #0C1219. Das Logo „Vertikal“ – das F oben, darunter zentriert die
 * Wortmarke – steht mit seiner Mitte bei 47 % der Höhe: Breite der Wortmarke 36 % der kurzen
 * Seite, Höhe des F das 2,28-Fache der Versalhöhe der Wortmarke, Abstand dazwischen das 0,82-Fache,
 * beide waagrecht mittig; Symbol #C7FF46, Wortmarke #FFFFFF wie in den Logo-Dateien. Darunter als
 * Fußzeile „FORM YOURSELF.“ in Inter SemiBold, Schriftgröße 3,25 % der kurzen Seite (hochkant die
 * Breite; quer ebenfalls die kurze Seite, damit Claim und Logo im selben Verhältnis bleiben),
 * Laufweite 0,21 em, #AAB2BE, waagrecht mittig, Grundlinie 58 pt über dem unteren Rand.
 *
 * Alles sind Pfade aus vorhandenen Dateien, keine neue Zeichnung: das F aus
 * `public/brand/symbol-f-gruen.svg`, die Wortmarke aus `public/brand/logo-kopfzeile-dunkel.svg`,
 * der Claim aus `tools/fonts/Inter-SemiBold.otf` (SIL Open Font License, nur im Werkzeug, nicht in
 * der App). Die Stellen der Zeichen mit Laufweite und Unterschneidung misst Chromium, die Umrisse
 * liefert `tools/glyphs.mjs`.
 *
 * Schreibt
 * - `public/splash/splash-<Breite>x<Höhe>.png`: 40 Bilder für 20 Geräte, hochkant und quer;
 * - `public/splash/splash.svg`: Vorlage 390 × 844 pt mit den Gruppen `symbol`, `wortmarke`, `claim`;
 * - in `index.html` die Startfläche zwischen den Markierungen `startflaeche`: dieselben Pfade,
 *   mit CSS nach derselben Regel gesetzt (`vmin` für die kurze Seite), damit Startbild und
 *   Startfläche gleich aussehen.
 * Danach gibt es die `<link>`-Zeilen für `index.html` aus. `src/app/splash.test.ts` prüft Zeilen,
 * Dateien, Pixelmaße und die Regel in den Bildern.
 *
 * Aufruf: `node tools/splash.mjs` (braucht Chromium von Playwright, in Cloud-Sitzungen über
 * `PW_CHROMIUM_PATH`). `--check` schreibt nichts und prüft, ob Bilder, Vorlage und Startfläche zur
 * Regel passen.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { glyphPath, loadFont } from './glyphs.mjs';

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

/** Die Regel (Auftrag F5, Abschnitt 4.5, Variante C3). */
const RULE = {
  night: '#0C1219',
  green: '#C7FF46',
  white: '#FFFFFF',
  claimColor: '#AAB2BE',
  claim: 'FORM YOURSELF.',
  /** Breite der Wortmarke je kurze Seite. */
  wordWidth: 0.36,
  /** Höhe des F und Abstand zur Wortmarke je Versalhöhe der Wortmarke. */
  symbolHeight: 2.28,
  gap: 0.82,
  /** Mitte des Logos je Höhe. */
  centerY: 0.47,
  /** Schriftgröße je kurze Seite, Laufweite in em, Grundlinie in pt über dem unteren Rand. */
  claimSize: 0.0325,
  tracking: 0.21,
  baseline: 58,
};

/** Einheiten des Logos: die Wortmarke ist 1000 breit. Claim: 1000 je Geviert, Grundlinie bei 0. */
const LOGO_WIDTH = 1000;
const EM = 1000;
const FONT = 'tools/fonts/Inter-SemiBold.otf';

const n = (value, digits = 3) => Number(value.toFixed(digits));
const s = (value, digits = 3) => String(n(value, digits));

function group(svg, id) {
  const match = new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`).exec(svg);
  if (!match?.[1]) throw new Error(`Gruppe ${id} nicht gefunden`);
  return match[1].trim();
}

/** Ausmaße von Pfaden, gemessen im Browser (getBBox). */
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

/** Stellen der Zeichen des Claims in px bei 1000 px Schriftgröße, gemessen mit Inter im Browser. */
async function claimPositions(page) {
  const font = (await readFile(FONT)).toString('base64');
  await page.setContent(
    `<!doctype html><style>@font-face{font-family:Claim;src:url(data:font/otf;base64,${font})}` +
      `body{margin:0}#t{position:absolute;left:0;top:0;font:${String(EM)}px/1 Claim;` +
      `letter-spacing:${String(RULE.tracking)}em;white-space:pre;font-kerning:normal;` +
      `font-feature-settings:'kern' 1,'liga' 0,'calt' 0}</style><span id="t">${RULE.claim}</span>`,
  );
  return page.evaluate(async () => {
    const doc = globalThis.document;
    await doc.fonts.ready;
    const node = doc.getElementById('t').firstChild;
    const lefts = [];
    for (let i = 0; i < node.length; i += 1) {
      const range = doc.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      lefts.push(range.getBoundingClientRect().left);
    }
    return lefts;
  });
}

/** Teile des Startbilds in eigenen Einheiten: Logo (Wortmarke 1000 breit) und Claim (1000 je em). */
async function parts(page) {
  const symbol = group(await readFile('public/brand/symbol-f-gruen.svg', 'utf8'), 'symbol');
  const wordmark = group(
    await readFile('public/brand/logo-kopfzeile-dunkel.svg', 'utf8'),
    'wortmarke',
  );
  await page.setContent('<!doctype html><html><body></body></html>');
  const f = await bbox(page, symbol);
  const word = await bbox(page, wordmark);

  const wordScale = LOGO_WIDTH / word.width;
  const cap = word.height * wordScale;
  const symbolScale = (RULE.symbolHeight * cap) / f.height;
  const symbolHeight = f.height * symbolScale;
  const gap = RULE.gap * cap;
  const logoHeight = symbolHeight + gap + cap;
  const symbolTransform = `translate(${s((LOGO_WIDTH - f.width * symbolScale) / 2 - f.x * symbolScale)} ${s(-f.y * symbolScale)}) scale(${s(symbolScale, 6)})`;
  const wordTransform = `translate(${s(-word.x * wordScale)} ${s(symbolHeight + gap - word.y * wordScale)}) scale(${s(wordScale, 6)})`;

  const font = loadFont(FONT);
  const lefts = await claimPositions(page);
  const scale = EM / font.unitsPerEm;
  const claim = [...RULE.claim]
    .map((char, i) =>
      char === ' ' ? '' : glyphPath(font.outline(char), lefts[i] - lefts[0], 0, scale),
    )
    .join('');
  await page.setContent('<!doctype html><html><body></body></html>');
  const ink = await bbox(page, `<path d="${claim}"/>`);
  return {
    symbol,
    wordmark,
    symbolTransform,
    wordTransform,
    logoHeight,
    cap,
    claim,
    ink,
    measured: { f, word },
  };
}

/** Logo in Einheiten des Logos (Wortmarke 1000 breit, oben links bei 0, 0). */
function logoGroups(p, ids = { symbol: 'symbol', wortmarke: 'wortmarke' }) {
  return (
    `<g id="${ids.symbol}" fill="${RULE.green}" transform="${p.symbolTransform}">${p.symbol}</g>` +
    `<g id="${ids.wortmarke}" fill="${RULE.white}" transform="${p.wordTransform}">${p.wordmark}</g>`
  );
}

/**
 * Lage der Teile auf einem Bildschirm von `width` × `height` Einheiten, `pt` Einheiten je Punkt:
 * Logo-Maßstab und -Ecke, Claim-Maßstab und Grundlinie.
 */
function layout(width, height, pt, p) {
  const short = Math.min(width, height);
  const logoScale = (RULE.wordWidth * short) / LOGO_WIDTH;
  const claimScale = (RULE.claimSize * short) / EM;
  return {
    logo: {
      scale: logoScale,
      x: width / 2 - (LOGO_WIDTH * logoScale) / 2,
      y: RULE.centerY * height - (p.logoHeight * logoScale) / 2,
    },
    claim: {
      scale: claimScale,
      x: width / 2 - (p.ink.x + p.ink.width / 2) * claimScale,
      baseline: height - RULE.baseline * pt,
    },
  };
}

function screenSvg(width, height, pt, p, attributes = '') {
  const l = layout(width, height, pt, p);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s(width)} ${s(height)}"${attributes}>\n` +
    `<rect id="hintergrund" width="${s(width)}" height="${s(height)}" fill="${RULE.night}"/>\n` +
    `<g id="logo" transform="translate(${s(l.logo.x)} ${s(l.logo.y)}) scale(${s(l.logo.scale, 6)})">\n${logoGroups(p)}\n</g>\n` +
    `<g id="claim" fill="${RULE.claimColor}" transform="translate(${s(l.claim.x)} ${s(l.claim.baseline)}) scale(${s(l.claim.scale, 6)})"><path d="${p.claim}"/></g>\n` +
    `</svg>\n`
  );
}

/**
 * Startfläche für `index.html`: Stil für den Kopf und Inhalt für den Körper. Sichtbar nur in der
 * installierten App (`display-mode: standalone`), denn nur dort zeigt iOS vorher ein Startbild.
 * `src/app/startSurface.ts` blendet sie aus, sobald die erste Ansicht steht; zehn Sekunden sind
 * nur das Netz, falls die App gar nicht startet.
 */
function surface(p) {
  // Alles in Prozent des Bildschirms: Hochkant ist die kurze Seite die Breite, quer die Höhe.
  const word = RULE.wordWidth * 100;
  const logoHeight = (word * p.logoHeight) / LOGO_WIDTH;
  const center = RULE.centerY * 100;
  const vmin = RULE.claimSize * 100;
  const claimWidth = (p.ink.width / EM) * vmin;
  const claimHeight = (p.ink.height / EM) * vmin;
  // Abstand der Unterkante des Claims unter der Grundlinie (Überhang von O und S).
  const below = ((p.ink.y + p.ink.height) / EM) * vmin;
  const pct = (value) => `${s(value, 4)}%`;
  const style = [
    '#startflaeche{display:none}',
    '@media (display-mode:standalone){#startflaeche{display:block;position:fixed;inset:0;z-index:2147483647;background:' +
      RULE.night +
      ';pointer-events:none;animation:startflaeche-netz 0s 10s forwards}}',
    '#startflaeche.weg{opacity:0;transition:opacity 300ms ease-out}',
    '@media (prefers-reduced-motion:reduce){#startflaeche.weg{transition:none}}',
    '@keyframes startflaeche-netz{to{visibility:hidden}}',
    '#startflaeche>svg{display:block;width:100%;height:100%}',
    `#startflaeche .start-unten{transform:translateY(calc(${s(below, 4)}vmin - ${String(RULE.baseline)}px))}`,
    '@media (orientation:landscape){#startflaeche .hoch{display:none}}',
    '@media (orientation:portrait){#startflaeche .quer{display:none}}',
  ].join('');
  // Ohne die ids der einzelnen Pfade, damit index.html keine doppelten oder fremden ids bekommt.
  const logo = logoGroups(p, { symbol: 'start-symbol', wortmarke: 'start-wortmarke' }).replace(
    /<path id="[^"]*" /g,
    '<path ',
  );
  // Eine SVG über den ganzen Bildschirm, darin die Teile als eigene Ansichten mit Prozentwerten:
  // So liegt nichts auf ganzen Pixeln eingerastet, und der Browser zeichnet wie beim Startbild.
  const body =
    `<div id="startflaeche" aria-hidden="true"><svg>` +
    `<symbol id="start-logo" viewBox="0 0 ${String(LOGO_WIDTH)} ${s(p.logoHeight)}">${logo}</symbol>` +
    `<symbol id="start-claim-zeichen" viewBox="${s(p.ink.x)} ${s(p.ink.y)} ${s(p.ink.width)} ${s(p.ink.height)}" preserveAspectRatio="xMidYMax meet"><g id="start-claim" fill="${RULE.claimColor}"><path d="${p.claim}"/></g></symbol>` +
    `<use class="hoch" href="#start-logo" x="${pct(50 - word / 2)}" y="${pct(center - 50)}" width="${pct(word)}" height="100%"/>` +
    `<use class="quer" href="#start-logo" x="0" y="${pct(center - logoHeight / 2)}" width="100%" height="${pct(logoHeight)}"/>` +
    `<g class="start-unten">` +
    `<use class="hoch" href="#start-claim-zeichen" x="${pct(50 - claimWidth / 2)}" y="0" width="${pct(claimWidth)}" height="100%"/>` +
    `<use class="quer" href="#start-claim-zeichen" x="0" y="${pct(100 - claimHeight)}" width="100%" height="${pct(claimHeight)}"/>` +
    `</g></svg></div>`;
  return { style, body };
}

/** Ersetzt den Inhalt zwischen `<!-- name -->` und `<!-- /name -->`. */
function between(html, name, content, indent) {
  const start = `<!-- ${name} -->`;
  const end = `<!-- /${name} -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`Markierung ${name} fehlt in index.html`);
  return `${html.slice(0, a + start.length)}\n${indent}${content}\n${indent}${html.slice(b)}`;
}

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

async function render(browser, image, p) {
  const { width, height, dpr } = image;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${RULE.night}">${screenSvg(width, height, dpr, p, ` width="${String(width)}" height="${String(height)}" style="display:block"`)}</body></html>`,
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
      if (pa.length !== pb.length) return 255;
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

const check = process.argv.includes('--check');
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  const page = await browser.newPage();
  const p = await parts(page);
  await page.close();
  console.log(
    `F ${s(p.measured.f.width)} × ${s(p.measured.f.height)}, Wortmarke ${s(p.measured.word.width)} × ${s(p.measured.word.height)}; Logo 1000 × ${s(p.logoHeight)}, Versalhöhe ${s(p.cap)}; Claim ${s(p.ink.width)} × ${s(p.ink.height)} je 1000 em`,
  );

  const template = screenSvg(390, 844, 1, p, ' width="1170" height="2532"');
  const { style, body } = surface(p);
  let html = await readFile('index.html', 'utf8');
  // Prettier soll die erzeugten Zeilen nicht umbrechen, sonst passte `--check` nicht mehr.
  html = between(
    html,
    'startflaeche:stil',
    `<!-- prettier-ignore -->\n    <style>${style}</style>`,
    '    ',
  );
  html = between(html, 'startflaeche', `<!-- prettier-ignore -->\n    ${body}`, '    ');

  let failed = false;
  if (check) {
    if ((await readFile('public/splash/splash.svg', 'utf8')) !== template) {
      console.error('public/splash/splash.svg passt nicht zur Regel');
      failed = true;
    }
    if ((await readFile('index.html', 'utf8')) !== html) {
      console.error('Startfläche in index.html passt nicht zur Regel');
      failed = true;
    }
  } else {
    await writeFile('public/splash/splash.svg', template);
    await writeFile('index.html', html);
  }

  for (const image of startupImages()) {
    const path = `public/splash/${image.file}`;
    const png = await render(browser, image, p);
    if (check) {
      const diff = await difference(browser, png, await readFile(path));
      if (diff > 0.5) {
        console.error(`${path}: mittlere Abweichung ${diff.toFixed(3)} von 255`);
        failed = true;
      }
    } else {
      await writeFile(path, png);
      console.log(path);
    }
  }
  if (check) {
    console.log(
      failed ? 'Prüfung fehlgeschlagen' : 'Bilder, Vorlage und Startfläche passen zur Regel',
    );
    if (failed) process.exitCode = 1;
  } else {
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
