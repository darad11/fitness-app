import { expect, openPage, test } from './fixtures';

test('Tagesaufgaben: hinzufügen, abhaken, neu laden, nächster Tag wieder offen (AH-03, D-283)', async ({
  page,
}) => {
  test.slow();
  await page.clock.install({ time: new Date('2026-10-20T08:00:00+02:00') });
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Tagesaufgaben' })).toContainText(
    'Leg dir eigene Aufgaben',
  );
  await page.getByRole('link', { name: 'Aufgabe hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tagesaufgaben' })).toBeVisible();
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  for (const [index, name] of ['30 min Cardio', '2 l Wasser', 'Lesen'].entries()) {
    // Erst wenn die vorige Aufgabe gespeichert und das Feld geleert ist, die nächste eintippen;
    // sonst leerte das Zurücksetzen nach dem Speichern manchmal den neuen Namen (WebKit).
    await page.getByLabel('Name der Aufgabe').fill(name);
    await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await expect(list.getByRole('button', { name: / bearbeiten$/ })).toHaveCount(index + 1);
    await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  }
  // Reihenfolge: „Lesen“ nach oben.
  await list.getByRole('button', { name: 'Nach oben, Lesen' }).click();
  await expect(list.getByRole('button', { name: / bearbeiten$/ })).toHaveText([
    '30 min Cardio',
    'Lesen',
    '2 l Wasser',
  ]);

  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  await expect(card.getByRole('checkbox')).toHaveCount(3);
  // Direkt unter „Schritte“, Verwalten über das Symbol oben rechts.
  await expect(page.getByRole('region', { name: 'Schritte', exact: true })).toBeVisible();
  const order = await page
    .getByRole('main')
    .locator('section')
    .evaluateAll((sections) =>
      sections.map((s) => s.getAttribute('aria-labelledby') && s.querySelector('h2')?.textContent),
    );
  expect(order[order.indexOf('Schritte') + 1]).toBe('Tagesaufgaben');
  await expect(card.getByRole('link', { name: 'Tagesaufgaben verwalten' })).toHaveAttribute(
    'href',
    '/heute/aufgaben',
  );
  await card.getByText('30 min Cardio').click();
  await expect(card).toContainText('1 von 3 erledigt');
  await card.getByText('2 l Wasser').click();
  await expect(card).toContainText('2 von 3 erledigt');
  await expect(card).not.toContainText('Serie');

  // Neu laden am selben Tag setzt nichts zurück.
  await page.reload();
  await expect(card.getByRole('checkbox', { name: '30 min Cardio' })).toBeChecked();
  await expect(card).toContainText('2 von 3 erledigt');

  // Nächster Tag: alles offen, ohne dass gestern verloren geht.
  await page.clock.setSystemTime(new Date('2026-10-21T08:00:00+02:00'));
  await page.reload();
  await expect(card.getByRole('checkbox')).toHaveCount(3);
  await expect(card.getByRole('checkbox', { name: '30 min Cardio' })).not.toBeChecked();
  await expect(card).toContainText('0 von 3 erledigt');
  const yesterday = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('fitness');
        open.onerror = () => {
          reject(new Error('IndexedDB'));
        };
        open.onsuccess = () => {
          const read = open.result
            .transaction('habitLogs')
            .objectStore('habitLogs')
            .getAll() as IDBRequest<{ dayKey: string; done: boolean }[]>;
          read.onsuccess = () => {
            resolve(read.result.filter((log) => log.dayKey === '2026-10-20' && log.done).length);
            open.result.close();
          };
        };
      }),
  );
  expect(yesterday).toBe(2);
});

test('Tagesaufgaben: kleiner Bildschirm, nichts ragt über den Rand (D-283)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openPage(page, '/heute/aufgaben');
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  for (const [index, name] of [
    'Eine ziemlich lange Aufgabe mit vielen Wörtern',
    'Wasser',
  ].entries()) {
    await page.getByLabel('Name der Aufgabe').fill(name);
    await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await expect(list.getByRole('button', { name: / bearbeiten$/ })).toHaveCount(index + 1);
    await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  }
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow()).toBeLessThanOrEqual(0);
  await openPage(page, '/heute');
  await expect(
    page.getByRole('region', { name: 'Tagesaufgaben' }).getByRole('checkbox'),
  ).toHaveCount(2);
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test('Tagesaufgaben: abhaken ohne Netz, bleibt nach dem Neuladen (D-283)', async ({
  page,
  context,
}) => {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill('Wasser');
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(page.getByRole('button', { name: 'Wasser bearbeiten' })).toBeVisible();
  await openPage(page, '/heute');
  // Wie in resilience.spec.ts: erst wenn der Service Worker die Seite steuert, lädt sie offline
  // nachgeladene Teile aus dem Cache (sonst meldet WebKit einen Ladefehler).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  await expect(card.getByRole('checkbox', { name: 'Wasser' })).toBeVisible();
  await context.setOffline(true);
  await card.getByText('Wasser').click();
  await expect(card).toContainText('Alles erledigt');
  await context.setOffline(false);
  await page.reload();
  await expect(card.getByRole('checkbox', { name: 'Wasser' })).toBeChecked();
});

