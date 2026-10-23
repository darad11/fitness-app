import type { Locator, Page } from '@playwright/test';
import { APP_PAGES, expect, openPage, test } from './fixtures';

/** Kopfzeile, Icons und Markierungen (F5, D-325): Regler-Symbol, Kalender, Erledigt-Kreise, Seitenende. */

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b).not.toBeNull();
  return b ?? { x: 0, y: 0, width: 0, height: 0 };
}

async function addTask(page: Page, name: string) {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill(name);
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(page.getByRole('button', { name: `${name} bearbeiten` })).toBeVisible();
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

test('Kalender der Auswertung: Zellen 28 px, Haken 14 px, dünner Lime-Rahmen nur heute, Legende dazu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-10-20T09:00:00+02:00') });
  await addTask(page, 'Lesen');
  for (const day of ['2026-10-20', '2026-10-21', '2026-10-22']) {
    await page.clock.setSystemTime(new Date(`${day}T09:00:00+02:00`));
    await openPage(page, '/heute');
    const card = page.getByRole('region', { name: 'Tagesaufgaben' });
    await card.getByText('Lesen', { exact: true }).click();
    await expect(card.getByRole('checkbox', { name: 'Lesen' })).toBeChecked();
  }
  await openPage(page, '/heute/aufgaben');
  await page.getByRole('link', { name: 'Lesen: Auswertung öffnen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lesen' })).toBeVisible();
  const calendar = page.getByRole('list', { name: /Kalender/ });
  const cells = calendar.locator('li[title] > span[aria-hidden="true"]');
  await expect(cells).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) {
    const cell = await box(cells.nth(i));
    expect([Math.round(cell.width), Math.round(cell.height)]).toEqual([28, 28]);
    const check = await box(cells.nth(i).locator('svg'));
    expect(Math.round(check.width)).toBe(14);
    // Abgerundet wie die Kachel des App-Icons (22,5 %), nicht eckig.
    expect(
      await cells.nth(i).evaluate((element) => parseFloat(getComputedStyle(element).borderRadius)),
    ).toBeGreaterThan(5);
  }
  const ring = (locator: Locator) =>
    locator.evaluate((element) => getComputedStyle(element).boxShadow);
  // Nur heute (22.10.) mit Rahmen: 1 px Lime mit 1 px Abstand.
  expect(await ring(cells.nth(0))).toBe('none');
  expect(await ring(cells.nth(1))).toBe('none');
  const today = await ring(cells.nth(2));
  expect(today).toContain('rgb(199, 255, 70) 0px 0px 0px 2px');
  expect(today).not.toContain('3px');
  // Legende: Muster 14 px, auch für „heute“.
  const legend = calendar.locator('xpath=following-sibling::ul[1]');
  await expect(legend.locator('li')).toHaveText([
    'erledigt',
    'nicht erledigt',
    'nicht fällig',
    'kein Eintrag',
    'heute',
  ]);
  for (const swatch of await legend.locator('li > span').all()) {
    const b = await box(swatch);
    expect([Math.round(b.width), Math.round(b.height)]).toEqual([14, 14]);
  }
  expect(await ring(legend.locator('li').last().locator('span'))).toContain('rgb(199, 255, 70)');
});

test('Erledigt-Kreis in Listen: 20 px, mittig zum Text, Zeile und Tippfläche unverändert', async ({
  page,
}) => {
  await addTask(page, 'Dehnen');
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  const row = card.locator('label', { hasText: 'Dehnen' });
  const mark = row.locator('span[aria-hidden="true"]').first();
  const text = row.getByText('Dehnen', { exact: true });
  for (const checked of [false, true]) {
    const [r, m, tx] = [await box(row), await box(mark), await box(text)];
    expect([Math.round(m.width), Math.round(m.height)]).toEqual([20, 20]);
    expect(Math.round(r.height)).toBe(48);
    expect(Math.abs(m.y + m.height / 2 - (tx.y + tx.height / 2))).toBeLessThanOrEqual(1);
    if (!checked) {
      // Ein Tipp auf den Text hakt ab: die ganze Zeile ist die Tippfläche.
      await text.click();
      await expect(card.getByRole('checkbox', { name: 'Dehnen' })).toBeChecked();
      await expect(mark.locator('svg')).toBeVisible();
      expect(Math.round((await box(mark.locator('svg'))).width)).toBe(14);
    }
  }

  await openPage(page, '/ernaehrung/einkaufsliste');
  const field = page.getByLabel('Was möchtest du einkaufen?');
  await field.fill('Haferflocken');
  await field.press('Enter');
  const item = page.locator('label', { hasText: 'Haferflocken' });
  await expect(item).toBeVisible();
  const itemMark = await box(item.locator('span[aria-hidden="true"]').first());
  expect([Math.round(itemMark.width), Math.round(itemMark.height)]).toEqual([20, 20]);
  expect((await box(item)).height).toBeGreaterThanOrEqual(44);
});

