#!/usr/bin/env node
/**
 * Bilder und Aufnahme des 3D-Piloten (Übungen, Fortsetzung Abschnitt 7; D-402, D-403).
 *
 * Voraussetzung: `pnpm build`, ein laufendes `pnpm preview` (http://localhost:4173) und die
 * Einzelbilder aus `tools/uebungen-3d/render.py` unter /tmp/uebungen-3d/<übung>/.
 * Aufruf: `node tools/pilot-screens.mjs`. Ergebnis in `docs/screens/uebungen/`:
 *   - `pilot-<übung>-{zugeklappt,aufgeklappt,details}.png`, `pilot-liste.png`,
 *   - `pilot-uebersicht.png` (je Übung Ausgangs- und Endposition, Player zu und auf, Details),
 *   - `pilot-player.webm` (Aufnahme des Players aufgeklappt, Kniebeuge).
 * Haltungen wie `e2e/duo.ts`: Duo zugeklappt 466 × 678, aufgeklappt 951 × 669; iPhone 390 × 844.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const OUT = 'docs/screens/uebungen';
const FRAMES = process.env.PILOT_FRAMES ?? '/tmp/uebungen-3d';
const POSES = {
  iphone: { width: 390, height: 844, insets: { top: 47, right: 0, bottom: 34, left: 0 } },
  zu: { width: 466, height: 678, insets: { top: 0, right: 84, bottom: 34, left: 0 } },
  auf: { width: 951, height: 669, insets: { top: 0, right: 84, bottom: 20, left: 0 } },
};
const PILOT = [
  ['kniebeuge', 'Kniebeuge mit Langhantel', 'kniebeuge mit lang'],
  ['bankdruecken', 'Bankdrücken mit Langhantel', 'bankdrücken mit lang'],
  ['latziehen', 'Latziehen', 'latziehen'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);

async function newPage(video) {
  const context = await browser.newContext({
    viewport: { width: POSES.iphone.width, height: POSES.iphone.height },
    // Die Aufnahme in einfacher Auflösung, damit genug Bilder je Sekunde zusammenkommen.
    deviceScaleFactor: video ? 1 : 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.cdp = await context.newCDPSession(page);
  return page;
}

async function setPose(page, pose) {
  const p = POSES[pose];
  await page.setViewportSize({ width: p.width, height: p.height });
  await page.cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: p.insets });
  await page.waitForTimeout(400);
}

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.waitForTimeout(500);
}

/** Alle Schleifen auf die Endposition stellen und anhalten, damit das Bild ruhig ist. */
async function holdVideos(page) {
  await page.evaluate(async () => {
    const videos = [...globalThis.document.querySelectorAll('video')];
    await Promise.all(
      videos.map(
        (v) =>
          new Promise((resolve) => {
            v.pause();
            v.addEventListener('seeked', resolve, { once: true });
            v.currentTime = 1.3;
            globalThis.setTimeout(resolve, 2000);
          }),
      ),
    );
  });
  await page.waitForTimeout(300);
}

async function shot(page, name) {
  await holdVideos(page);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  console.log(path);
  return path;
}

async function startWith(page, search, name) {
  await open(page, '/training');
  const end = page.getByRole('button', { name: 'Beenden', exact: true });
  if (await end.isVisible().catch(() => false)) {
    await end.click();
    const confirm = page.getByRole('button', { name: /beenden|verwerfen/i }).last();
    await confirm.click().catch(() => undefined);
  }
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await page.getByRole('heading', { level: 1, name: 'Freies Training' }).waitFor();
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill(search);
  await picker
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click();
  await picker.waitFor({ state: 'hidden' });
  await page.waitForTimeout(800);
}

