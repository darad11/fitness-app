import { expect, openPage, test } from './fixtures';

/**
 * Dauerhafter Speicher (AK-PWA-05, A-07): Die App bittet den Browser nach dem ersten
 * gespeicherten Dokument darum, die Daten nicht bei Speicherdruck zu löschen. Vorher geschah das
 * nur während eines Trainings; wer nur Gewicht, Ernährung oder Wasser erfasste, bat nie darum.
 */
test('Dauerhafter Speicher wird nach dem ersten gespeicherten Dokument angefordert (A-07)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const calls = { count: 0 };
    Object.defineProperty(window, '__persistCalls', { get: () => calls.count });
    const storage = navigator.storage as StorageManager | undefined;
    if (typeof storage?.persist !== 'function') return;
    const original = storage.persist.bind(storage);
    storage.persist = () => {
      calls.count += 1;
      return original();
    };
  });
  const count = () =>
    page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls);
  await openPage(page, '/fortschritt/gewicht');
  const supported = await page.evaluate(
    () => typeof (navigator.storage as StorageManager | undefined)?.persist === 'function',
  );
  test.skip(!supported, 'Browser ohne navigator.storage.persist');
  // Beim Start ohne gespeicherte Daten fragt die App nicht.
  expect(await count()).toBe(0);

  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill('80,4');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  await expect.poll(count).toBe(1);
});
