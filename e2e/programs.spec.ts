import { expect, openPage, test } from './fixtures';

test('Programm aktivieren, nächsten Tag von „Heute" starten, Zähler (AK-PRG-07, AK-PRG-08, TP-19, TP-21)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await expect(page.getByText(/^Wiedereinstieg nach längerer Pause/)).toBeVisible();
  await page.getByRole('button', { name: 'Programm aktivieren' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Trainingstag 1 von 32' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Tag A' }).getByText('Als Nächstes')).toBeVisible();

  // „Heute" zeigt den geplanten Tag; die Einheit startet daraus.
  await openPage(page, '/heute');
  await expect(page.getByText('Heute geplant')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Tag A' })).toBeVisible();
  await expect(page.getByText('Trainingstag 1 von 32 · Ganzkörper A/B, 4 Tage')).toBeVisible();
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A', exact: true })).toBeVisible();
  await expect(page.getByText('Ganzkörper A/B, 4 Tage · Woche 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Beinpresse').first()).toBeVisible();

  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Training beenden?' })
    .getByRole('button', { name: 'Training beenden' })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
  ).toBeVisible();
  await expect(
    page.getByText('Tag A · Ganzkörper A/B, 4 Tage · Trainingstag 1 von 32'),
  ).toBeVisible();
  // Abschluss nennt die nächste Einheit des Programms (FORM, D-315).
  await expect(page.getByRole('region', { name: 'Nächste Einheit' })).toContainText('Tag B');
  const doneLink = page.getByRole('link', { name: 'Zur Übersicht' });
  await expect(doneLink).toHaveAttribute('href', '/heute');
  await doneLink.dispatchEvent('click');

  // „Heute“ zählt weiter und bietet den Folgetag an.
  await expect(page.getByText('Heute geplant')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Tag B' })).toBeVisible();
  await expect(page.getByText('Trainingstag 2 von 32 · Ganzkörper A/B, 4 Tage')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anderen Tag wählen' })).toHaveAttribute(
    'href',
    '/training/vorlagen/compound_ab_4',
  );
  await openPage(page, '/training');
  await expect(page.getByText('Aktives Programm')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Tag B' })).toBeVisible();

  // Liste mit Etikett „Aktiv"; Programm beenden.
  await openPage(page, '/training/programme');
  await expect(page.getByText('Aktiv', { exact: true })).toBeVisible();
  await openPage(page, '/training/vorlagen/compound_ab_4');
  await page.getByRole('button', { name: 'Programm beenden' }).click();
  await expect(page.getByRole('button', { name: 'Programm aktivieren' })).toBeVisible();
  await expect(page.getByText('Als Nächstes')).toHaveCount(0);
});

test('Programm C: Wochen, Hinweise und Dropsets ohne Pause sind sichtbar', async ({ page }) => {
  await openPage(page, '/training/vorlagen/winterprogramm-2026');
  await expect(page.getByRole('heading', { level: 2, name: /^Woche \d$/ })).toHaveCount(8);
  // Neutraler Name und Beschreibung, keine Quellenangabe (F5, D-328).
  await expect(page.getByRole('heading', { level: 1, name: 'Winterprogramm 2026' })).toBeVisible();
  await expect(
    page.getByText(/^8 Wochen, 40 Trainingstage, fünf Einheiten pro Woche im Studio/),
  ).toBeVisible();
  await expect(page.getByText(/^Quelle: /)).toHaveCount(0);
  const day17 = page.getByRole('region', { name: /^Tag 17 · / });
  await expect(day17.getByRole('listitem').nth(3)).toContainText('1 Satz, 2 Drop-Sätze');
  await expect(day17.getByRole('listitem').nth(3)).toContainText(/Dropset: schwer beginnen/);
  await expect(day17.getByRole('listitem').nth(3)).toContainText(/Englisch: /);
  const day14 = page.getByRole('region', { name: /^Tag 14 · / });
  await expect(day14.getByRole('listitem').last()).toContainText(
    /Laufband1 Satz · 30:00 min · ohne Pause/,
  );
});