/** Tiefster sichtbarer Inhalt in `main` (Text, Knöpfe, Felder) im Viewport, mit Beschreibung. */
function contentBottom(page: Page) {
  return page.evaluate(() => {
    let bottom = 0;
    let what = '';
    for (const element of document.querySelectorAll<HTMLElement>(
      'main :is(p, h1, h2, h3, li, label, button, a, input, select, textarea, dt, dd, th, td, svg, img, [role="img"], [role="progressbar"])',
    )) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom > window.innerHeight + 1 || rect.bottom < 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      if (rect.bottom > bottom) {
        bottom = rect.bottom;
        what = element.outerHTML.slice(0, 160);
      }
    }
    return { bottom, what };
  });
}

/** Wie ein Finger oder das Mausrad: Taste, dann Bewegung (siehe tabbar.spec.ts). */
async function userScroll(page: Page, dy: number) {
  await page.evaluate((delta) => {
    const key = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.addEventListener('scroll', key, { capture: true, once: true });
    key();
    window.scrollBy(0, delta);
  }, dy);
}

async function checkPageEnd(page: Page, label: string) {
  const bar = page.getByRole('navigation', { name: 'Hauptnavigation' }).last();
  // Ein modaler Dialog über der ganzen Seite (Anmeldung im Vollbild, D-270) liegt auch über der
  // Leiste; dann gibt es keinen Inhalt unter der Leiste. Geprüft wird nur, dass er sie verdeckt.
  const modal = await page.evaluate(() => {
    const dialog = document.querySelector('dialog:modal');
    if (!dialog) return null;
    const rect = dialog.getBoundingClientRect();
    return { width: rect.width, height: rect.height, innerWidth, innerHeight };
  });
  if (modal) {
    expect(modal.width, `${label}: Dialog über die ganze Breite`).toBeGreaterThanOrEqual(
      modal.innerWidth - 1,
    );
    expect(modal.height, `${label}: Dialog über die ganze Höhe`).toBeGreaterThanOrEqual(
      modal.innerHeight - 1,
    );
    return;
  }
  const expanded = await box(bar);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  if (max < 40) {
    // Seite passt ganz in den Viewport: nichts darf unter die ausgeklappte Leiste reichen.
    const { bottom, what } = await contentBottom(page);
    expect(bottom, `${label}: über der Leiste (${what})`).toBeLessThanOrEqual(expanded.y - 8);
    return;
  }
  await page.evaluate((y) => {
    window.scrollTo(0, y);
  }, max - 300);
  await userScroll(page, 300);
  await expect(bar).toHaveClass(/minimized/);
  await expect.poll(async () => (await box(bar)).width).toBeLessThan(80);
  // Wirklich am Ende: Karten können nach dem ersten Bild noch wachsen.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const end = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY < end - 1) window.scrollTo(0, end);
        return window.scrollY >= end - 1;
      }),
    )
    .toBe(true);
  const circle = await box(bar);
  const { bottom, what } = await contentBottom(page);
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
  // Der Fall aus dem Bericht: offenes Bearbeiten einer Tagesaufgabe am Ende der Karte.
  await addTask(page, 'steps');
  await page.getByRole('button', { name: 'steps bearbeiten' }).click();
  await expect(page.getByText(/Löschen nimmt die Aufgabe ab heute/)).toBeVisible();
  await checkPageEnd(page, '/heute/aufgaben (Bearbeiten)');
  for (const path of APP_PAGES) {
    await openPage(page, path);
    await checkPageEnd(page, path);
  }
});
