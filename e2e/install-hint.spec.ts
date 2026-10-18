import { expect, openPage, test } from './fixtures';

// Safari auf dem iPhone simuliert über die Browserkennung; echtes Verhalten prüft T-IPH-M0.
test.use({
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
  viewport: { width: 393, height: 852 },
  hasTouch: true,
});

const HINT = /Teilen › Zum Home-Bildschirm/;

test('zeigt im Safari-Tab den Hinweis; Ausblenden bleibt; unter Installieren erneut abrufbar (AK-PWA-04)', async ({
  page,
}) => {
  await openPage(page, '/heute');
  await expect(page.getByText(HINT)).toBeVisible();
  await expect(
    page.getByText(/Daten im Browser-Tab sind von der installierten App getrennt/),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Ausblenden' }).click();
  await expect(page.getByText(HINT)).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
  await expect(page.getByText(HINT)).toBeHidden();

  await openPage(page, '/mehr/installieren');
  await expect(page.getByText('Die App läuft gerade im Browser.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('iPhone');
  await page.getByRole('button', { name: 'Hinweis wieder anzeigen' }).click();
  await openPage(page, '/heute');
  await expect(page.getByText(HINT)).toBeVisible();
});

test('erkennt die installierte App und zeigt dort keinen Hinweis (AK-SET-06)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'standalone', {
      configurable: true,
      get: () => true,
    });
  });
  await openPage(page, '/heute');
  await expect(page.getByText('Als App installiert')).toBeVisible();
  await expect(page.getByText(HINT)).toHaveCount(0);
  await openPage(page, '/mehr/installieren');
  await expect(page.getByText('Die App läuft als installierte App.')).toBeVisible();
});
