import { expect, openPage, test } from './fixtures';

const DASHBOARD = 'https://jbkufpyyfmbxjeswagli.supabase.co';

// WebKit: Nach dem ersten Laden steuert der Service Worker die Seite, und ihre Anfragen umgehen
// dann `page.route` (wie in sync.spec.ts).
test.use({ serviceWorkers: 'block' });

test('Schritte aus dem Dashboard: verbinden, Karte unter Ernährung, trennen (D-277)', async ({
  page,
  consoleErrors,
}) => {
  test.slow();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
  const year = today.slice(0, 4);
  const requests: string[] = [];
  let writes = 0;
  await page.route(`${DASHBOARD}/**`, async (route) => {
    const request = route.request();
    const url = request.url();
    requests.push(url);
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(body),
      });
    if (url.includes('/auth/v1/token?grant_type=password')) {
      const sent = request.postDataJSON() as { password?: string };
      if (sent.password !== 'richtig') return json({ error: 'invalid_grant' }, 400);
      return json({
        access_token: 'zugang',
        refresh_token: 'erneuern',
        expires_in: 3600,
        user: { id: '00000000-0000-4000-8000-000000000001', email: 'dali@example.com' },
      });
    }
    if (url.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    if (request.method() !== 'GET') writes += 1;
    expect(request.headers().authorization).toBe('Bearer zugang');
    if (url.includes('/rest/v1/settings')) {
      return json([
        {
          value: {
            version: 1,
            years: {
              [year]: {
                goal: 4_000_000,
                baselineSteps: 1_000_000,
                baselineDate: `${String(Number(year) - 1)}-12-31`,
              },
            },
          },
        },
      ]);
    }
    if (url.includes('/rest/v1/step_entries')) {
      return json([{ date: today, steps: 8_420, deleted: false }]);
    }
    return json([]);
  });

  // Ohne Verbindung: Hinweis, keine Anfrage ans Dashboard.
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Schritte', exact: true });
  await expect(card).toContainText('Verbinde dein Dashboard');
  expect(requests).toEqual([]);

  await card.getByRole('link', { name: 'Verbinden' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Schritte aus dem Dashboard' }),
  ).toBeVisible();
  await page.getByLabel('E-Mail des Dashboards').fill('dali@example.com');
  await page.getByLabel('Passwort des Dashboards').fill('falsch');
  await page.getByRole('button', { name: 'Verbinden' }).click();
  await expect(page.getByRole('alert')).toContainText('E-Mail oder Passwort stimmen nicht');
  // Die abgelehnte Anmeldung meldet der Browser selbst als Ladefehler; erwartet, kein Fehler der App.
  const rejected = consoleErrors.findIndex((text) => text.includes('status of 400'));
  expect(rejected).toBeGreaterThanOrEqual(0);
  consoleErrors.splice(rejected, 1);

  await page.getByLabel('Passwort des Dashboards').fill('richtig');
  await page.getByRole('button', { name: 'Verbinden' }).click();
  await expect(page.getByText('Verbunden als dali@example.com')).toBeVisible();

  // Karte direkt unter „Ernährung heute“, mit Zahlen wie im Dashboard.
  await openPage(page, '/heute');
  await expect(card).toContainText(/8\D?420/);
  await expect(card).toContainText('Ziel');
  await expect(card).toContainText(/Jahr \d+ %/);
  // Ernährungs- und Wasserkarte werden nachgeladen; erst danach die Reihenfolge lesen.
  await expect(page.getByText('Ernährung heute')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Wasser', exact: true })).toBeVisible();
  const order = await page
    .getByRole('main')
    .locator('section')
    .evaluateAll((sections) => sections.map((s) => s.textContent));
  const nutrition = order.findIndex((text) => text.includes('Ernährung heute'));
  // Wasser direkt unter „Ernährung heute“ (D-289), danach die Schritte.
  expect(order[nutrition + 1]).toMatch(/^Wasser/);
  expect(order[nutrition + 2]).toContain('Schritte');
  expect(writes).toBe(0);

  // Trennen löscht die Anmeldung auf dem Gerät.
  await openPage(page, '/mehr/schritte');
  await page.getByRole('button', { name: 'Verbindung trennen' }).click();
  await expect(page.getByLabel('E-Mail des Dashboards')).toBeVisible();
  await openPage(page, '/heute');
  await expect(card).toContainText('Verbinde dein Dashboard');
});
