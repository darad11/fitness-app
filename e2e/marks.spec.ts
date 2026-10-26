import type { Locator, Page } from '@playwright/test';
import { APP_PAGES, expect, openPage, test } from './fixtures';

/** Kopfzeile, Icons und Markierungen (F5, D-325; F6, D-334): Regler-Symbol, Markierungen, Seitenende. */

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b).not.toBeNull();
  return b ?? { x: 0, y: 0, width: 0, height: 0 };
}

async function addTask(page: Page, name: string) {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill(name);
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(page.getByRole('link', { name: `${name} bearbeiten` })).toBeVisible();
}

test('„Wochenziel“ zeigt dasselbe Regler-Symbol wie „Tagesaufgaben“, an derselben Stelle', async ({
  page,
}) => {
  await openPage(page, '/mehr/profil');
  const weekly = page.getByRole('region', { name: 'Wochenziel' });
  await weekly.getByLabel('Trainings pro Woche').selectOption('4');
  await weekly.getByRole('button', { name: 'Festlegen' }).click();
  await expect(weekly.getByText('Aktuell: 4 Trainings pro Woche')).toBeVisible();
  await openPage(page, '/heute');
  const cards = [
    {
      card: page.getByRole('region', { name: 'Tagesaufgaben' }),
      link: page.getByRole('link', { name: 'Tagesaufgaben verwalten' }),
    },
    {
      card: page.getByRole('region', { name: 'Wochenziel' }),
      link: page.getByRole('link', { name: 'Wochenziel ändern' }),
    },
  ];
  const measured = [];
  for (const { card, link } of cards) {
    const icon = link.locator('svg.lucide-settings-2');
    await expect(icon).toHaveCount(1);
    const [c, l, i] = [await box(card), await box(link), await box(icon)];
    measured.push({
      link: [Math.round(l.width), Math.round(l.height)],
      icon: [Math.round(i.width), Math.round(i.height)],
      stroke: await icon.getAttribute('stroke-width'),
      color: await link.evaluate((element) => getComputedStyle(element).color),
      right: Math.round(c.x + c.width - (i.x + i.width)),
      top: Math.round(i.y - c.y),
    });
  }
  expect(measured[0]?.link).toEqual([44, 44]);
  expect(measured[0]?.icon).toEqual([20, 20]);
  expect(measured[1]).toEqual(measured[0]);
  await cards[1]?.link.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Profil und Ziele' })).toBeVisible();
});

/** Drei Tage: Lesen an allen erledigt, Dehnen am 21. und 22. (F6: Verlauf, Je Aufgabe, Kalender). */
async function threeDays(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-10-20T09:00:00+02:00') });
  await addTask(page, 'Lesen');
  await addTask(page, 'Dehnen');
  for (const day of ['2026-10-20', '2026-10-21', '2026-10-22']) {
    await page.clock.setSystemTime(new Date(`${day}T09:00:00+02:00`));
    await openPage(page, '/heute');
    const card = page.getByRole('region', { name: 'Tagesaufgaben' });
    const names = day === '2026-10-20' ? ['Lesen'] : ['Lesen', 'Dehnen'];
    for (const name of names) {
      const check = card.getByRole('checkbox', { name: `${name} abhaken` });
      await check.click();
      await expect(check).toBeChecked();
    }
  }
}

const radius = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).borderRadius);
const ring = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).boxShadow);

/** Mitte einer Box. */
const center = (b: { x: number; y: number; width: number; height: number }) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

