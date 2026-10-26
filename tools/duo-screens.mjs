#!/usr/bin/env node
/**
 * Prüfung aller Screens in den Haltungen des iPhone Duo (Phase iPhone Duo, Auftrag Phase 1
 * Punkt 2; Leitlinien Kapitel 3 bis 9; D-379).
 *
 * Voraussetzung: `pnpm build` und ein laufendes `pnpm preview` (http://localhost:4173).
 * Aufruf: `node tools/duo-screens.mjs`. Ergebnis: je Screen und Haltung ein Bild in
 * `docs/screens/duo/`, das Übersichtsbild `docs/screens/duo/uebersicht-duo.png` und die
 * automatischen Befunde in `docs/screens/duo/befunde.json`.
 *
 * Haltungen wie `e2e/duo.ts` (D-371): zugeklappt 466 × 678 (rechts 84 pt Systemrand),
 * Zwischenmaß 669 × 951 (inneres Display hoch), aufgeklappt 951 × 669 (rechts 84 pt), dazu
 * zugeklappt quer 594 × 368 für Blätter. Den sicheren Bereich stellt Chromium über die
 * Entwicklerschnittstelle nach. Testdaten nur im frischen Profil von Playwright; ins Repository
 * kommen nur Bilder und Befunde. Geprüft werden je Ansicht: waagrechter Überlauf, Bedienelemente
 * und Text unter dem Systemrand, sich überlagernde Bedienelemente, abgeschnittener Text, Schrift
 * unter 11 px, gestauchte Symbole, Tippflächen unter 44 × 44 px (nur Hinweis) und
 * Barrierefreiheit (axe-core, WCAG 2.1 AA). Zum Schluss verkleinert Pillow (Python) alle Bilder
 * auf 256 Farben, damit das Repository klein bleibt; ohne Pillow bleiben sie, wie sie sind.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';
const OUT = 'docs/screens/duo';

const POSES = {
  zu: {
    label: 'zugeklappt',
    width: 466,
    height: 678,
    insets: { top: 0, right: 84, bottom: 34, left: 0 },
  },
  hoch: {
    label: 'Zwischenmaß',
    width: 669,
    height: 951,
    insets: { top: 24, right: 0, bottom: 20, left: 0 },
  },
  auf: {
    label: 'aufgeklappt',
    width: 951,
    height: 669,
    insets: { top: 0, right: 84, bottom: 20, left: 0 },
  },
};
const POSE_ORDER = ['zu', 'hoch', 'auf'];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
await mkdir(OUT, { recursive: true });

/** Neuer Kontext wie am iPhone: Touch, Sprache de-AT, Zeitzone Wien, dunkel. */
async function newPage() {
  const context = await browser.newContext({
    viewport: { width: POSES.zu.width, height: POSES.zu.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.cdp = await context.newCDPSession(page);
  return page;
}

async function setPose(page, pose) {
  const p = POSES[pose];
  await page.setViewportSize({ width: p.width, height: p.height });
  await page.cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: p.insets });
  await page.waitForTimeout(250);
}

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached' })
    .catch(() => undefined);
  await page.waitForTimeout(300);
}

