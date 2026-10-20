import AxeBuilder from '@axe-core/playwright';
import { chooseTheme, expect, APP_PAGES, openPage, test } from './fixtures';

test('alle Anfragen gehen an die eigene Adresse; Sicherheits-Header gesetzt (AK-PWA-06)', async ({
  page,
  baseURL,
}) => {
  // Ein Durchgang über alle Seiten; mit jeder neuen Seite näher am Zeitlimit von 30 s (einmal rot
  // auf dem CI-Runner), deshalb die dreifache Zeit.
  test.slow();
  const own = new URL(baseURL ?? '').origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== own) {
      foreign.push(request.url());
    }
  });

  const response = await page.goto('/heute');
  const headers = response?.headers() ?? {};
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['referrer-policy']).toBe('no-referrer');

  for (const path of APP_PAGES) await openPage(page, path);
  await chooseTheme(page, 'Dunkel');
  await page.getByLabel('Datum und Zahlen').selectOption('de-DE');
  expect(foreign).toEqual([]);
});

// Je Seite und Darstellung ein eigener Test: Mit 16 Seiten überschritt die gemeinsame Schleife in
// WebKit auf dem CI-Runner das Zeitlimit von 30 s (Befund aus der CI von #13).
for (const theme of ['Hell', 'Dunkel'] as const) {
  for (const path of APP_PAGES) {
    test(`keine axe-Verstöße nach WCAG 2.1 AA in „${theme}": ${path} (AK-UX-04 Basis)`, async ({
      page,
    }) => {
      await chooseTheme(page, theme);
      await openPage(page, path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const violations = results.violations.map(
        (violation) =>
          `${path} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      );
      expect(violations).toEqual([]);
    });
  }
}
