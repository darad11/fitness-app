import type { Locator, Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/** Programme und Training (F5, D-324): Seitenanfang, Etiketten in den Karten, „Bereit für dein Training?“. */

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

test('Programme: Detailseite beginnt oben, Zurück behält die Position der Liste', async ({
  page,
}) => {
  await openPage(page, '/training/programme');
  for (const name of ['Oberkörper/Unterkörper', 'Zuhause mit Kurzhanteln', 'Push/Pull/Beine']) {
    const card = page
      .getByRole('link', { name: new RegExp(`^${name.replace('/', '\\/')}`) })
      .first();
    // Karte mittig, dann per DOM klicken: Playwright würde sonst vor dem Klick selbst scrollen.
    await card.evaluate((element) => {
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    const listY = await scrollY(page);
    expect(listY, `Liste gescrollt vor „${name}“`).toBeGreaterThan(0);
    await card.evaluate((element) => {
      (element as HTMLElement).click();
    });
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect.poll(() => scrollY(page), { message: `„${name}“ beginnt oben` }).toBe(0);
    await expect(page.getByRole('heading', { level: 1, name })).toBeInViewport();
    await page.goBack();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Programme und Vorlagen' }),
    ).toBeAttached();
    await expect
      .poll(async () => Math.abs((await scrollY(page)) - listY), {
        message: `Liste wieder an der alten Stelle nach „${name}“`,
      })
      .toBeLessThanOrEqual(2);
  }
  // Wieder öffnen: wieder oben.
  await page
    .getByRole('link', { name: /^Ganzkörper A\/B/ })
    .first()
    .click();
  await expect.poll(() => scrollY(page)).toBe(0);
});

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b).not.toBeNull();
  return b ?? { x: 0, y: 0, width: 0, height: 0 };
}

for (const width of [360, 390, 768]) {
  test(`Programmkarten: Etikett oben rechts, Titel bricht davor um, Chevron rechts mittig (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.setViewportSize({ width, height: 900 });
    // Ein aktives Programm, damit auch „Aktiv“ vorkommt.
    await openPage(page, '/training/vorlagen/compound_ab_4');
    await page.getByRole('button', { name: 'Programm aktivieren' }).click();
    await openPage(page, '/training/programme');
    const cards = page.locator('main ul li > a');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(7);
    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const badge = card.locator('span.rounded-pill').first();
      const title = card.locator('span.font-semibold').first();
      const chevron = card.locator('svg.lucide-chevron-right');
      const label = (await title.textContent()) ?? String(i);
      const [c, b, tl, ch] = await Promise.all([box(card), box(badge), box(title), box(chevron)]);
      // Etikett oben: auf Höhe der ersten Titelzeile, rechts neben dem Titel. Passt das längste
      // Wort des Titels nicht daneben, steht das Etikett über dem Titel. Wo das eintritt, hängt
      // von der Schrift ab (iPhone, Inter lokal, breitere Ersatzschrift in der CI).
      const beside = Math.abs(b.y - tl.y) <= 6;
      if (beside) {
        expect(tl.x + tl.width, `${label}: Titel endet vor dem Etikett`).toBeLessThanOrEqual(
          b.x + 0.5,
        );
      } else {
        expect(b.y + b.height, `${label}: Etikett über dem Titel`).toBeLessThanOrEqual(tl.y + 1);
      }
      // Etikett ganz rechts im Textbereich, vor dem Chevron.
      expect(b.x + b.width, `${label}: Etikett vor dem Chevron`).toBeLessThanOrEqual(ch.x);
      expect(ch.x - (b.x + b.width), `${label}: Etikett ganz rechts`).toBeLessThanOrEqual(13);
      // Kein Wort getrennt: Umbrüche nur an Leerzeichen und nach Schrägstrichen (F5 §9, D-331).
      const split = await title.evaluate((element) => {
        const found: string[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (const match of (node.textContent ?? '').matchAll(/[^\s/]+\/?/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
            if (lines.size > 1) found.push(match[0]);
          }
        }
        return found;
      });
      expect(split, `${label}: kein Wort getrennt`).toEqual([]);
      expect(ch.x + ch.width, `${label}: Chevron in der Karte`).toBeLessThanOrEqual(c.x + c.width);
      // Chevron rechts mittig.
      const middle = c.y + c.height / 2;
      expect(
        Math.abs(ch.y + ch.height / 2 - middle),
        `${label}: Chevron mittig`,
      ).toBeLessThanOrEqual(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('„Bereit für dein Training?“ auf Heute und Training, wenn nichts läuft und kein Programm aktiv ist', async ({
  page,
}) => {
  for (const path of ['/heute', '/training']) {
    await openPage(page, path);
    const card = page.getByRole('region', { name: 'Bereit für dein Training?' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Training', { exact: true })).toBeVisible();
    await expect(card).toContainText('Starte ein freies Training oder wähle eine Vorlage.');
    await expect(card).not.toContainText('Gerät');
    const start = card.getByRole('button', { name: 'Freies Training starten' });
    await expect(start).toBeVisible();
    const [cardBox, startBox] = [await box(card), await box(start)];
    expect(startBox.width, 'Knopf über die ganze Breite').toBeGreaterThan(cardBox.width - 40);
    await expect(page.getByRole('button', { name: 'Freies Training starten' })).toHaveCount(1);
    await card.getByRole('link', { name: 'Vorlage wählen' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Programme und Vorlagen' }),
    ).toBeVisible();
  }
  // Mit aktivem Programm: „Heute geplant“ statt der Frage.
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await openPage(page, '/heute');
  await expect(page.getByText('Heute geplant', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bereit für dein Training?' })).toHaveCount(0);
  // Mit laufendem Training: „Training läuft“.
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\//);
  await openPage(page, '/training');
  await expect(page.getByText('Training läuft', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bereit für dein Training?' })).toHaveCount(0);
});
