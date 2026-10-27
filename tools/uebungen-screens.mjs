#!/usr/bin/env node
/**
 * Bilder des Gerüsts der Phase Übungen (Auftrag Phase 1, „Bilder des Gerüsts“; D-397).
 *
 * Voraussetzung: `pnpm build` und ein laufendes `pnpm preview` (http://localhost:4173).
 * Aufruf: `node tools/uebungen-screens.mjs`. Ergebnis in `docs/screens/uebungen/`:
 *   - `rueckfall-*.png`: so, wie die App ausgeliefert wird (noch keine Visuals, Symbol in der
 *     Kachel),
 *   - `prototyp-*.png`: dieselben Ansichten mit dem Rohentwurf des eigenen FORM-Stils für zwei
 *     Übungen (Kniebeuge und Bankdrücken mit Langhantel, `docs/screens/uebungen/prototyp/`). Die
 *     Liste der Visuals und die Bilder kommen dabei nur im Test über `page.route` dazu; in der App
 *     liegt kein Prototyp.
 * Dazu `uebersicht.png` mit allen Ansichten. Testdaten nur im frischen Profil von Playwright.
 * Haltungen wie `e2e/duo.ts` (D-371): Duo zugeklappt 466 × 678 mit 84 pt Systemrand rechts,
 * aufgeklappt 951 × 669 mit 84 pt rechts; iPhone 390 × 844.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const OUT = 'docs/screens/uebungen';
const PROTO = `${OUT}/prototyp`;

const POSES = {
  iphone: { width: 390, height: 844, insets: { top: 47, right: 0, bottom: 34, left: 0 } },
  zu: { width: 466, height: 678, insets: { top: 0, right: 84, bottom: 34, left: 0 } },
  auf: { width: 951, height: 669, insets: { top: 0, right: 84, bottom: 20, left: 0 } },
};

/** Liste der Visuals für den Prototyp (gleiches Format wie `public/uebungen/medien.json`). */
const PROTOTYPE = {
  version: 1,
  sources: {
    form_prototyp: {
      name: 'FORM, Rohentwurf eigener Stil',
      url: 'https://fitness-app-mu-drab.vercel.app/',
      license: 'eigenes Werk',
      commercialUse: true,
    },
  },
  visuals: Object.fromEntries(
    [
      [
        'back_squat_barbell',
        'Kniebeuge mit der Langhantel auf dem oberen Rücken, seitlich gesehen.',
      ],
      [
        'bench_press_barbell',
        'Bankdrücken auf der Flachbank mit der Langhantel, seitlich gesehen.',
      ],
    ].map(([key, alt]) => [
      key,
      {
        preview: { src: `medien/${key}-vorschau.svg`, width: 240, height: 240 },
        demo: {
          kind: 'phases',
          start: { src: `medien/${key}-start.svg`, width: 640, height: 480 },
          end: { src: `medien/${key}-ende.svg`, width: 640, height: 480 },
        },
        alt,
        source: 'form_prototyp',
      },
    ]),
  ),
};

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
await mkdir(OUT, { recursive: true });

async function newPage(prototype) {
  const context = await browser.newContext({
    viewport: { width: POSES.iphone.width, height: POSES.iphone.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    // Bilder ohne Überblenden: die zwei Phasen stehen nebeneinander, wie bei „weniger Bewegung“.
    reducedMotion: prototype ? 'no-preference' : 'reduce',
  });
  if (prototype) {
    await context.route('**/uebungen/medien.json', (route) => route.fulfill({ json: PROTOTYPE }));
    await context.route('**/uebungen/medien/*.svg', async (route) => {
      const name = new URL(route.request().url()).pathname.split('/').pop();
      route.fulfill({
        body: await readFile(`${PROTO}/${name}`),
        contentType: 'image/svg+xml',
      });
    });
  }
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.cdp = await context.newCDPSession(page);
  return page;
}

async function setPose(page, pose) {
  const p = POSES[pose];
  await page.setViewportSize({ width: p.width, height: p.height });
  await page.cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: p.insets });
  await page.waitForTimeout(300);
}

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached' })
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

const shots = [];
async function shot(page, name, label) {
  // Der Prototyp wechselt die Phasen alle 1,2 s; für das Bild die Endposition halb sichtbar
  // vermeiden: Animation anhalten, Ausgangsposition zeigen.
  await page.addStyleTag({ content: '.demo-phase-end{animation:none!important;opacity:0}' });
  await page.waitForTimeout(200);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  shots.push({ path, label });
  console.log(path);
}

