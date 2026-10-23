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