test('Markierungen (F6): Kalender 16 px in sieben Spalten unter den Wochentagen, Haken 60 %, Legende 14 px', async ({
  page,
}) => {
  await threeDays(page);
  await openPage(page, '/heute/aufgaben');
  await page.getByRole('link', { name: 'Lesen – Auswertung öffnen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lesen' })).toBeVisible();
  const calendar = page.getByRole('list', { name: /Kalender/ });
  const cells = calendar.locator('li[title] > span[aria-hidden="true"]');
  await expect(cells).toHaveCount(3);
  const boxes = [];
  for (let i = 0; i < 3; i += 1) {
    const cell = await box(cells.nth(i));
    boxes.push(cell);
    expect([cell.width, cell.height]).toEqual([16, 16]);
    // Haken 60 % der Markierung, Radius wie die Kachel (wächst mit der Größe).
    const check = await box(cells.nth(i).locator('svg'));
    expect(Math.abs(check.width - 9.6)).toBeLessThanOrEqual(0.5);
    expect(await radius(cells.nth(i))).toBe('22.5%');
  }
  // Kompakte Spalten von 28 px, jede Markierung unter ihrem Wochentag (20.10.2026 ist ein Dienstag).
  expect(center(boxes[1] ?? boxes[0]!).x - center(boxes[0]!).x).toBeCloseTo(28, 1);
  const weekdays = calendar.locator('xpath=preceding-sibling::ul[1]/li');
  await expect(weekdays).toHaveText(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  for (let i = 0; i < 3; i += 1) {
    const label = center(await box(weekdays.nth(i + 1)));
    expect(Math.abs(label.x - center(boxes[i]!).x), 'unter dem Wochentag').toBeLessThanOrEqual(1);
  }
  // Nur heute (22.10.) mit Rahmen: 1 px Lime mit 1 px Abstand.
  expect(await ring(cells.nth(0))).toBe('none');
  expect(await ring(cells.nth(1))).toBe('none');
  const today = await ring(cells.nth(2));
  expect(today).toContain('rgb(199, 255, 70) 0px 0px 0px 2px');
  expect(today).not.toContain('3px');
  // Legende: Basisgröße 14 px, mittig zur Zeile, auch für „heute“.
  const legend = calendar.locator('xpath=following-sibling::ul[1]');
  await expect(legend.locator('li')).toHaveText([
    'erledigt',
    'nicht erledigt',
    'nicht fällig',
    'kein Eintrag',
    'heute',
  ]);
  for (const item of await legend.locator('li').all()) {
    const swatch = await box(item.locator('span[aria-hidden="true"]'));
    expect([swatch.width, swatch.height]).toEqual([14, 14]);
    expect(Math.abs(center(swatch).y - center(await box(item)).y)).toBeLessThanOrEqual(1);
  }
  expect(await ring(legend.locator('li').last().locator('span'))).toContain('rgb(199, 255, 70)');
});

test('Markierungen (F6): Je Aufgabe 16 px, Verlauf mit 14 px unter dem Balken statt grüner Balken', async ({
  page,
}) => {
  await threeDays(page);
  await openPage(page, '/heute/aufgaben');
  // Je Aufgabe: eine Zeile je Aufgabe, Markierungen 16 px mit Haken, Legende 14 px.
  const perTask = page.getByRole('region', { name: 'Je Aufgabe' });
  const table = perTask.getByRole('table');
  const done = table.locator('td span[aria-hidden="true"].bg-success');
  await expect(done).toHaveCount(5);
  for (const mark of await done.all()) {
    const b = await box(mark);
    expect([b.width, b.height]).toEqual([16, 16]);
    expect(await radius(mark)).toBe('22.5%');
    expect(Math.abs((await box(mark.locator('svg'))).width - 9.6)).toBeLessThanOrEqual(0.5);
  }
  const rowHeight = (await box(table.locator('tbody tr').first())).height;
  expect(rowHeight, 'Zeile nicht höher als der Name').toBeLessThanOrEqual(26);
  for (const swatch of await perTask.locator('ul[aria-hidden="true"] li > span').all()) {
    const b = await box(swatch);
    expect([b.width, b.height]).toEqual([14, 14]);
  }
  // Verlauf: alle Balken in Lime; „alles erledigt“ (21. und 22.10.) als Markierung 14 px mittig
  // unter dem Balken des Tages, dazu dieselbe Markierung in der Legende.
  const history = page.getByRole('region', { name: 'Verlauf' });
  const success = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
  );
  const bars = history.locator('.recharts-bar').first().locator('path.recharts-rectangle');
  await expect(bars).toHaveCount(3);
  for (const bar of await bars.all()) {
    expect(await bar.getAttribute('fill')).toBe('var(--data-1)');
  }
  expect(success).not.toBe('');
  const row = history.locator('[data-complete-row] > span');
  await expect(row).toHaveCount(3);
  const marks = [];
  for (let i = 0; i < 3; i += 1) {
    marks.push(await row.nth(i).locator('span[aria-hidden="true"]').count());
  }
  expect(marks, 'am 20. nur Lesen erledigt, am 21. und 22. beide').toEqual([0, 1, 1]);
  for (const i of [1, 2]) {
    const mark = await box(row.nth(i).locator('span[aria-hidden="true"]'));
    expect([mark.width, mark.height]).toEqual([14, 14]);
    const bar = await box(bars.nth(i));
    expect(Math.abs(center(mark).x - center(bar).x), 'mittig unter dem Balken').toBeLessThanOrEqual(
      1.5,
    );
  }
  const hint = history.getByText('alles erledigt.');
  const hintMark = await box(hint.locator('span[aria-hidden="true"]'));
  expect([hintMark.width, hintMark.height]).toEqual([14, 14]);
});

