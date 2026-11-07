#!/usr/bin/env node
/**
 * Rahmen der Animation im Player für alle elf Übungen von „Ganzkörper A/B“ (D-500): Tag A und
 * Tag B der Reihe nach, alle Sätze, gemessen am ersten Satz jeder Übung; dazu mit laufendem Timer
 * (Unterarmstütz), in der Pause nach dem Satz, die Höhe von „Jetzt“ und ob Name, Angaben oder
 * „Danach:“ gekürzt sind. Mit `RUNDEN=2` zuerst ein Durchgang ohne Messung, damit die Angaben die
 * Vorwerte enthalten. Fenster und sichere Bereiche wie am Gerät gemessen (D-393).
 *
 * Voraussetzung: `pnpm build` und `pnpm preview` (http://localhost:4173, sonst SCREENS_BASE_URL).
 *
 *   HALTUNGEN=duo-quer,duo-quer-streifen RUNDEN=1 node tools/player-rahmen-messen.mjs <ausgabe.json>
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ALLE = {
  iphone: { width: 390, height: 844, insets: { top: 47, bottom: 34 } },
  'iphone-quer': { width: 844, height: 390, insets: { left: 47, right: 47, bottom: 21 } },
  'duo-zu': { width: 382, height: 678, insets: { bottom: 34 } },
  'duo-hoch': { width: 669, height: 869, insets: { bottom: 34 } },
  'duo-quer': { width: 867, height: 669, insets: { bottom: 34 } },
  // Mit dem Streifen oben, der kommt, sobald die App läuft: das Fenster im Training.
  'duo-quer-streifen': { width: 867, height: 587, insets: { bottom: 34 } },
  'ipad-quer': { width: 1180, height: 820, insets: {} },
  computer: { width: 1440, height: 900, insets: {}, desktop: true },
};
const namen = (process.env.HALTUNGEN ?? Object.keys(ALLE).join(',')).split(',');
const RUNDEN = Number(process.env.RUNDEN ?? 1);
const BASIS = process.env.SCREENS_BASE_URL ?? 'http://localhost:4173';

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const aus = {};
for (const name of namen) {
  const h = ALLE[name];
  if (!h) throw new Error(`Haltung unbekannt: ${name}`);
  const context = await browser.newContext({
    viewport: { width: h.width, height: h.height },
    deviceScaleFactor: 2,
    isMobile: !h.desktop,
    hasTouch: !h.desktop,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'dark',
    baseURL: BASIS,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, right: 0, bottom: 0, left: 0, ...h.insets },
  });
  const open = async (path) => {
    await page.goto(path);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
  };
  const aktuell = page.locator('li[data-set-id][aria-current="step"]');
  const rahmen = () =>
    page.evaluate(() => {
      const r = [...globalThis.document.querySelectorAll('[data-demo-frame]')]
        .filter((f) => !f.closest('dialog'))
        .map((f) => f.getBoundingClientRect())
        .find((b) => b.width > 1);
      return r ? [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] : null;
    });
  const jetzt = () =>
    page.evaluate(() => {
      const now = globalThis.document.querySelector('.player-now');
      const teil = (selector) => {
        const el = now?.querySelector(selector);
        if (!el) return null;
        const zeile = parseFloat(globalThis.getComputedStyle(el).lineHeight);
        return {
          text: el.textContent.trim(),
          zeilen: Math.round(el.scrollHeight / zeile),
          gekuerzt: el.scrollHeight > el.clientHeight + 1,
        };
      };
      const danach = now?.querySelector('.player-next-line > span:last-child');
      return {
        hoehe: Math.round(now?.getBoundingClientRect().height ?? 0),
        name: teil('.player-now-name'),
        angaben: teil('.player-now-info'),
        danach: danach
          ? {
              text: danach.textContent.trim(),
              gekuerzt: danach.scrollWidth > danach.clientWidth + 1,
            }
          : null,
      };
    });
  /** Aktuellen Satz erledigen; mit `zeile` den Rahmen in der folgenden Pause messen. */
  const satzErledigen = async (zeile) => {
    for (const feld of await aktuell.locator('input').all()) {
      const label = (await feld.getAttribute('aria-label')) ?? '';
      await feld.fill(
        label.startsWith('Gewicht') ? '102,5' : label.startsWith('Wieder') ? '12' : '45',
      );
    }
    await aktuell.getByRole('button', { name: /^Satz erledigt, / }).click();
    const skip = page.getByRole('button', { name: 'Pause überspringen' }).first();
    const fertig = page.getByRole('region', { name: 'Alle Sätze erledigt' });
    await skip.or(fertig).first().waitFor();
    if (await skip.isVisible()) {
      if (zeile) {
        await page.waitForTimeout(500);
        zeile.pause = await rahmen();
      }
      await skip.click();
    }
  };
  const beenden = async () => {
    await page.getByRole('button', { name: 'Beenden', exact: true }).click();
    const fertig = page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' });
    const bestaetigen = page.getByRole('dialog').getByRole('button', { name: 'Training beenden' });
    await fertig.or(bestaetigen).first().waitFor();
    if (await bestaetigen.isVisible()) await bestaetigen.click();
    await fertig.waitFor();
  };

  await open('/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }).waitFor();
  const zeilen = [];
  for (let runde = 1; runde <= RUNDEN; runde += 1) {
    const messen = runde === RUNDEN;
    for (const tag of ['A', 'B']) {
      await open('/heute');
      await page.getByRole('button', { name: 'Training starten' }).click();
      await page.getByRole('button', { name: 'Beenden', exact: true }).waitFor();
      let letzte = '';
      while ((await aktuell.count()) > 0) {
        const uebung = (
          await page
            .getByRole('region', { name: 'Jetzt' })
            .locator('.player-now-name')
            .textContent()
        )?.trim();
        let zeile = null;
        if (messen && uebung !== letzte) {
          await page.waitForTimeout(500);
          zeile = { tag, uebung, rahmen: await rahmen(), jetzt: await jetzt() };
          const start = aktuell.getByRole('button', { name: /^Timer starten, / });
          if ((await start.count()) > 0) {
            await start.click();
            await page.locator('.player-now [role="timer"]').waitFor();
            await page.waitForTimeout(1200);
            zeile.timer = { rahmen: await rahmen(), jetzt: (await jetzt()).hoehe };
            await aktuell.getByRole('button', { name: /^Timer stoppen, / }).click();
          }
          zeilen.push(zeile);
        }
        letzte = uebung;
        await satzErledigen(zeile);
      }
      await beenden();
    }
  }
  aus[name] = zeilen;
  const groessen = [...new Set(zeilen.map((z) => (z.rahmen ? z.rahmen.join(' × ') : 'keiner')))];
  console.log(
    name,
    `Rahmen ${groessen.join(' | ')}`,
    `„Jetzt“ ${[...new Set(zeilen.map((z) => z.jetzt.hoehe))].join(' | ')} px`,
    `Pause ${[...new Set(zeilen.map((z) => (z.pause ? z.pause.join(' × ') : '–')))].join(' | ')}`,
  );
  await context.close();
}
writeFileSync(process.argv[2], JSON.stringify(aus, null, 2));
await browser.close();