/** Automatische Befunde einer Ansicht (Leitlinien Kapitel 3 bis 9). */
async function inspect(page, pose) {
  const p = POSES[pose];
  const found = await page.evaluate(
    ({ safeLeft, safeRight }) => {
      const out = [];
      const describe = (el) => {
        const name =
          el.getAttribute('aria-label') ||
          el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40) ||
          el.getAttribute('name') ||
          '';
        return `${el.tagName.toLowerCase()}${name ? ` „${name}“` : ''}`;
      };
      /** Sichtbarer Teil: geschnitten mit allen Vorfahren, die überstehenden Inhalt abschneiden. */
      const clipped = (el) => {
        const r = el.getBoundingClientRect();
        let [left, top, right, bottom] = [r.left, r.top, r.right, r.bottom];
        for (let n = el.parentElement; n; n = n.parentElement) {
          const s = globalThis.getComputedStyle(n);
          if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
            const c = n.getBoundingClientRect();
            left = Math.max(left, c.left);
            top = Math.max(top, c.top);
            right = Math.min(right, c.right);
            bottom = Math.min(bottom, c.bottom);
          }
        }
        return { left, top, right, bottom, width: right - left, height: bottom - top };
      };
      /** Feste, klebende oder darübergelegte Schicht (Tab-Leiste, Fußleiste, Menü, Vollansicht). */
      const layer = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const { position } = globalThis.getComputedStyle(n);
          if (position === 'fixed' || position === 'sticky' || position === 'absolute') return n;
        }
        return null;
      };
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        for (let n = el; n; n = n.parentElement) {
          const s = globalThis.getComputedStyle(n);
          if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0)
            return false;
        }
        return true;
      };
      // Die Seite scrollt im Rahmen der App (D-384); er schneidet waagrecht ab, Überlauf zählt
      // trotzdem: `scrollWidth` misst ihn mit.
      const root =
        globalThis.document.getElementById('seite') ?? globalThis.document.documentElement;
      if (root.scrollWidth > root.clientWidth + 1) {
        out.push({
          art: 'Überlauf waagrecht',
          detail: `${root.scrollWidth} px bei ${root.clientWidth} px`,
        });
      }
      // In einem offenen Dialog zählt nur er; sonst die ganze Seite.
      const scope = globalThis.document.querySelector('dialog[open]') ?? globalThis.document.body;
      const controls = [
        ...scope.querySelectorAll(
          'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch], [role=tab], [role=checkbox]',
        ),
      ].filter(visible);
      for (const el of controls) {
        const r = clipped(el);
        if (r.width <= 1 || r.height <= 1) continue;
        if (r.left < safeLeft - 0.5 || r.right > safeRight + 0.5) {
          out.push({
            art: 'Bedienelement unter dem Systemrand',
            detail: `${describe(el)} ${Math.round(r.left)}–${Math.round(r.right)}`,
          });
        }
        const inText = el.tagName === 'A' && globalThis.getComputedStyle(el).display === 'inline';
        if (!inText && r.width < 44 && r.height < 44) {
          out.push({
            art: 'Tippfläche unter 44 px (Hinweis)',
            detail: `${describe(el)} ${Math.round(r.width)} × ${Math.round(r.height)}`,
          });
        }
      }
      for (let i = 0; i < controls.length; i += 1) {
        for (let j = i + 1; j < controls.length; j += 1) {
          const [a, b] = [controls[i], controls[j]];
          if (a.contains(b) || b.contains(a)) continue;
          // Inhalt unter einer schwebenden Leiste oder einem Menü ist gewollt; gezählt wird nur,
          // was in derselben Schicht übereinanderliegt.
          if (layer(a) !== layer(b)) continue;
          const [ra, rb] = [clipped(a), clipped(b)];
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > 2 && h > 2) {
            out.push({
              art: 'Bedienelemente überlagern sich',
              detail: `${describe(a)} und ${describe(b)}`,
            });
          }
        }
      }
      const texts = [...scope.querySelectorAll('*')].filter(
        (el) =>
          visible(el) &&
          [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0),
      );
      for (const el of texts) {
        const s = globalThis.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (parseFloat(s.fontSize) < 11) {
          out.push({ art: 'Schrift unter 11 px', detail: `${describe(el)} ${s.fontSize}` });
        }
        if (r.left < safeLeft - 0.5 || r.right > safeRight + 0.5) {
          out.push({
            art: 'Text unter dem Systemrand',
            detail: `${describe(el)} ${Math.round(r.left)}–${Math.round(r.right)}`,
          });
        }
        const clipped =
          ['hidden', 'clip'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1;
        if (clipped && s.textOverflow !== 'ellipsis' && !el.closest('.sr-only')) {
          out.push({ art: 'Text abgeschnitten', detail: describe(el) });
        }
      }
      // Quadratische Symbole (Lucide, 24 × 24): schmaler als hoch heißt, ein enger Flex-Container
      // hat sie gestaucht (D-377: Minus und Plus der Pause verschwanden zugeklappt).
      for (const svg of scope.querySelectorAll('svg[viewBox="0 0 24 24"]')) {
        const r = svg.getBoundingClientRect();
        if (r.height < 8) continue;
        let shown = true;
        for (let n = svg; n; n = n.parentElement) {
          const st = globalThis.getComputedStyle(n);
          if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0)
            shown = false;
        }
        if (shown && r.width < r.height * 0.75) {
          const owner = svg.closest('a, button, [role=button]') ?? svg.parentElement ?? svg;
          out.push({
            art: 'Symbol gestaucht',
            detail: `${describe(owner)} ${Math.round(r.width)} × ${Math.round(r.height)}`,
          });
        }
      }
      return out;
    },
    { safeLeft: p.insets.left, safeRight: p.width - p.insets.right },
  );
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  for (const violation of axe.violations) {
    found.push({
      art: `Barrierefreiheit: ${violation.id}`,
      detail: violation.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 3)
        .join(', '),
    });
  }
  return found;
}