test('Dali’s PPLC: Wochen zum Aufklappen, Hinweis der leichten Woche, Wiederholung ab Woche 8 (D-505)', async ({
  page,
}) => {
  await openPage(page, '/training/vorlagen/dalis-pplc');
  await expect(page.getByRole('heading', { level: 1, name: 'Dali’s PPLC' })).toBeVisible();
  const weeks = page.locator('details');
  await expect(weeks).toHaveCount(21);
  // Ohne aktives Programm ist Woche 1 offen; nur ihre vier Tage stehen auf der Seite.
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: / heute trainieren$/ })).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Push' })).toContainText('Dumbbell Bench Press');

  // Woche 7 aufklappen: leichte Woche mit Hinweis am ersten Tag.
  const light = weeks.nth(6);
  await light.locator('summary').click();
  await expect(light).toHaveAttribute('open', '');
  const push = light.getByRole('region', { name: 'Push · leicht' });
  await expect(push).toContainText('Diese Woche ist leichter: etwa die Hälfte der Sätze.');
  await expect(page.getByRole('button', { name: / heute trainieren$/ })).toHaveCount(8);
  await light.locator('summary').click();
  await expect(page.getByRole('button', { name: / heute trainieren$/ })).toHaveCount(4);

  await expect(
    page.getByText(
      'Danach geht es mit Woche 8 weiter. Feste Ruhetage gibt es nicht: Du startest den nächsten Tag, wann es dir passt.',
    ),
  ).toBeVisible();
});

test('Dali’s PPLC: jede Übung mit Aufwärmsatz, in Woche 1 drei Arbeitssätze (D-531)', async ({
  page,
}) => {
  await openPage(page, '/training/vorlagen/dalis-pplc');
  await page.getByRole('button', { name: 'Push heute trainieren' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Push', exact: true })).toBeVisible();
  // Sieben Übungen mit je einem Aufwärmsatz und drei Arbeitssätzen.
  await expect(page.getByText('0 von 28 Sätzen')).toBeVisible();
  // Ein einziger Aufwärmsatz heißt ohne Zahl, die Arbeitssätze „1 von 3“ bis „3 von 3“ (D-537).
  for (const name of ['Dumbbell Bench Press', 'Dumbbell Incline Bench Press', 'Cable Fly']) {
    const done = (set: string) =>
      page.getByRole('button', { name: `Satz erledigt, ${name}, ${set}`, exact: true });
    await expect(done('Aufwärmsatz')).toHaveCount(1);
    await expect(done('Arbeitssatz 1 von 3')).toHaveCount(1);
    await expect(done('Arbeitssatz 3 von 3')).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: new RegExp(`^Satz erledigt, ${name}, Arbeitssatz 4`) }),
    ).toHaveCount(0);
  }
});

test('Dali’s PPLC: Player mit den englischen Übungsnamen, Bibliothek deutsch (D-506)', async ({
  page,
}) => {
  await openPage(page, '/training/vorlagen/dalis-pplc');
  const push = page.getByRole('region', { name: 'Push' });
  await expect(push.getByText('Dumbbell Bench Press')).toBeVisible();
  await expect(push.getByText(/^Englisch: /)).toHaveCount(0);
  await page.getByRole('button', { name: 'Push heute trainieren' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Push', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 }).nth(0)).toHaveText('Dumbbell Bench Press');
  await page.getByRole('button', { name: 'Übungsinfo, Dumbbell Bench Press' }).click();
  const info = page.getByRole('dialog', { name: 'Dumbbell Bench Press' });
  await expect(info.getByText('Hauptmuskeln')).toBeVisible();
  await info.getByRole('button', { name: 'Schließen' }).click();

  // Die Bibliothek bleibt deutsch; die Suche findet den englischen Namen.
  await openPage(page, '/uebungen');
  await page.getByLabel('Übungen suchen').fill('Machine Squat');
  const results = page.getByRole('list', { name: '2 Treffer' }).getByRole('listitem');
  await expect(results.first()).toContainText('Hackenschmidt-Kniebeuge');
});