test('Tagesaufgaben: Fortschritt über drei Tage, Übersicht und Auswertung (D-284)', async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 360, height: 760 });
  await page.clock.install({ time: new Date('2026-10-18T09:00:00+02:00') });
  await openPage(page, '/heute/aufgaben');
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  for (const [index, name] of ['Wasser', 'Lesen'].entries()) {
    await page.getByLabel('Name der Aufgabe').fill(name);
    await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await expect(list.getByRole('button', { name: / bearbeiten$/ })).toHaveCount(index + 1);
    await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  }
  // Tag 1: beides, Tag 2: nur Wasser, Tag 3 (heute): Wasser.
  const tick = async (names: string[]) => {
    await openPage(page, '/heute');
    const card = page.getByRole('region', { name: 'Tagesaufgaben' });
    for (const name of names) {
      await card.getByText(name, { exact: true }).click();
      await expect(card.getByRole('checkbox', { name })).toBeChecked();
    }
  };
  await tick(['Wasser', 'Lesen']);
  await page.clock.setSystemTime(new Date('2026-10-19T09:00:00+02:00'));
  await tick(['Wasser']);
  await page.clock.setSystemTime(new Date('2026-10-20T09:00:00+02:00'));
  await tick(['Wasser']);

  await openPage(page, '/heute/aufgaben');
  const stats = page.getByRole('region', { name: 'Fortschritt' });
  // Ohne heute: 3 von 4 fälligen erledigt; Serie: nur Tag 1 vollständig, Tag 2 nicht.
  await expect(stats.getByRole('definition').nth(0)).toHaveText('1 / 2');
  await expect(stats.getByRole('definition').nth(1)).toContainText('75 %');
  await expect(stats.getByRole('img', { name: /Balkendiagramm, 3 Tage/ })).toBeVisible();
  const perTask = stats.getByRole('region', { name: 'Je Aufgabe' });
  await expect(perTask.getByRole('rowheader')).toHaveText(['Wasser', 'Lesen']);
  await expect(perTask.getByText(/an 2 von 2 fälligen Tagen/)).toBeVisible();
  await expect(perTask.getByText(/an 1 von 2 fälligen Tagen/)).toBeVisible();
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow()).toBeLessThanOrEqual(0);

  await perTask.getByRole('link', { name: 'Lesen: Auswertung öffnen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lesen' })).toBeVisible();
  await expect(page.getByRole('definition').nth(0)).toContainText('50 %');
  await expect(page.getByRole('list', { name: /Kalender/ }).getByTitle(/: erledigt$/)).toHaveCount(
    1,
  );
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test('Tagesaufgaben: nur an Wochentagen fällig, mit Training abhaken (D-285)', async ({ page }) => {
  test.slow();
  // Montag, 19.10.2026
  await page.clock.install({ time: new Date('2026-10-19T09:00:00+02:00') });
  await openPage(page, '/heute/aufgaben');
  const list = page.getByRole('region', { name: 'Meine Aufgaben' });
  for (const [index, name] of ['Training', 'Wasser'].entries()) {
    await page.getByLabel('Name der Aufgabe').fill(name);
    await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
    await expect(list.getByRole('button', { name: / bearbeiten$/ })).toHaveCount(index + 1);
    await expect(page.getByLabel('Name der Aufgabe')).toHaveValue('');
  }
  await list.getByRole('button', { name: 'Training bearbeiten' }).click();
  for (const day of ['Di', 'Do', 'Sa', 'So']) {
    await list.getByRole('button', { name: `${day} fällig` }).click();
  }
  await expect(list.getByRole('button', { name: 'Di fällig' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await list.getByText('Mit Training abhaken').click();
  await expect(list.getByRole('switch', { name: 'Mit Training abhaken' })).toBeChecked();
  await list.getByRole('button', { name: 'Speichern' }).click();
  await expect(list.getByRole('button', { name: 'Training bearbeiten' })).toContainText(
    'Mo, Mi, Fr · mit Training',
  );

  // Dienstag: Training nicht fällig.
  await page.clock.setSystemTime(new Date('2026-10-20T09:00:00+02:00'));
  await openPage(page, '/heute');
  const card = page.getByRole('region', { name: 'Tagesaufgaben' });
  await expect(card.getByRole('checkbox')).toHaveCount(1);
  await expect(card.getByRole('checkbox', { name: 'Wasser' })).toBeVisible();

  // Mittwoch: fällig; eine nachgetragene Aktivität hakt es ab.
  await page.clock.setSystemTime(new Date('2026-10-21T09:00:00+02:00'));
  await openPage(page, '/heute');
  await expect(card.getByRole('checkbox', { name: 'Training' })).not.toBeChecked();
  await openPage(page, '/training/nachtragen');
  await page.getByText('Aktivität', { exact: true }).first().click();
  await page.getByLabel('Art der Aktivität').selectOption('walk');
  await page.getByLabel('Dauer in Minuten').fill('30');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gehen' })).toBeVisible();
  await openPage(page, '/heute');
  await expect(card.getByRole('checkbox', { name: 'Training' })).toBeChecked();
  // Zurücknehmen bleibt zurückgenommen.
  await card.getByText('Training', { exact: true }).click();
  await expect(card.getByRole('checkbox', { name: 'Training' })).not.toBeChecked();
  await page.reload();
  await expect(card.getByRole('checkbox', { name: 'Wasser' })).toBeVisible();
  await expect(card.getByRole('checkbox', { name: 'Training' })).not.toBeChecked();
});
