import type { Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Muskel-Etiketten im Training (D-386): in der Titelzeile rechts neben dem Namen, vor (i) und
// „…“; reicht der Platz nicht, in einer eigenen Zeile darunter, nie über „Erstes Mal“ oder
// anderem Text. In allen Breiten. Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

interface Card {
  name: string;
  title: DOMRect;
  tags: DOMRect | null;
  info: DOMRect;
  line: DOMRect;
}

/** Lage von Name, Etiketten, (i) und der Zeile „Erstes Mal“ je Übung. */
function cards(page: Page): Promise<Card[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main section[aria-labelledby^="uebung-"]')].map(
      (section) => {
        const title = section.querySelector('h2');
        const tags = section.querySelector('h2 ~ p > span[aria-hidden="true"]');
        const info = section.querySelector('button[aria-label^="Übungsinfo"]');
        const line = [...section.querySelectorAll('p')].find((p) =>
          /Erstes Mal|Letztes Mal/.test(p.textContent),
        );
        if (!title || !line || !info) throw new Error('Kopf der Übung unvollständig');
        return {
          name: title.textContent,
          title: title.getBoundingClientRect().toJSON() as DOMRect,
          tags: tags ? (tags.getBoundingClientRect().toJSON() as DOMRect) : null,
          info: info.getBoundingClientRect().toJSON() as DOMRect,
          line: line.getBoundingClientRect().toJSON() as DOMRect,
        };
      },
    ),
  );
}

const overlap = (a: DOMRect, b: DOMRect) =>
  a.left < b.right - 0.5 &&
  b.left < a.right - 0.5 &&
  a.top < b.bottom - 0.5 &&
  b.top < a.bottom - 0.5;

const SIZES = [
  { label: 'zu', pose: 'zu' as const },
  { label: 'hoch', pose: 'hoch' as const },
  { label: 'auf', pose: 'auf' as const },
  { label: '390 × 844', size: { width: 390, height: 844 } },
  { label: '320 × 640', size: { width: 320, height: 640 } },
];

test('Etiketten in der Titelzeile, sonst darunter, nie über „Erstes Mal“ (D-386)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Bankdrücken mit Langhantel' }),
  ).toBeVisible();

  for (const { label, pose, size } of SIZES) {
    if (pose) await setDuoPose(page, pose);
    else await page.setViewportSize(size);
    await page.waitForTimeout(300);
    const list = await cards(page);
    expect(list.length, label).toBeGreaterThanOrEqual(4);
    let sameRow = 0;
    for (const card of list) {
      const where = `${label}, ${card.name}`;
      if (!card.tags) continue;
      // Nie über dem Namen, „Erstes Mal“ oder (i).
      expect(overlap(card.tags, card.title), `${where}: Etiketten über dem Namen`).toBe(false);
      expect(overlap(card.tags, card.line), `${where}: Etiketten über „Erstes Mal“`).toBe(false);
      expect(card.tags.right, `${where}: vor (i)`).toBeLessThanOrEqual(card.info.left + 0.5);
      // „Erstes Mal“ steht unter Name und Etiketten.
      expect(card.line.top, `${where}: Zeile darunter`).toBeGreaterThanOrEqual(
        Math.max(card.title.bottom, card.tags.bottom) - 0.5,
      );
      if (card.tags.top < card.title.bottom - 0.5) {
        // In der Titelzeile: rechts neben dem Namen.
        expect(card.tags.left, `${where}: rechts neben dem Namen`).toBeGreaterThanOrEqual(
          card.title.right - 0.5,
        );
        sameRow += 1;
      } else {
        // Eigene Zeile darunter.
        expect(card.tags.top, `${where}: eigene Zeile`).toBeGreaterThanOrEqual(
          card.title.bottom - 0.5,
        );
      }
    }
    // Aufgeklappt ist Platz: Bankdrücken mit „Brust“ steht in einer Zeile.
    if (label === 'auf')
      expect(sameRow, `${label}: Etiketten in der Titelzeile`).toBeGreaterThan(0);
  }
});
