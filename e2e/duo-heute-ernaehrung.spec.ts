import type { Locator } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// „Ernährung heute“ auf „Heute“ (D-387): Aufgeklappt ist die Karte so hoch wie die Wasser-Karte
// daneben; die drei runden Knöpfe stehen vertikal mittig im freien Raum unter den Makros und
// horizontal mittig. In einer Spalte bleibt es beim Abstand von 16 px. Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

/** Maße der Karte: Unterkante der Makros, Innenkante unten, Knöpfe. */
function measure(card: Locator) {
  return card.evaluate((section) => {
    const rect = (element: Element) => element.getBoundingClientRect();
    const links = [...section.querySelectorAll('a')];
    const group = links[0]?.parentElement;
    const row = group?.parentElement;
    // Inhalt über den Knöpfen: Ring und Makros, gegebenenfalls der Hinweis „über dem Ziel“.
    const above = row?.previousElementSibling;
    if (!group || !above) throw new Error('Knöpfe oder Makros fehlen');
    const card = rect(section);
    const style = getComputedStyle(section);
    const buttons = links.map((link) => rect(link));
    const top = Math.min(...buttons.map((b) => b.top));
    const bottom = Math.max(...buttons.map((b) => b.bottom));
    const left = Math.min(...buttons.map((b) => b.left));
    const right = Math.max(...buttons.map((b) => b.right));
    return {
      count: links.length,
      cardHeight: card.height,
      cardCenterX: card.left + card.width / 2,
      aboveBottom: rect(above).bottom,
      innerBottom: card.bottom - parseFloat(style.paddingBottom),
      top,
      bottom,
      centerX: (left + right) / 2,
    };
  });
}

test('Heute aufgeklappt: Knöpfe der Karte „Ernährung heute“ mittig im freien Raum (D-387)', async ({
  page,
}) => {
  await setDuoPose(page, 'auf');
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Ernährung heute' });
  const water = page.getByRole('region', { name: 'Wasser' });
  await expect(card).toBeVisible();
  await expect(water).toBeVisible();

  // Aufgeklappt: zwei Spalten, die Karte so hoch wie die Wasser-Karte, freier Raum darunter.
  const cardBox = await card.boundingBox();
  const waterBox = await water.boundingBox();
  expect(Math.abs((cardBox?.y ?? 0) - (waterBox?.y ?? -1)), 'nebeneinander').toBeLessThanOrEqual(1);
  expect(
    Math.abs((cardBox?.height ?? 0) - (waterBox?.height ?? -1)),
    'gleich hoch',
  ).toBeLessThanOrEqual(1);
  const open = await measure(card);
  expect(open.count).toBe(3);
  const free = open.innerBottom - open.aboveBottom;
  expect(free, 'freier Raum unter den Makros').toBeGreaterThan(80);
  // Vertikal mittig im freien Raum, horizontal mittig in der Karte.
  const middle = (open.aboveBottom + open.innerBottom) / 2;
  expect(Math.abs((open.top + open.bottom) / 2 - middle), 'vertikal mittig').toBeLessThanOrEqual(1);
  expect(Math.abs(open.centerX - open.cardCenterX), 'horizontal mittig').toBeLessThanOrEqual(1);

  // Zugeklappt eine Spalte: kein freier Raum, 16 px unter den Makros wie bisher.
  await setDuoPose(page, 'zu');
  await expect
    .poll(async () => {
      const closed = await measure(card);
      return Math.round(closed.top - closed.aboveBottom);
    })
    .toBe(16);
  const closed = await measure(card);
  expect(Math.round(closed.innerBottom - closed.bottom), 'unten ohne Lücke').toBe(0);
  expect(Math.abs(closed.centerX - closed.cardCenterX), 'horizontal mittig').toBeLessThanOrEqual(1);
});
