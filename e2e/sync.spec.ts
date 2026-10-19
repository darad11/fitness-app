import { expect, openPage, test } from './fixtures';

const BASE = 'https://eyxqciryeggpjzvaxjvu.supabase.co';

test('Synchronisierung: anmelden, Gewicht senden, nach Neuladen weiter angemeldet (D-269)', async ({
  page,
}) => {
  test.slow();
  const pushed: unknown[] = [];
  await page.route(`${BASE}/**`, async (route) => {
    const url = route.request().url();
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(body),
      });
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
        },
      });
      return;
    }
    if (url.includes('/auth/v1/token')) {
      await json({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        user: { id: '11111111-1111-4111-8111-111111111111', email: 'ich@example.org' },
      });
    } else if (url.includes('/rpc/push_documents')) {
      const { docs } = route.request().postDataJSON() as { docs: { doc_id: string }[] };
      pushed.push(...docs);
      await json(docs.map((d, i) => ({ doc_id: d.doc_id, status: 'accepted', rev: i + 1 })));
    } else {
      await json([]);
    }
  });

  await openPage(page, '/fortschritt/gewicht');
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill('80,5');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();

  await openPage(page, '/mehr/synchronisierung');
  await page.getByLabel('E-Mail').fill('ich@example.org');
  await page.getByLabel('Passwort').fill('geheim');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText('Angemeldet als ich@example.org')).toBeVisible();
  await expect(page.getByText(/^Zuletzt abgeglichen:/)).toBeVisible();
  await expect.poll(() => pushed.length).toBeGreaterThan(0);
  expect(pushed.some((d) => (d as { doc_table: string }).doc_table === 'bodyWeights')).toBe(true);

  await page.reload();
  await expect(page.getByText('Angemeldet als ich@example.org')).toBeVisible();
});

test('Anmeldung im Vollbild: „Später“ und Escape führen ohne Anmeldung zurück (D-270)', async ({
  page,
}) => {
  await openPage(page, '/mehr/synchronisierung');
  const login = page.getByRole('dialog', { name: 'Fitness' });
  await expect(login).toBeVisible();
  await expect(login.getByRole('heading', { name: 'Fitness' })).toBeFocused();
  await login.getByRole('button', { name: 'Später' }).click();
  await expect(page).toHaveURL(/\/mehr$/);
  await openPage(page, '/mehr/synchronisierung');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/mehr$/);
});
