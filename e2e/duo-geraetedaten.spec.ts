import AxeBuilder from '@axe-core/playwright';
import type { Page, Request } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Gerätedaten unter „Mehr › Über die App“ (D-388): zugeklappt, nachgeladen beim Aufklappen,
// Werte folgen dem Auf- und Zuklappen; nichts wird übertragen. Chromium und WebKit, Handy-Profil
// (den sicheren Bereich stellt nur Chromium nach).
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

/** Wert zur Bezeichnung in der Liste der Gerätedaten. */
function value(page: Page, label: string) {
  return page
    .locator('dl dt', { hasText: label })
    .locator('xpath=following-sibling::dd[1]')
    .first();
}

test('Gerätedaten: zugeklappt, Werte live beim Auf- und Zuklappen, nichts übertragen (D-388)', async ({
  page,
}) => {
  const chromium = await setDuoPose(page, 'zu');
  await openPage(page, '/mehr/ueber');
  const summary = page.locator('summary', { hasText: 'Gerätedaten' });
  await expect(summary).toBeVisible();
  // Zugeklappt: keine Werte.
  await expect(page.getByText('Fenster (innerWidth × innerHeight)')).toHaveCount(0);

  // Ab jetzt jede Anfrage merken: Beim Aufklappen darf nur der nachgeladene Teil der App kommen.
  const requests: Request[] = [];
  page.on('request', (request) => requests.push(request));
  await summary.click();
  await expect(value(page, 'Fenster (innerWidth × innerHeight)')).toHaveText('466 × 678');
  await expect(value(page, 'Sichtbarer Bereich')).toHaveText('466 × 678');
  await expect(value(page, 'offsetTop / pageTop')).toHaveText(/^\d+([,.]\d+)? \/ \d+([,.]\d+)?$/);
  await expect(value(page, 'Sichere Bereiche')).toHaveText(chromium ? '0, 84, 34, 0' : /^\d/);
  await expect(value(page, 'Ausrichtung')).toHaveText(
    /^(portrait|landscape)-(primary|secondary), \d+°$|^nicht verfügbar$/,
  );
  await expect(value(page, 'Pixeldichte')).toHaveText(/^\d+([,.]\d+)?$/);
  await expect(value(page, 'Anzeigemodus')).toHaveText('Browser (z. B. Safari)');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  // Aufklappen und Drehen: Die Werte folgen ohne Neuladen.
  await setDuoPose(page, 'auf');
  await expect(value(page, 'Fenster (innerWidth × innerHeight)')).toHaveText('951 × 669');
  if (chromium) await expect(value(page, 'Sichere Bereiche')).toHaveText('0, 84, 20, 0');
  await setDuoPose(page, 'hoch');
  await expect(value(page, 'Fenster (innerWidth × innerHeight)')).toHaveText('669 × 951');

  // Nichts übertragen: nur Abrufe von Teilen der App, nichts an andere Adressen, nichts gesendet.
  const origin = new URL(page.url()).origin;
  const foreign = requests.filter(
    (request) => new URL(request.url()).origin !== origin || request.method() !== 'GET',
  );
  expect(foreign.map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(requests.every((r) => ['script', 'stylesheet'].includes(r.resourceType()))).toBe(true);

  // Zugeklappt: wieder ohne Werte.
  await summary.click();
  await expect(page.getByText('Fenster (innerWidth × innerHeight)')).toHaveCount(0);
});