const results = [];

/** Ansicht in allen Haltungen: Haltung setzen, vorbereiten, prüfen, Bild. */
async function capture(page, key, title, prepare, poses = POSE_ORDER) {
  for (const pose of poses) {
    await setPose(page, pose);
    if (prepare) await prepare(pose);
    await page.waitForTimeout(350);
    const findings = await inspect(page, pose);
    const file = `${key}-${pose}.png`;
    await page.screenshot({ path: `${OUT}/${file}`, animations: 'disabled' });
    results.push({ key, title, pose, file, findings });
    console.log(`${OUT}/${file}`, findings.length ? `${findings.length} Befunde` : '');
  }
}

const top = (page) =>
  page.evaluate(() => globalThis.document.getElementById('seite')?.scrollTo(0, 0));

// ---- Erster Start (eigenes Profil): „Heute“ ohne Einträge und die Anmeldung ----
{
  const page = await newPage();
  await page.clock.setFixedTime(new Date('2026-10-22T08:15:00+02:00'));
  await capture(page, 'erster-start', 'Erster Start („Heute“ ohne Einträge)', async () => {
    await open(page, '/heute');
  });
  await capture(page, 'anmeldung', 'Anmeldung', async () => {
    await open(page, '/mehr/synchronisierung');
    await page.getByRole('dialog', { name: 'FORM' }).waitFor();
  });
  await page.context().close();
}

// ---- Mit Testdaten ----
const page = await newPage();
await page.clock.setFixedTime(new Date('2026-10-22T08:15:00+02:00'));
await setPose(page, 'zu');

// Ernährung: Ziel, zwei Schnelleinträge, Wasser.
await open(page, '/ernaehrung/ziele');
await page.getByLabel('Energie (kcal)').fill('2200');
await page.getByLabel('Eiweiß (g)').fill('140');
await page.getByLabel('Kohlenhydrate (g)').fill('230');
await page.getByLabel('Fett (g)').fill('75');
await page.getByRole('button', { name: 'Ziel speichern' }).click();
await page
  .getByText(/^2\D?200 kcal$/)
  .first()
  .waitFor();
for (const [slot, name, kcal, protein, carbs, fat] of [
  ['breakfast', 'Haferflocken mit Banane', 420, 14, 68, 9],
  ['lunch', 'Linsensuppe', 380, 21, 52, 8],
]) {
  await open(page, `/ernaehrung/hinzufuegen?mahlzeit=${slot}`);
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Bezeichnung (optional)').fill(name);
  await quick.getByLabel('Energie (kcal)').fill(String(kcal));
  await quick.getByLabel('Eiweiß (g, optional)').fill(String(protein));
  await quick.getByLabel('Kohlenhydrate (g, optional)').fill(String(carbs));
  await quick.getByLabel('Fett (g, optional)').fill(String(fat));
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByRole('heading', { level: 1, name: 'Ernährung' }).waitFor();
}
await open(page, '/heute');
const water = page.getByRole('region', { name: 'Wasser' });
await water.getByRole('button', { name: /250 ml hinzufügen/ }).click();
await water.getByRole('button', { name: /500 ml hinzufügen/ }).click();