test('Abhakfeld in Listen (F6): Quadrat 20 px, Haken 60 %, Tippfläche 44 px, mittig zur Zeile', async ({
  page,
}) => {
  await addTask(page, 'Dehnen');
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  const check = card.getByRole('checkbox', { name: 'Dehnen abhaken' });
  const mark = check.locator('xpath=following-sibling::span[1]');
  const row = card
    .locator('li')
    .filter({ has: page.getByRole('checkbox', { name: 'Dehnen abhaken' }) });
  for (const checked of [false, true]) {
    const [tap, m, r] = [await box(check), await box(mark), await box(row)];
    expect([m.width, m.height]).toEqual([20, 20]);
    expect(await radius(mark)).toBe('22.5%');
    expect([tap.width, tap.height], 'Tippfläche').toEqual([44, 44]);
    expect(r.height, 'Zeile mit Rhythmus').toBeGreaterThanOrEqual(56);
    expect(Math.abs(center(m).y - center(r).y), 'mittig zur Zeile').toBeLessThanOrEqual(1);
    if (!checked) {
      await check.click();
      await expect(check).toBeChecked();
      expect(Math.abs((await box(mark.locator('svg'))).width - 12)).toBeLessThanOrEqual(0.5);
    }
  }

  await openPage(page, '/ernaehrung/einkaufsliste');
  const field = page.getByLabel('Was möchtest du einkaufen?');
  await field.fill('Haferflocken');
  await field.press('Enter');
  const item = page.locator('label', { hasText: 'Haferflocken' });
  await expect(item).toBeVisible();
  const itemMark = item.locator('span[aria-hidden="true"]').first();
  const b = await box(itemMark);
  expect([b.width, b.height]).toEqual([20, 20]);
  expect(await radius(itemMark)).toBe('22.5%');
  expect((await box(item)).height).toBeGreaterThanOrEqual(44);
});

/**
 * Tiefster sichtbarer Inhalt in `main` (Text, Knöpfe, Felder) im Viewport, mit Beschreibung, und,
 * falls offen, der modale Dialog; mit `toEnd` rollt sie vorher ans Seitenende. Alles in einem
 * Schritt: Öffnet sich die Anmeldung erst nach dem Laden (`/mehr/synchronisierung`, wackelte in
 * WebKit) oder kommt eine nachgeladene Karte zwischen Prüfen und Messen dazu (Wasser auf
 * `/ernaehrung`, wackelte in Chromium), sähe eine spätere Messung eine andere Seite (D-344).
 */