const paths = [];
for (const [key, name, search] of PILOT) {
  const page = await newPage(false);
  if (key === 'kniebeuge') {
    await open(page, '/uebungen');
    paths.push(await shot(page, 'pilot-liste'));
  }
  await setPose(page, 'zu');
  await startWith(page, search, name);
  paths.push(await shot(page, `pilot-${key}-zugeklappt`));
  await setPose(page, 'auf');
  await page.waitForTimeout(800);
  paths.push(await shot(page, `pilot-${key}-aufgeklappt`));
  await setPose(page, 'iphone');
  await open(page, '/uebungen');
  await page
    .getByRole('link', { name: new RegExp(`^${name}`) })
    .first()
    .click();
  await page.getByRole('heading', { level: 1, name }).waitFor();
  await page.waitForTimeout(1200);
  paths.push(await shot(page, `pilot-${key}-details`));
  await page.context().close();
}

// Aufnahme: Player aufgeklappt mit der Kniebeuge, gut zwei Wiederholungen. Einzelbilder statt der
// Videoaufnahme von Playwright (die bräuchte ein eigenes ffmpeg), dann mit ffmpeg zusammengesetzt.
{
  const page = await newPage(true);
  await setPose(page, 'auf');
  await startWith(page, PILOT[0][2], PILOT[0][1]);
  await page.waitForTimeout(1500);
  await rm('/tmp/pilot-frames', { recursive: true, force: true });
  await mkdir('/tmp/pilot-frames', { recursive: true });
  const start = Date.now();
  let count = 0;
  while (Date.now() - start < 5500) {
    await page.screenshot({ path: `/tmp/pilot-frames/${String(count).padStart(4, '0')}.png` });
    count += 1;
  }
  const fps = Math.max(1, Math.round((count * 1000) / (Date.now() - start)));
  await page.context().close();
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-i',
    '/tmp/pilot-frames/%04d.png',
    '-an',
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '40',
    `${OUT}/pilot-player.webm`,
  ]);
  console.log(`${OUT}/pilot-player.webm (${String(count)} Bilder, ${String(fps)} je Sekunde)`);
}
await browser.close();

execFileSync(
  'python3',
  [
    '-c',
    `
import sys
from PIL import Image, ImageDraw, ImageFont
D, F = sys.argv[1], sys.argv[2]
pilot = [('kniebeuge', 'Kniebeuge mit Langhantel'), ('bankdruecken', 'Bankdrücken mit Langhantel'), ('latziehen', 'Latziehen am Kabel')]
H = 560
def load(path, h=H):
    im = Image.open(path).convert('RGB')
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except OSError:
    font = small = ImageFont.load_default()
rows = []
for key, title in pilot:
    cells = [(load(f'{F}/{key}/bild-000.png', 300), 'Ausgangsposition'), (load(f'{F}/{key}/bild-030.png', 300), 'Endposition'),
             (load(f'{D}/pilot-{key}-zugeklappt.png'), 'Player zugeklappt'), (load(f'{D}/pilot-{key}-aufgeklappt.png'), 'Player aufgeklappt'),
             (load(f'{D}/pilot-{key}-details.png'), 'Übungsdetails')]
    rows.append((title, cells))
liste = load(f'{D}/pilot-liste.png')
width = max(sum(c.width for c, _ in cells) + 20 * (len(cells) + 1) for _, cells in rows) + liste.width + 20
height = len(rows) * (H + 90) + 20
out = Image.new('RGB', (width, height), (12, 18, 25))
draw = ImageDraw.Draw(out)
y = 10
for title, cells in rows:
    draw.text((20, y), title, fill=(242, 243, 244), font=font)
    y += 36
    x = 20
    for im, label in cells:
        top = y if im.height == H else y + (H - im.height) // 2
        out.paste(im, (x, top))
        draw.text((x, y + H + 6), label, fill=(170, 178, 190), font=small)
        x += im.width + 20
    y += H + 54
x = width - liste.width - 20
draw.text((x, 10), 'Übungsliste', fill=(242, 243, 244), font=font)
out.paste(liste, (x, 46))
out.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(f'{D}/pilot-uebersicht.png', optimize=True)
for path in sys.argv[3:]:
    image = Image.open(path).convert('RGB')
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)
`,
    OUT,
    FRAMES,
    ...paths,
  ],
  { stdio: 'inherit' },
);
console.log(`${OUT}/pilot-uebersicht.png`);