// Körpergewicht: fünf Messungen über vier Wochen (für das Diagramm).
await open(page, '/fortschritt/gewicht');
for (const [weight, daysAgo] of [
  ['82,4', 28],
  ['81,9', 21],
  ['81,6', 14],
  ['81,1', 7],
  ['80,7', 1],
]) {
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill(weight);
  const when = new Date(Date.UTC(2026, 9, 22 - daysAgo, 5, 0));
  await sheet.getByLabel('Datum und Uhrzeit').fill(`${when.toISOString().slice(0, 10)}T07:00`);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await sheet.waitFor({ state: 'hidden' });
}

// Tagesaufgaben und Einkaufsliste.
await open(page, '/heute/aufgaben');
for (const name of ['10 Minuten gehen', 'Dehnen']) {
  await page.getByLabel('Name der Aufgabe').fill(name);
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await page.waitForTimeout(400);
}
await open(page, '/ernaehrung/einkaufsliste');
for (const text of ['500 g Hähnchenbrust', '6 Bananen', 'Haferflocken']) {
  const field = page.getByLabel('Was möchtest du einkaufen?');
  await field.fill(text);
  await field.press('Enter');
  await page.waitForTimeout(300);
}

// Programm aktivieren und ein Training: drei Sätze, die Pause läuft.
await open(page, '/training/vorlagen/compound_ab_4');
await page.getByRole('button', { name: 'Programm aktivieren' }).click();
await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
await open(page, '/heute');
await page.getByRole('button', { name: 'Training starten' }).click();
await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
const sessionUrl = new URL(page.url()).pathname;
async function completeSet(weight, reps) {
  const current = page.locator('li[aria-current="step"]');
  const field = current.getByLabel(/^Gewicht in kg, /);
  if ((await field.count()) > 0) await field.fill(String(weight));
  const repsField = current.getByLabel(/^Wiederholungen, /);
  if ((await repsField.count()) > 0) await repsField.fill(String(reps));
  await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
  await page.waitForTimeout(400);
}
await completeSet(60, 10);
await page.getByRole('button', { name: 'Pause überspringen' }).click();
await completeSet(80, 5);
await page.getByRole('button', { name: 'Pause überspringen' }).click();
await page.clock.setFixedTime(new Date('2026-10-22T08:31:24+02:00'));
await completeSet(100, 10);

// Aktives Training in allen Haltungen (die Pause läuft; Größenwechsel im laufenden Training).
await capture(page, 'training-aktiv', 'Aktiver Workout-Player mit Pause', async () => {
  await top(page);
});
await capture(
  page,
  'training-pause-gross',
  'Pause groß',
  async () => {
    await page.getByRole('button', { name: 'Pause groß anzeigen' }).click();
  },
  ['zu'],
);
await page.getByRole('button', { name: 'Pause klein anzeigen' }).click();
for (const pose of ['hoch', 'auf']) {
  await setPose(page, pose);
  await page.getByRole('button', { name: 'Pause groß anzeigen' }).click();
  await page.waitForTimeout(300);
  const findings = await inspect(page, pose);
  await page.screenshot({
    path: `${OUT}/training-pause-gross-${pose}.png`,
    animations: 'disabled',
  });
  results.push({
    key: 'training-pause-gross',
    title: 'Pause groß',
    pose,
    file: `training-pause-gross-${pose}.png`,
    findings,
  });
  await page.getByRole('button', { name: 'Pause klein anzeigen' }).click();
}

// Training beenden: Abschluss.
await setPose(page, 'zu');
await page.clock.setFixedTime(new Date('2026-10-22T09:03:00+02:00'));
await page.getByRole('button', { name: 'Beenden', exact: true }).click();
await page
  .getByRole('dialog', { name: 'Training beenden?' })
  .getByRole('button', { name: 'Training beenden' })
  .click();