function measure(page: Page, toEnd: boolean) {
  return page.evaluate((scroll) => {
    // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
    const scroller = document.getElementById('seite') ?? document.documentElement;
    const height = scroller.scrollHeight;
    const end = height - scroller.clientHeight;
    if (scroll && scroller.scrollTop < end - 1) scroller.scrollTo(0, end);
    const atEnd = scroller.scrollTop >= end - 1;
    const dialog = document.querySelector('dialog:modal');
    const rect = dialog?.getBoundingClientRect();
    const modal = rect ? { width: rect.width, height: rect.height, innerWidth, innerHeight } : null;
    let bottom = 0;
    let what = '';
    for (const element of document.querySelectorAll<HTMLElement>(
      'main :is(p, h1, h2, h3, li, label, button, a, input, select, textarea, dt, dd, th, td, svg, img, [role="img"], [role="progressbar"])',
    )) {
      const box = element.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      if (box.bottom > window.innerHeight + 1 || box.bottom < 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      if (box.bottom > bottom) {
        bottom = box.bottom;
        what = element.outerHTML.slice(0, 160);
      }
    }
    return { height, end, atEnd, bottom, what, modal };
  }, toEnd);
}

/**
 * Misst, sobald die Seite zweimal hintereinander gleich hoch ist und, mit `toEnd`, am Ende steht.
 * Nachgeladene Karten ohne Platzhalter (Wasser, Ernährung, Schritte) erscheinen nach `openPage`.
 */
async function settled(page: Page, toEnd: boolean) {
  const seen: Awaited<ReturnType<typeof measure>>[] = [];
  await expect
    .poll(async () => {
      const current = await measure(page, toEnd);
      const stable = current.height === seen.at(-1)?.height;
      seen.push(current);
      return stable && (!toEnd || current.atEnd);
    })
    .toBe(true);
  const last = seen.at(-1);
  if (!last) throw new Error('keine Messung');
  return last;
}

/** Wie ein Finger oder das Mausrad: Taste, dann Bewegung (siehe tabbar.spec.ts). */
async function userScroll(page: Page, dy: number) {
  await page.evaluate((delta) => {
    const key = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.addEventListener('scroll', key, { capture: true, once: true });
    key();
    // Es scrollt der Rahmen der App, nicht das Fenster (D-384).
    document.getElementById('seite')?.scrollBy(0, delta);
  }, dy);
}

async function checkPageEnd(page: Page, label: string) {
  const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
  const expanded = await box(bar);
  // Ein modaler Dialog über der ganzen Seite (Anmeldung im Vollbild, D-270) liegt auch über der
  // Leiste; dann gibt es keinen Inhalt unter der Leiste. Geprüft wird nur, dass er sie verdeckt.
  const covers = (modal: NonNullable<Awaited<ReturnType<typeof measure>>['modal']>) => {
    expect(modal.width, `${label}: Dialog über die ganze Breite`).toBeGreaterThanOrEqual(
      modal.innerWidth - 1,
    );
    expect(modal.height, `${label}: Dialog über die ganze Höhe`).toBeGreaterThanOrEqual(
      modal.innerHeight - 1,
    );
  };
  const first = await settled(page, false);
  if (first.modal) {
    covers(first.modal);
    return;
  }
  if (first.end < 40) {
    // Seite passt ganz in den Viewport: nichts darf unter die ausgeklappte Leiste reichen.
    expect(first.bottom, `${label}: über der Leiste (${first.what})`).toBeLessThanOrEqual(
      expanded.y - 8,
    );
    return;
  }
  await page.evaluate((y) => {
    document.getElementById('seite')?.scrollTo(0, y);
  }, first.end - 300);
  await userScroll(page, 300);
  await expect(bar).toHaveClass(/minimized/);
  await expect.poll(async () => (await box(bar)).width).toBeLessThan(80);
  // Wirklich am Ende und im selben Schritt gemessen: Karten können nach dem ersten Bild wachsen.
  const { bottom, what, modal } = await settled(page, true);
  const circle = await box(bar);
  if (modal) {
    covers(modal);
    return;
  }
  // Am Seitenende: Inhalt mit Abstand über dem Kreis und über der ausgeklappten Leiste.
  expect(bottom, `${label}: über dem Kreis (${what})`).toBeLessThanOrEqual(circle.y - 8);
  expect(bottom, `${label}: über der ausgeklappten Leiste (${what})`).toBeLessThanOrEqual(
    expanded.y - 8,
  );
}

test('Seitenende: weder die ausgeklappte Leiste noch der Kreis verdecken Inhalt', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Tab-Leiste nur unter 1024 px');
  test.slow();
  // Der Fall aus dem Bericht (F5): Bearbeiten einer Tagesaufgabe, seit F6 in der Detailansicht.
  await addTask(page, 'steps');
  await page.getByRole('link', { name: 'steps bearbeiten' }).click();
  await expect(page.getByText(/Löschen nimmt die Aufgabe ab heute/)).toBeVisible();
  await checkPageEnd(page, '/heute/aufgaben/… (Einstellungen)');
  for (const path of APP_PAGES) {
    await openPage(page, path);
    await checkPageEnd(page, path);
  }
});
