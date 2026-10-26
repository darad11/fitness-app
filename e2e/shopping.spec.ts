import type { Locator, Page } from '@playwright/test';
import { expect, openPage, pageOverflowX, test } from './fixtures';

test('Einkaufsliste: aus „Meine Küche“, eintragen, abhaken, neu laden, offline (D-287)', async ({
  page,
  context,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung');
  await page.getByRole('button', { name: /Meine Küche/ }).click();
  await page.getByRole('link', { name: /Einkaufsliste/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einkaufsliste' })).toBeVisible();

  const field = page.getByLabel('Was möchtest du einkaufen?');
  const boxes = page.getByRole('checkbox');
  for (const [index, text] of ['500 g Hähnchenbrust', '6 Bananen', 'Klopapier'].entries()) {
    await field.fill(text);
    await field.press('Enter');
    await expect(boxes).toHaveCount(index + 1);
    await expect(field).toHaveValue('');
  }
  await expect(page.getByText('500 g', { exact: true })).toBeVisible();
  await expect(page.getByText('6 Stück', { exact: true })).toBeVisible();

  await page.getByText('Bananen', { exact: true }).click();
  await expect(page.getByText('1 von 3 gekauft')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 von 3 gekauft')).toBeVisible();
  await expect(boxes).toHaveCount(2); // Gekaufte eingeklappt

  await page.getByText('Nach Kategorie', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Haushalt' })).toContainText('Klopapier');

  // Offline: erst wenn der Service Worker die Seite steuert (wie resilience.spec.ts).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await expect(boxes).toHaveCount(2);
  await context.setOffline(true);
  await field.fill('Reis 1 kg');
  await field.press('Enter');
  await expect(boxes).toHaveCount(3);
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText('1 von 4 gekauft')).toBeVisible();

  // Nichts davon zählt als gegessen.
  await openPage(page, '/ernaehrung');
  await expect(page.getByText('0 kcal').first()).toBeVisible();
});

test('Einkaufsliste: kleiner Bildschirm ohne Überlauf (D-287)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openPage(page, '/ernaehrung/einkaufsliste');
  const field = page.getByLabel('Was möchtest du einkaufen?');
  await field.fill('Eine ziemlich lange Bezeichnung für einen Artikel 1 Packung');
  await field.press('Enter');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('button', { name: /bearbeiten$/ }).click();
  await expect(page.getByLabel('Menge')).toBeVisible();
  expect(await pageOverflowX(page), 'waagrechter Überlauf').toBeLessThanOrEqual(0);
});

test('„Heute“: runde Knöpfe mittig in „Ernährung heute“, Einkaufswagen öffnet die Einkaufsliste', async ({
  page,
}) => {
  await openPage(page, '/heute');
  for (const name of ['Barcode scannen', 'Zur Ernährung', 'Einkaufsliste']) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    // Rund und klein: 48 × 48 px, das Symbol in voller Größe.
    expect(box?.width).toBe(48);
    expect(box?.height).toBe(48);
    expect((await link.locator('svg').boundingBox())?.width).toBe(20);
  }
  // Mittig: links und rechts gleich viel Platz in der Zeile.
  const row = await page.getByRole('link', { name: 'Barcode scannen' }).locator('..').boundingBox();
  const first = await page.getByRole('link', { name: 'Barcode scannen' }).boundingBox();
  const last = await page.getByRole('link', { name: 'Einkaufsliste', exact: true }).boundingBox();
  if (!row || !first || !last) throw new Error('Knöpfe nicht gefunden');
  const left = first.x - row.x;
  const right = row.x + row.width - (last.x + last.width);
  expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  await page.getByRole('link', { name: 'Einkaufsliste', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einkaufsliste' })).toBeVisible();
});

const GROCERIES = [
  'Milch',
  'Brot',
  'Äpfel',
  'Butter',
  'Käse',
  'Joghurt',
  'Reis',
  'Nudeln',
  'Kaffee',
  'Tee',
  'Zucker',
  'Mehl',
  'Eier',
  'Salz',
  'Pfeffer',
  'Honig',
  'Senf',
  'Essig',
  'Karotten',
  'Zwiebeln',
  'Knoblauch',
  'Paprika',
  'Gurke',
  'Topfen',
];

/** Artikel nacheinander eintragen. */
async function addItems(page: Page, names: readonly string[]) {
  const field = page.getByLabel('Was möchtest du einkaufen?');
  for (const [index, name] of names.entries()) {
    await field.fill(name);
    await field.press('Enter');
    await expect(page.locator('[data-swipe-row]')).toHaveCount(index + 1);
  }
}

const swipeRow = (page: Page, name: string) =>
  page.locator('[data-swipe-row]').filter({ has: page.getByText(name, { exact: true }) });

/** Mitschrift kürzen: Bewegungen hintereinander als eine Angabe mit Anzahl, erster und letzter. */
function compactLog(log: readonly string[]): string {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length > 2) out.push(`${String(run.length)} Bewegungen: ${run[0]} … ${run.at(-1)}`);
    else out.push(...run);
    run = [];
  };
  for (const entry of log) {
    if (/^(pointer|mouse)move /.test(entry)) {
      run.push(entry);
      continue;
    }
    flush();
    out.push(entry);
  }
  flush();
  return out.join(' | ');
}

/** Wisch mit der Maus (Zeiger-Ereignisse) von drei Vierteln der Zeilenbreite aus. */
async function mouseSwipe(page: Page, row: Locator, dx: number, dy = 0) {
  const box = await row.boundingBox();
  if (!box) throw new Error('Zeile nicht sichtbar');
  const x = box.x + box.width * 0.75;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
}

test('Einkaufsliste: Wisch nach links löscht nur diesen Artikel, mit Rückgängig; kurz, schräg und senkrecht nicht (D-360)', async ({
  page,
}) => {
  await openPage(page, '/ernaehrung/einkaufsliste');
  await addItems(page, ['Milch', 'Brot', 'Äpfel']);
  const milk = swipeRow(page, 'Milch');
  // Senkrechtes Scrollen bleibt beim Browser.
  await expect(milk).toHaveCSS('touch-action', 'pan-y');
  const width = (await milk.boundingBox())?.width ?? 0;

  await mouseSwipe(page, milk, -60); // zu kurz
  await mouseSwipe(page, milk, -150, 100); // schräg
  await mouseSwipe(page, milk, 0, 120); // senkrecht
  await mouseSwipe(page, milk, 120); // nach rechts
  await expect(page.locator('[data-swipe-row]')).toHaveCount(3);
  await expect(page.getByText(/gelöscht/)).toHaveCount(0);
  // Keine Geste hat abgehakt.
  await expect(page.getByText('0 von 3 gekauft')).toBeVisible();

  // Zeiger- und Maus-Ereignisse beim Löschwisch mitschreiben: Schlägt er fehl, steht in der
  // Meldung, was ankam (WebKit, Nachtrag zu D-384).
  await page.evaluate(() => {
    const log: string[] = [];
    (window as unknown as { wischLog: string[] }).wischLog = log;
    const frame = document.getElementById('seite');
    const types = [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
      'gotpointercapture',
      'lostpointercapture',
      'mousedown',
      'mousemove',
      'mouseup',
      'click',
      'dragstart',
      'selectstart',
      'scroll',
    ];
    for (const type of types) {
      window.addEventListener(
        type,
        (event) => {
          const target = event.target instanceof Element ? event.target : null;
          const where = target?.closest('[data-swipe-row]') ? 'Zeile' : (target?.tagName ?? '?');
          const detail =
            event instanceof MouseEvent
              ? `x${String(Math.round(event.clientX))} b${String(event.buttons)}`
              : `top ${String(frame?.scrollTop ?? 0)}`;
          log.push(`${type} ${where} ${detail}`);
        },
        { capture: true },
      );
    }
  });
  await mouseSwipe(page, milk, -Math.round(width * 0.6));
  const wischLog = await page.evaluate(
    () => (window as unknown as { wischLog: string[] }).wischLog,
  );
  await expect(page.getByText('„Milch“ gelöscht'), compactLog(wischLog)).toBeVisible();
  await expect(page.locator('[data-swipe-row]')).toHaveCount(2);
  await expect(swipeRow(page, 'Brot')).toBeVisible();
  await expect(swipeRow(page, 'Äpfel')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(swipeRow(page, 'Milch')).toBeVisible();
  await expect(page.locator('[data-swipe-row]')).toHaveCount(3);

  // Tastatur und Screenreader: der bisherige Weg über „Bearbeiten“.
  await page.getByRole('button', { name: 'Brot bearbeiten' }).click();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByText('„Brot“ gelöscht')).toBeVisible();
});

test('Einkaufsliste: echter Touch-Wisch löscht, senkrechtes Wischen scrollt die Seite (D-360)', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-mobile',
    'Touch-Gesten über das Chrome-Protokoll gibt es nur in Chromium mit Touch',
  );
  test.slow();
  await openPage(page, '/ernaehrung/einkaufsliste');
  // Namen ohne Zahl am Ende: „Artikel 1“ wäre „Artikel“ mit der Menge 1 (Doppelte).
  await addItems(page, GROCERIES);
  await page.getByRole('button', { name: 'Fertig' }).click();
  const cdp = await page.context().newCDPSession(page);
  const touch = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let step = 1; step <= 15; step++) {
      const point = {
        x: from.x + ((to.x - from.x) * step) / 15,
        y: from.y + ((to.y - from.y) * step) / 15,
      };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const centre = async (row: Locator) => {
    await row.scrollIntoViewIfNeeded();
    const box = await row.boundingBox();
    if (!box) throw new Error('Zeile nicht sichtbar');
    return { x: box.x + box.width * 0.75, y: box.y + box.height / 2, width: box.width };
  };

  // Senkrecht über eine Zeile wischen: Die Seite scrollt, nichts wird gelöscht.
  const third = await centre(swipeRow(page, 'Äpfel'));
  // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
  const scrollTop = () => page.evaluate(() => document.getElementById('seite')?.scrollTop ?? 0);
  const before = await scrollTop();
  await touch({ x: third.x, y: third.y }, { x: third.x, y: third.y - 250 });
  await expect.poll(scrollTop).toBeGreaterThan(before + 50);
  await expect(page.locator('[data-swipe-row]')).toHaveCount(24);
  await expect(page.getByText(/gelöscht/)).toHaveCount(0);

  // Waagrecht nach links: nur dieser Artikel ist weg.
  const target = await centre(swipeRow(page, 'Kaffee'));
  await touch({ x: target.x, y: target.y }, { x: target.x - target.width * 0.6, y: target.y + 4 });
  await expect(page.getByText('„Kaffee“ gelöscht')).toBeVisible();
  await expect(page.locator('[data-swipe-row]')).toHaveCount(23);
  await expect(swipeRow(page, 'Nudeln')).toBeVisible();
  await expect(swipeRow(page, 'Tee')).toBeVisible();
});