await page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }).waitFor();
await capture(page, 'abschluss', 'Workout-Abschluss', async () => {
  await top(page);
});

// Seiten.
const SCREENS = [
  ['heute', 'Home („Heute“)', '/heute'],
  ['training', 'Trainingsübersicht', '/training'],
  ['programme', 'Programme und Vorlagen', '/training/programme'],
  ['programm-details', 'Programm-Details', '/training/vorlagen/compound_ab_4'],
  ['uebungen', 'Übungsbibliothek', '/uebungen'],
  ['verlauf', 'Trainingsverlauf (Kalender)', '/training/verlauf'],
  ['fortschritt', 'Fortschritt und Auswertung', '/fortschritt'],
  ['gewicht', 'Gewicht (Diagramm)', '/fortschritt/gewicht'],
  ['ernaehrung', 'Ernährung und Makros', '/ernaehrung'],
  ['hinzufuegen', 'Lebensmittel hinzufügen', '/ernaehrung/hinzufuegen?mahlzeit=snacks'],
  ['einkaufsliste', 'Küche: Einkaufsliste', '/ernaehrung/einkaufsliste'],
  ['wasser', 'Wasser-Tracker', '/ernaehrung/wasser'],
  ['aufgaben', 'Tagesaufgaben', '/heute/aufgaben'],
  ['mehr', 'Mehr', '/mehr'],
  ['einstellungen', 'Einstellungen', '/mehr/einstellungen'],
];
for (const [key, title, path] of SCREENS) {
  await capture(page, key, title, async () => {
    await open(page, path);
  });
}

