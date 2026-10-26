import type { Page } from '@playwright/test';
import { expect, openPage, pageOverflowX, test } from './fixtures';

/** Zeitraum-Auswahl einzeilig (F5 Abschnitt 6, D-327): alle Chips in einer Zeile, ohne Kürzung. */

async function logRun(page: Page) {
  await openPage(page, '/training/nachtragen');
  await page.getByText('Aktivität', { exact: true }).first().click();
  await page.getByLabel('Art der Aktivität').selectOption('run');
  await page.getByLabel('Dauer in Minuten').fill('30');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Laufen' })).toBeVisible();
}

const PAGES: readonly { path: string; options: string[]; setup?: (page: Page) => Promise<void> }[] =
  [
    {
      path: '/fortschritt',
      options: ['Woche', 'Monat', '3 Monate', 'Jahr', 'Gesamt'],
      setup: logRun,
    },
    {
      path: '/fortschritt/gewicht',
      options: ['30 Tage', '90 Tage', '1 Jahr', 'Gesamt'],
      setup: async (page) => {
        await openPage(page, '/fortschritt/gewicht');
        await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
        const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
        await sheet.getByLabel('Gewicht in kg').fill('80,5');
        await sheet.getByRole('button', { name: 'Speichern' }).click();
        await expect(sheet).toBeHidden();
      },
    },
    {
      path: '/heute/aufgaben',
      options: ['7', '30', '90', 'Gesamt'],
      setup: async (page) => {
        await openPage(page, '/heute/aufgaben');
        await page.getByLabel('Name der Aufgabe').fill('Dehnen');
        await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
        await expect(page.getByRole('link', { name: 'Dehnen bearbeiten' })).toBeVisible();
      },
    },
    { path: '/ernaehrung/wasser', options: ['7 Tage', '30 Tage'] },
  ];

for (const width of [360, 390, 768]) {
  for (const { path, options, setup } of PAGES) {
    test(`Zeitraum auf ${path} in einer Zeile (${String(width)} pt)`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
      await page.setViewportSize({ width, height: 844 });
      if (setup) await setup(page);
      await openPage(page, path);
      const group = page.getByRole('group', { name: /^Zeitraum/ }).first();
      const chips = group.locator('label > span');
      await expect(chips).toHaveText(options);
      const boxes = await chips.evaluateAll((spans) =>
        spans.map((span) => {
          const rect = span.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            height: rect.height,
            // Der Text muss ganz im Chip liegen (die unsichtbare Tippfläche ragt absichtlich hinaus).
            clipped: (() => {
              const range = document.createRange();
              range.selectNodeContents(span);
              const text = range.getBoundingClientRect();
              return text.left < rect.left - 0.5 || text.right > rect.right + 0.5;
            })(),
          };
        }),
      );
      // Eine Zeile, nichts gekürzt, keine Überlappung, 36 px hoch.
      for (const [i, box] of boxes.entries()) {
        expect(
          Math.abs(box.top - (boxes[0]?.top ?? 0)),
          `${options[i] ?? ''} in der Zeile`,
        ).toBeLessThan(1);
        expect(box.clipped, `${options[i] ?? ''} nicht gekürzt`).toBe(false);
        expect(Math.round(box.height)).toBe(36);
        if (i > 0) expect(box.left).toBeGreaterThanOrEqual((boxes[i - 1]?.right ?? 0) - 0.5);
      }
      expect(await pageOverflowX(page), 'waagrechter Überlauf').toBeLessThanOrEqual(0);
      // Jede Option per Tipp auf den Chip.
      for (const index of [...options.keys()].reverse()) {
        await chips.nth(index).click();
        await expect(group.locator('input').nth(index)).toBeChecked();
      }
    });
  }
}
