import { expect, openPage, pageOverflowX, test } from './fixtures';

/**
 * Kopf im Training (F6 Abschnitt 7, D-338): „Woche n“ bleibt immer sichtbar; wird es eng, kürzt
 * sich der Programmname mit Auslassungspunkten („Winterprogramm 20… · Woche 3“), nicht die Woche.
 * Gemessen wird am Text selbst, unabhängig vom Aufbau der Zeile: Ein Textstück ist sichtbar,
 * wenn es innerhalb der Zeile und innerhalb jedes Vorfahren liegt, der Überlauf abschneidet.
 */
for (const width of [360, 390, 768]) {
  test(`Trainingskopf: „Woche 3“ ganz sichtbar, der Programmname kürzt sich (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, '/training/vorlagen/winterprogramm-2026');
    await page
      .getByRole('button', { name: 'Tag 21 · Unterkörper und Bauch heute trainieren' })
      .click();
    await expect(page).toHaveURL(/\/training\/einheit\//);
    const line = page.locator('header p.eyebrow').first();
    // Vorgelesen wird alles, gekürzt ist nur die Anzeige.
    await expect(line).toHaveText('Winterprogramm 2026 · Woche 3');
    const m = await line.evaluate((element) => {
      const find = (text: string) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const at = node.textContent?.indexOf(text) ?? -1;
          if (at < 0) continue;
          const range = document.createRange();
          range.setStart(node, at);
          range.setEnd(node, at + text.length);
          return range;
        }
        throw new Error(`„${text}“ fehlt`);
      };
      // Rechte Kante des sichtbaren Bereichs: die Zeile und jeder Vorfahr, der abschneidet.
      const clip = (range: Range) => {
        let right = element.getBoundingClientRect().right;
        let ellipsis = false;
        for (let el = range.startContainer.parentElement; el; el = el.parentElement) {
          const style = getComputedStyle(el);
          if (style.overflowX !== 'visible') {
            right = Math.min(right, el.getBoundingClientRect().right);
            ellipsis ||= style.textOverflow === 'ellipsis';
          }
          if (el === element) break;
        }
        return { right, ellipsis };
      };
      const week = find('Woche 3');
      const name = find('Winterprogramm 2026');
      const weekBox = week.getBoundingClientRect();
      const nameBox = name.getBoundingClientRect();
      return {
        weekVisible: weekBox.right <= clip(week).right + 0.5,
        nameCut: nameBox.right > clip(name).right + 0.5,
        nameEllipsis: clip(name).ellipsis,
        oneLine: Math.abs(nameBox.top - weekBox.top) < 1,
      };
    });
    expect(m.weekVisible, '„Woche 3“ ganz sichtbar').toBe(true);
    expect(m.oneLine, 'eine Zeile').toBe(true);
    expect(m.nameEllipsis, 'Name mit Auslassungspunkten').toBe(true);
    // Auf 360 und 390 pt ist es eng: der Name ist gekürzt; auf 768 pt passt alles.
    expect(m.nameCut, 'Programmname gekürzt').toBe(width < 768);
    expect(await pageOverflowX(page), 'waagrechter Überlauf').toBeLessThanOrEqual(0);
  });
}
