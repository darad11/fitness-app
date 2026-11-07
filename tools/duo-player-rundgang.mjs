#!/usr/bin/env node
/**
 * Rundgang durch den Workout-Player am iPhone Duo (D-496): je Haltung Training „Ganzkörper A/B“
 * starten, scrollen (Mitte, Ende), Satz erledigen, Pause klein und groß, Übungsinfo, Übung
 * hinzufügen (öffnen), nächste Übung, Training beenden mit Rückfrage und Zusammenfassung. Zu jedem
 * Schritt ein Bild und automatische Prüfungen: waagrechter Überlauf, Bedienelemente außerhalb des
 * Fensters, abgeschnittener Text ohne Auslassungspunkte, rechte Spalte hinter der Fußleiste oder
 * oben aus dem Bild, Seitenverhältnis des Rahmens der Animation, Mitte von großer Pause und Dialogen.
 *
 * Fenster wie am Gerät gemessen (D-393), Bildschirm hochkant 466 × 678 und Ausrichtung über das
 * Chrome-Protokoll; Bilder ebenfalls darüber, weil `page.screenshot` den nachgestellten Bildschirm
 * zurücksetzt (dann stünde die große Pause wieder mittig im Fenster).
 *
 * Voraussetzung: `pnpm build` und `pnpm preview` (http://localhost:4173, sonst SCREENS_BASE_URL).
 *
 *   node tools/duo-player-rundgang.mjs <ausgabeordner> [duo-quer duo-quer-oben duo-hoch duo-zu iphone]
 *
 * Ergebnis: `<ordner>/<haltung>-<nr>-<schritt>.png` und `<ordner>/bericht.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const NUR = process.argv.slice(3);
mkdirSync(OUT, { recursive: true });

// Gemessene Fenster (D-393); iOS meldet den Bildschirm hochkant 466 × 678. iPhone ohne Streifen.
const HALTUNGEN = {
  'duo-quer': { width: 867, height: 669, screen: [466, 678], quer: true, insets: { bottom: 34 } },
  'duo-quer-oben': {
    width: 867,
    height: 587,
    screen: [466, 678],
    quer: true,
    insets: { bottom: 34 },
  },
  'duo-hoch': { width: 669, height: 869, screen: [466, 678], quer: false, insets: { bottom: 34 } },
  'duo-zu': { width: 382, height: 678, screen: [466, 678], quer: false, insets: { bottom: 34 } },
  iphone: {
    width: 390,
    height: 844,
    screen: [390, 844],
    quer: false,
    insets: { top: 47, bottom: 34 },
  },
};

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const bericht = {};

/** Automatische Prüfungen auf der aktuellen Ansicht. */
async function pruefen(page) {
  return page.evaluate(() => {
    const funde = [];
    const W = globalThis.innerWidth,
      H = globalThis.innerHeight;
    const frame = globalThis.document.getElementById('seite');
    if (frame && frame.scrollWidth - frame.clientWidth > 1)
      funde.push(`waagrechter Überlauf ${frame.scrollWidth - frame.clientWidth} px`);
    const foot = globalThis.document.querySelector('.player-foot');
    const footTop = foot ? foot.getBoundingClientRect().top : H;
    const sichtbar = (el) => {
      const s = globalThis.getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0)
        return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    // Bedienelemente außerhalb des Fensters oder unter der Fußleiste (ohne die Fußleiste selbst).
    for (const el of globalThis.document.querySelectorAll(
      'button, a[href], input, [role="button"]',
    )) {
      if (!sichtbar(el) || el.closest('.sr-only') || el.getBoundingClientRect().width <= 1)
        continue;
      const r = el.getBoundingClientRect();
      if (r.left < -0.5 || r.right > W + 0.5)
        funde.push(
          `außerhalb waagrecht: ${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40)} (${Math.round(r.left)}–${Math.round(r.right)})`,
        );
    }
    // Abgeschnittener Text ohne Auslassungspunkte.
    for (const el of globalThis.document.querySelectorAll(
      'p, span, h1, h2, h3, li, button, label',
    )) {
      if (
        !sichtbar(el) ||
        el.children.length > 2 ||
        el.getBoundingClientRect().width <= 1 ||
        el.closest('.sr-only')
      )
        continue;
      const s = globalThis.getComputedStyle(el);
      if (
        el.scrollWidth - el.clientWidth > 1 &&
        s.overflow !== 'visible' &&
        s.textOverflow !== 'ellipsis' &&
        (s.overflowX === 'hidden' || s.overflowX === 'clip')
      ) {
        funde.push(`Text abgeschnitten: ${(el.textContent || '').trim().slice(0, 50)}`);
      }
    }
    // Elemente der rechten Spalte hinter der Fußleiste oder über dem oberen Rand.
    const side = globalThis.document.querySelector('.player-side');
    if (side && globalThis.getComputedStyle(side).display !== 'contents') {
      for (const el of side.querySelectorAll(':scope > *')) {
        if (!sichtbar(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom > footTop + 0.5)
          funde.push(
            `rechte Spalte hinter der Fußleiste: ${el.className.split(' ')[0]} bis ${Math.round(r.bottom)} (Fußleiste ${Math.round(footTop)})`,
          );
        if (r.top < -0.5)
          funde.push(
            `rechte Spalte oben aus dem Bild: ${el.className.split(' ')[0]} ab ${Math.round(r.top)}`,
          );
      }
    }
    // Rahmen der Animation: Seitenverhältnis.
    for (const f of globalThis.document.querySelectorAll('[data-demo-frame]')) {
      const r = f.getBoundingClientRect();
      if (r.height > 0 && Math.abs(r.width / r.height - 4 / 3) > 0.01)
        funde.push(`Rahmen der Animation ${Math.round(r.width)} × ${Math.round(r.height)}`);
    }
    const big = globalThis.document.querySelector('.rest-big [role="timer"]');
    if (big) {
      const r = big.getBoundingClientRect();
      funde.push(`Mitte der großen Pause x ${((r.left + r.right) / 2).toFixed(1)}`);
    }
    const dlg = globalThis.document.querySelector('dialog[open]');
    if (dlg) {
      const r = dlg.getBoundingClientRect();
      funde.push(`Mitte des Dialogs x ${((r.left + r.right) / 2).toFixed(1)}`);
    }
    return funde;
  });
}

// Bilder über das Chrome-Protokoll: `page.screenshot` setzt den nachgestellten Bildschirm zurück.
const sitzungen = new WeakMap();
async function bild(page, name, schritte, schritt) {
  await page.waitForTimeout(500);
  const datei = `${name}-${String(schritte.length + 1).padStart(2, '0')}-${schritt}.png`;
  const funde = await pruefen(page);
  const cap = await sitzungen.get(page).send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${datei}`, Buffer.from(cap.data, 'base64'));
  schritte.push({ schritt, datei, funde });
  console.log(name, schritt, funde.length ? funde.join(' | ') : 'ok');
}

for (const [name, h] of Object.entries(HALTUNGEN)) {
  if (NUR.length && !NUR.includes(name)) continue;
  const context = await browser.newContext({
    viewport: { width: h.width, height: h.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    baseURL: process.env.SCREENS_BASE_URL ?? 'http://localhost:4173',
  });
  const page = await context.newPage();
  const fehler = [];
  page.on('console', (m) => {
    if (m.type() === 'error') fehler.push(m.text());
  });
  page.on('pageerror', (e) => fehler.push(e.message));
  const cdp = await context.newCDPSession(page);
  sitzungen.set(page, cdp);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, right: 0, bottom: 0, left: 0, ...h.insets },
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: h.width,
    height: h.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: h.screen[0],
    screenHeight: h.screen[1],
    screenOrientation: h.quer
      ? { type: 'landscapePrimary', angle: 90 }
      : { type: 'portraitPrimary', angle: 0 },
  });
  const schritte = [];
  const open = async (path) => {
    await page.goto(path);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
  };
  try {
    await open('/training/vorlagen/compound_ab_4');
    await page.getByRole('button', { name: 'Programm aktivieren' }).click();
    await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
    await open('/heute');
    await page.getByRole('button', { name: 'Training starten' }).click();
    await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
    await page.waitForTimeout(1500);
    await bild(page, name, schritte, 'start');
    // Scrollen: Mitte und Ende.
    for (const [teil, f] of [
      ['scroll-mitte', 0.5],
      ['scroll-ende', 1],
    ]) {
      await page.evaluate((x) => {
        const s = globalThis.document.getElementById('seite');
        s.scrollTo(0, (s.scrollHeight - s.clientHeight) * x);
      }, f);
      await bild(page, name, schritte, teil);
    }
    await page.evaluate(() => globalThis.document.getElementById('seite').scrollTo(0, 0));
    // Satz erledigen: Pause klein.
    const satz = page.locator('li[aria-current="step"]');
    await satz.getByLabel(/^Gewicht in kg, /).fill('60');
    await satz.getByLabel(/^Wiederholungen, /).fill('10');
    await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
    await page.getByRole('region', { name: 'Pause' }).waitFor();
    await bild(page, name, schritte, 'pause-klein');
    await page.getByRole('button', { name: 'Pause groß anzeigen' }).click();
    await bild(page, name, schritte, 'pause-gross');
    await page.getByRole('button', { name: 'Pause klein anzeigen' }).click();
    await bild(page, name, schritte, 'pause-zurueck');
    // Übungsinfo über das Bild der Übung.
    await page.getByRole('button', { name: 'Übungsinfo, Beinpresse' }).first().click();
    await page.getByRole('dialog', { name: 'Beinpresse' }).waitFor();
    await page.waitForTimeout(800);
    await bild(page, name, schritte, 'uebungsinfo');
    await page
      .getByRole('dialog', { name: 'Beinpresse' })
      .getByRole('button', { name: 'Schließen' })
      .click();
    // Übung hinzufügen: Auswahl öffnen und schließen.
    await page.getByRole('button', { name: 'Übung hinzufügen' }).first().click();
    await page.waitForTimeout(800);
    await bild(page, name, schritte, 'uebung-hinzufuegen');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    // Pause überspringen und die übrigen Sätze der ersten Übung erledigen: Wechsel zur nächsten.
    for (let i = 0; i < 8; i += 1) {
      const skip = page.getByRole('button', { name: 'Pause überspringen' });
      if (await skip.count()) await skip.first().click();
      const aktuell = page.locator('li[aria-current="step"]');
      const name1 = await page
        .locator('.player-now p.text-2xl')
        .first()
        .textContent()
        .catch(() => null);
      if (name1 && !name1.includes('Beinpresse')) break;
      const kg = aktuell.getByLabel(/^Gewicht in kg, /);
      if ((await kg.count()) === 0) break;
      await kg.fill('80');
      await aktuell.getByLabel(/^Wiederholungen, /).fill('8');
      await page.getByRole('button', { name: 'Satz erledigt', exact: true }).click();
      await page.waitForTimeout(300);
    }
    const skip = page.getByRole('button', { name: 'Pause überspringen' });
    if (await skip.count()) await skip.first().click();
    await bild(page, name, schritte, 'naechste-uebung');
    // Training beenden: Rückfrage, dann Zusammenfassung.
    await page.getByRole('button', { name: 'Beenden', exact: true }).click();
    await page.waitForTimeout(500);
    await bild(page, name, schritte, 'beenden-rueckfrage');
    const dialog = page.getByRole('dialog').last();
    const knoepfe = await dialog.getByRole('button').allTextContents();
    console.log(name, 'Rückfrage', knoepfe.join(' / '));
    await dialog
      .getByRole('button', { name: /beenden/i })
      .last()
      .click();
    await page.waitForTimeout(1500);
    await bild(page, name, schritte, 'zusammenfassung');
  } catch (error) {
    console.log(name, 'ABBRUCH', String(error).slice(0, 300));
    writeFileSync(
      `${OUT}/${name}-abbruch.png`,
      Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    );
    schritte.push({
      schritt: 'abbruch',
      datei: `${name}-abbruch.png`,
      funde: [String(error).slice(0, 300)],
    });
  }
  bericht[name] = { schritte, konsolenfehler: fehler };
  await context.close();
}
writeFileSync(`${OUT}/bericht.json`, JSON.stringify(bericht, null, 2));
await browser.close();
