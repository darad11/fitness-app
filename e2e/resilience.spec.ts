import { expect, openPage, test } from './fixtures';

const toSec = (text: string | null) => {
  const [m = 0, s = 0] = (text ?? '0:00').replace('+', '').split(':').map(Number);
  return m * 60 + s;
};

/** Sichtbarkeitswechsel wie beim Wechsel in den Hintergrund und zurück. */
async function simulateVisibility(
  page: import('@playwright/test').Page,
  state: 'hidden' | 'visible',
) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

test('Pausentimer: Sichtbarkeitswechsel, Neuladen und Überziehung (E-04, AK-TRN-11, AK-TRN-12)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  const warmup = 'Kniebeuge mit Langhantel, Aufwärmsatz 1';
  await page.getByLabel(`Gewicht in kg, ${warmup}`).fill('40');
  await page.getByRole('button', { name: `Satz erledigt, ${warmup}` }).click();
  const rest = page.getByRole('region', { name: 'Pause' });
  const timer = rest.getByRole('timer');
  await expect(timer).toHaveText(/^\d:\d\d$/);
  const before = toSec(await timer.textContent());

  // Verborgen tickt die Anzeige nicht weiter; bei Rückkehr steht sofort die richtige Restzeit.
  await simulateVisibility(page, 'hidden');
  await page.waitForTimeout(1500);
  await simulateVisibility(page, 'visible');
  const afterReturn = toSec(await timer.textContent());
  expect(afterReturn).toBeLessThanOrEqual(before);
  expect(afterReturn).toBeGreaterThanOrEqual(before - 4);

  // Überziehung: Pause auf unter null verkürzen; Anzeige „+m:ss" und „Pause vorbei" bleiben nach Neuladen.
  const minus = rest.getByRole('button', { name: '15 s weniger' });
  for (let i = 0; i < Math.ceil(before / 15) + 1; i++) await minus.click();
  await expect(timer).toHaveText(/^\+\d:\d\d$/);
  await expect(rest).toContainText('Pause vorbei');
  await expect(timer).toHaveAccessibleName(/^Pause vorbei seit /);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Pause' }).getByRole('timer')).toHaveText(
    /^\+\d:\d\d$/,
  );
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toHaveCount(0);
});

test('Offline: Übung hinzufügen, Sätze erfassen, neu laden (E-05, AK-PWA-02, AK-TRN-17)', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Offline mit Service Worker wird in Chromium geprüft; Safari prüft T-IPH-M1 Schritt 8 auf dem Gerät.',
  );
  test.slow();
  await openPage(page, '/heute');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  // Die Übungsauswahl einmal online öffnen, damit ihre nachgeladenen Teile im Cache liegen.
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill('liegest');
  await picker.getByRole('button', { name: /^Liegestütze/ }).click();
  await expect(picker).toBeHidden();
  const set = 'Liegestütze, Arbeitssatz 1';
  await page.getByLabel(`Gewicht in kg, ${set}`).fill('0');
  await page.getByLabel(`Wiederholungen, ${set}`).fill('15');
  await page.getByRole('button', { name: `Satz erledigt, ${set}` }).click();
  await expect(page.getByText('1 von 1 Sätzen')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();
  await expect(page.getByLabel(`Wiederholungen, ${set}`)).toHaveValue('15');
  await expect(page.getByRole('button', { name: `Erledigt zurücknehmen, ${set}` })).toBeVisible();
  await openPage(page, '/mehr');
  await expect(page.getByRole('status').filter({ hasText: 'Training läuft' })).toContainText(
    '1 von 1 Sätzen',
  );
  await context.setOffline(false);
});