// Diagramme und Kalender (Leitlinien Kapitel 8).
await capture(page, 'uebung-verlauf', 'Übungsverlauf (Diagramm)', async () => {
  await open(page, '/fortschritt');
  await page
    .getByRole('link', { name: /^Beinpresse/ })
    .first()
    .click();
  await page.getByRole('heading', { level: 1, name: 'Beinpresse' }).waitFor();
  await page.waitForTimeout(400);
});
await capture(page, 'aufgabe-kalender', 'Tagesaufgabe: Kalender und Verlauf', async () => {
  await open(page, '/heute/aufgaben');
  await page
    .getByRole('link', { name: /^10 Minuten gehen/ })
    .first()
    .click();
  await page.getByRole('heading', { level: 1, name: '10 Minuten gehen' }).waitFor();
  await page.getByRole('heading', { name: 'Kalender' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
});
await capture(page, 'wasser-verlauf', 'Wasser: Verlauf', async () => {
  await open(page, '/ernaehrung/wasser');
  await page.getByRole('heading', { name: 'Verlauf' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
});

// Tab-Leiste als Kreis (auf „Heute“ runtergescrollt).
await capture(page, 'tab-leiste-kreis', 'Tab-Leiste als Kreis', async () => {
  await open(page, '/heute');
  await page.evaluate(() => {
    globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'ArrowDown' }));
    globalThis.document.getElementById('seite')?.scrollBy(0, 500);
  });
  await page.locator('nav.tabbar.minimized').waitFor();
  await page.waitForTimeout(500);
});

// Blätter und Dialoge.
await capture(page, 'blatt-kueche', 'Blatt „Meine Küche“', async () => {
  await open(page, '/ernaehrung');
  await page.getByRole('button', { name: /Meine Küche/ }).click();
  await page.waitForTimeout(400);
});
await capture(page, 'blatt-schnelleintrag', 'Blatt „Schnelleintrag“', async () => {
  await open(page, '/ernaehrung/hinzufuegen?mahlzeit=dinner');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  await page.getByRole('dialog', { name: 'Schnelleintrag' }).waitFor();
});
await capture(page, 'scanner', 'Barcode-Scanner (ohne Kamera)', async () => {
  await open(page, '/ernaehrung/hinzufuegen?mahlzeit=dinner');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  await page.getByRole('dialog', { name: 'Barcode scannen' }).waitFor();
  await page.waitForTimeout(400);
});
await capture(page, 'dialog-verwerfen', 'Rückfrage „Training verwerfen?“', async () => {
  // Nächster Trainingstag von „Heute“, dann „Training verwerfen“ ganz unten.
  if (!(await page.getByRole('button', { name: 'Training verwerfen', exact: true }).count())) {
    await open(page, '/heute');
    await page.getByRole('button', { name: 'Training starten' }).click();
    await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
  }
  const discard = page.getByRole('dialog', { name: 'Training verwerfen?' });
  if (!(await discard.count())) {
    await page.getByRole('button', { name: 'Training verwerfen', exact: true }).click();
  }
  await page.getByRole('dialog', { name: 'Training verwerfen?' }).waitFor();
});
console.log(`laufende Einheit war ${sessionUrl}`);

await page.context().close();
await writeFile(`${OUT}/befunde.json`, `${JSON.stringify(results, null, 2)}\n`);

// ---- Übersichtsbild: Zeilen je Screen, Spalten je Haltung ----
const rows = [...new Map(results.map((r) => [r.key, r.title])).entries()];
const cell = (key, pose) => results.find((r) => r.key === key && r.pose === pose);
const scale = 0.32;
const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; background: #0c1219; color: #f2f3f4; font: 14px system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 16px 20px 4px; } p.lead { margin: 0 20px 12px; color: #9aa4af; }
  table { border-collapse: collapse; margin: 0 12px 16px; }
  th, td { padding: 6px 8px; vertical-align: top; text-align: left; }
  th { color: #9aa4af; font-weight: 500; }
  td.title { width: 150px; font-weight: 600; }
  img { display: block; border: 1px solid #2a3440; border-radius: 6px; }
  .count { color: #c8f169; font-size: 12px; margin-top: 4px; }
</style>
<h1>FORM auf dem iPhone Duo · zugeklappt, Zwischenmaß, aufgeklappt</h1>
<p class="lead">Browser-Fenster mit den Maßen des Duo (Chromium, sicherer Bereich nachgestellt), nicht das echte Gerät. Stand ${new Date().toLocaleDateString('de-AT', { timeZone: 'Europe/Vienna' })}.</p>
<table><tr><th></th>${POSE_ORDER.map((p) => `<th>${POSES[p].label} · ${POSES[p].width} × ${POSES[p].height}</th>`).join('')}</tr>
${rows
  .map(
    ([key, title]) =>
      `<tr><td class="title">${title}</td>${POSE_ORDER.map((pose) => {
        const r = cell(key, pose);
        if (!r) return '<td></td>';
        const p = POSES[pose];
        const n = r.findings.filter((f) => !f.art.endsWith('(Hinweis)')).length;
        return `<td><img src="${r.file}" width="${Math.round(p.width * scale)}" height="${Math.round(p.height * scale)}">${n ? `<div class="count">${n} Befunde</div>` : ''}</td>`;
      }).join('')}</tr>`,
  )
  .join('\n')}
</table>`;
// Die Seite liegt nur kurz neben den Bildern, damit sie sie relativ findet.
await writeFile(`${OUT}/uebersicht-duo.html`, html);
const sheet = await browser.newPage({
  viewport: { width: 1000, height: 800 },
  deviceScaleFactor: 2,
});
await sheet.goto(`file://${process.cwd()}/${OUT}/uebersicht-duo.html`);
await sheet.screenshot({ path: `${OUT}/uebersicht-duo.png`, fullPage: true });
await rm(`${OUT}/uebersicht-duo.html`);
console.log(`${OUT}/uebersicht-duo.png`);
await browser.close();

// Bilder auf 256 Farben (ohne Rastern): Flächen und Schrift bleiben scharf, die Dateien werden
// rund 60 % kleiner.
const QUANTIZE = `
import pathlib, sys
from PIL import Image
for path in sorted(pathlib.Path(sys.argv[1]).glob('*.png')):
    image = Image.open(path).convert('RGB')
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)
`;
try {
  execFileSync('python3', ['-c', QUANTIZE, OUT], { stdio: 'inherit' });
} catch {
  console.log('Pillow fehlt: Die Bilder bleiben unverkleinert.');
}
