import { expect, openPage, test } from './fixtures';

test('Player: Vorschau, Übungsinfo, Ersetzen mit Alternativen, Umsortieren, Übungstimer (AK-TRN-09, AK-TRN-14)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  // Tagesvorschau mit geschätzter Dauer.
  const dayA = page.getByRole('region', { name: 'Tag A' });
  await expect(dayA.getByText(/^5 Übungen · 17 Sätze · ca\. \d+ min$/)).toBeVisible();
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A', exact: true })).toBeVisible();

  // Übungsinfo.
  await page.getByRole('button', { name: 'Übungsinfo, Kniebeuge mit Langhantel' }).click();
  const info = page.getByRole('dialog', { name: 'Kniebeuge mit Langhantel' });
  await expect(info.getByText('Hauptmuskeln')).toBeVisible();
  await expect(info.getByText('Gewicht und Wiederholungen')).toBeVisible();
  await info.getByRole('button', { name: 'Schließen' }).click();
  await expect(info).toBeHidden();

  // Umsortieren.
  await page
    .getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Nach oben' })).toBeDisabled();
  await page.getByRole('button', { name: 'Nach unten' }).click();
  await expect(page.getByRole('heading', { level: 2 }).nth(0)).toHaveText(
    'Bankdrücken mit Langhantel',
  );
  await page.getByRole('button', { name: 'Nach oben' }).click();
  await expect(page.getByRole('heading', { level: 2 }).nth(0)).toHaveText(
    'Kniebeuge mit Langhantel',
  );

  // Ersetzen mit Alternativen gleicher Muskelgruppe.
  await page.getByRole('button', { name: 'Übung ersetzen' }).click();
  const picker = page.getByRole('dialog', { name: 'Kniebeuge mit Langhantel ersetzen' });
  const alternatives = picker.getByRole('region', { name: 'Alternativen' });
  await expect(alternatives.getByRole('button').first()).toBeVisible();
  await alternatives
    .getByRole('button')
    .filter({ has: page.locator('span', { hasText: /^Beinpresse$/ }) })
    .first()
    .click();
  await expect(picker).toBeHidden();
  await expect(page.getByRole('region', { name: 'Beinpresse' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Kniebeuge mit Langhantel' })).toHaveCount(0);
  await expect(page.getByLabel('Gewicht in kg, Beinpresse, Arbeitssatz 1')).toBeVisible();

  // Übungstimer am Zeitsatz: starten, stoppen, Dauer gespeichert, übersteht Neuladen.
  const plankSet = 'Unterarmstütz (Plank), Arbeitssatz 1';
  await page.getByRole('button', { name: `Weitere Aktionen, ${plankSet}` }).click();
  await page.getByRole('button', { name: `Timer starten, ${plankSet}` }).click();
  await expect(page.getByRole('button', { name: `Timer stoppen, ${plankSet}` })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: `Timer stoppen, ${plankSet}` })).toContainText(
    /Timer stoppen 0:0[1-9]/,
  );
  await page.getByRole('button', { name: `Timer stoppen, ${plankSet}` }).click();
  await expect(page.getByLabel(`Zeit in Sekunden, ${plankSet}`)).toHaveValue(/^[1-9]$/);
  await page.getByRole('button', { name: `Satz erledigt, ${plankSet}` }).click();
  await expect(
    page.getByRole('button', { name: `Erledigt zurücknehmen, ${plankSet}` }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Training verwerfen' }).click();
  await page
    .getByRole('dialog', { name: 'Training verwerfen?' })
    .getByRole('button', { name: 'Verwerfen' })
    .click();
  await expect(page.getByText('Training verworfen')).toBeVisible();
});