for (const mode of ['rueckfall', 'prototyp']) {
  const page = await newPage(mode === 'prototyp');
  await setPose(page, 'iphone');
  await open(page, '/uebungen');
  await shot(page, `${mode}-liste`, `${mode}: Übungsliste, iPhone`);

  // Übungsdetails der Kniebeuge (Basisübung) mit Ausführung.
  await page
    .getByRole('link', { name: /^Kniebeuge mit Langhantel/ })
    .first()
    .click();
  await page.getByRole('heading', { level: 1, name: 'Kniebeuge mit Langhantel' }).waitFor();
  await page.getByText('Schritt für Schritt').waitFor();
  await page.waitForTimeout(400);
  await shot(page, `${mode}-details`, `${mode}: Übungsdetails, iPhone`);
  await page.evaluate(() => {
    const frame = globalThis.document.getElementById('seite');
    frame?.scrollTo(0, 520);
  });
  await page.waitForTimeout(300);
  await shot(page, `${mode}-details-ausfuehrung`, `${mode}: Ausführung mit Quellen, iPhone`);

  // Training aus der Vorlage Ganzkörper A/B, Tag A.
  await open(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).first().click();
  await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
  await page.waitForTimeout(600);
  await shot(page, `${mode}-player-iphone`, `${mode}: Player, iPhone`);
  await setPose(page, 'zu');
  await page.waitForTimeout(400);
  await shot(page, `${mode}-player-zugeklappt`, `${mode}: Player, Duo zugeklappt`);
  await setPose(page, 'auf');
  await page.waitForTimeout(600);
  await shot(page, `${mode}-player-aufgeklappt`, `${mode}: Player, Duo aufgeklappt`);
  // Antippen der Demonstration öffnet die Übungsinfo mit Ausführung.
  await page
    .getByRole('button', { name: 'Kniebeuge mit Langhantel: Ausführung und Angaben' })
    .first()
    .click();
  await page.getByRole('dialog', { name: 'Kniebeuge mit Langhantel' }).waitFor();
  await page.getByText('Schritt für Schritt').first().waitFor();
  await page.waitForTimeout(400);
  await shot(page, `${mode}-player-info`, `${mode}: Übungsinfo im Player, Duo aufgeklappt`);
  await page.context().close();
}
await browser.close();

// Verkleinern wie bei duo-screens.mjs (256 Farben), dann Übersicht.
const paths = shots.map((s) => s.path);
try {
  execFileSync(
    'python3',
    [
      '-c',
      `
import sys
from PIL import Image
for path in sys.argv[1:]:
    image = Image.open(path).convert('RGB')
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)
`,
      ...paths,
    ],
    { stdio: 'inherit' },
  );
} catch {
  console.log('Pillow fehlt: Die Bilder bleiben unverkleinert.');
}
// Übersicht: oben ausgeliefert, unten mit Rohentwurf; Liste, Details, Player zu und auf.
try {
  execFileSync(
    'python3',
    [
      '-c',
      `
from PIL import Image, ImageDraw, ImageFont
D = '${OUT}/'
rows = [('Ausgeliefert (ohne Visuals, Symbol in der Kachel)', 'rueckfall'),
        ('Rohentwurf eigener FORM-Stil (nur im Test)', 'prototyp')]
cols = ['liste', 'details', 'player-zugeklappt', 'player-aufgeklappt']
H = 620
imgs = {}
for _, m in rows:
    for c in cols:
        im = Image.open(f'{D}{m}-{c}.png').convert('RGB')
        imgs[(m, c)] = im.resize((int(im.width * H / im.height), H))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except OSError:
    font = ImageFont.load_default()
widths = [max(imgs[(m, c)].width for _, m in rows) for c in cols]
out = Image.new('RGB', (sum(widths) + 20 * (len(cols) + 1), len(rows) * (H + 70) + 20), (12, 18, 25))
draw = ImageDraw.Draw(out)
y = 10
for title, m in rows:
    draw.text((20, y), title, fill=(242, 243, 244), font=font)
    y += 34
    x = 20
    for c, w in zip(cols, widths):
        out.paste(imgs[(m, c)], (x, y))
        x += w + 20
    y += H + 36
out.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(D + 'uebersicht.png', optimize=True)
`,
    ],
    { stdio: 'inherit' },
  );
  console.log(`${OUT}/uebersicht.png`);
} catch {
  console.log('Pillow fehlt: keine Übersicht.');
}
console.log(`${String(shots.length)} Bilder`);
