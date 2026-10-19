import { expect, openPage, test } from './fixtures';

test('Ernährung: Ziel setzen, aus dem BLS protokollieren, nach Neuladen erhalten, auf „Heute“ sehen', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2200');
  await page.getByLabel('Eiweiß (g)').fill('140');
  await page.getByLabel('Kohlenhydrate (g)').fill('230');
  await page.getByLabel('Fett (g)').fill('75');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await expect(page.getByText(/^2\D?200 kcal$/)).toBeVisible();

  await openPage(page, '/ernaehrung');
  await page.getByRole('link', { name: 'Zu Mittagessen hinzufügen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lebensmittel hinzufügen' }),
  ).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByLabel('Lebensmittel suchen').fill('erdäpfel gekocht');
  await page
    .getByRole('button', { name: /^Kartoffel/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Menge in g').fill('200');
  // Alle Nährwerte je 100 g und für die Menge (AK-NUT-08).
  const nutrientTable = dialog.getByRole('table', { name: 'Nährwerte' });
  await expect(nutrientTable.getByRole('columnheader', { name: 'für 200 g' })).toBeVisible();
  await expect(nutrientTable.getByRole('row', { name: /davon Zucker/ })).toBeVisible();
  await expect(nutrientTable.getByRole('row', { name: /Salz/ })).toBeVisible();
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  const lunch = page.getByRole('region', { name: 'Mittagessen' });
  await expect(lunch.getByText('200 g')).toBeVisible();
  // Weitere Nährwerte sind dezent zugeklappt (D-272).
  await expect(page.getByRole('group', { name: 'Weitere Nährwerte' })).toBeHidden();
  await page.locator('summary[aria-label="Weitere Nährwerte"]').click();
  await expect(page.getByRole('group', { name: 'Weitere Nährwerte' })).toContainText('Zucker');
  await expect(page.getByRole('group', { name: 'Weitere Nährwerte' })).toContainText('Salz');

  await page.reload();
  await expect(page.getByRole('region', { name: 'Mittagessen' }).getByText('200 g')).toBeVisible();
  await expect(page.getByText(/\/ 2\D?200 kcal/).first()).toBeVisible();

  await openPage(page, '/heute');
  await expect(page.getByText('Ernährung heute')).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('link', { name: 'Ernährung' }),
  ).toBeVisible();
});

test('Lebensmitteldaten: Datei importieren, nach Neuladen in der Suche finden (D-263)', async ({
  page,
}) => {
  test.slow();
  const values = {
    fiber: 1,
    kcal: 98,
    fat: 3,
    saturatedFat: 1,
    carbs: 9,
    sugar: 1,
    protein: 7,
    salt: 0.4,
  };
  const content = JSON.stringify({
    fetchedAt: '2026-10-19 13:41',
    rows: [
      { code: 'C133000', source: 'BLS4.0', name: 'Hafer Flocken', ...values },
      { code: '0003384', source: 'ÖNWT-HH', name: 'Fisolen mit Speck', ...values },
      { code: '0003385', source: 'ÖNWT2.0', name: 'Altbrot, +++läuft aus', ...values },
    ],
  });
  await openPage(page, '/ernaehrung/lebensmittel');
  await page.getByLabel('Datei auswählen').setInputFiles({
    name: 'nuts-recherche.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content, 'utf8'),
  });
  const preview = page.getByRole('dialog', { name: 'Lebensmitteldaten importieren' });
  await expect(preview.getByText('1 Lebensmittel werden übernommen:')).toBeVisible();
  await preview.getByRole('button', { name: 'Importieren' }).click();
  await expect(page.getByText('1 Lebensmittel importiert', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 Lebensmittel importiert', { exact: true })).toBeVisible();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByLabel('Lebensmittel suchen').fill('fisolen');
  await expect(page.getByRole('button', { name: /^Fisolen mit Speck\s*ÖNWT/ })).toBeVisible();
});

test('Rezept: zwei Zutaten, je Portion gerechnet, nach Neuladen eintragen (D-267)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung/rezepte/neu');
  await page.getByLabel('Name').fill('Overnight Oats');
  await page.getByLabel('Portionen').fill('2');
  for (const [query, name, amount] of [
    ['haferflocken', /^Hafer Flocken/, '80'],
    ['banane roh', /^Banane roh/, '120'],
  ] as const) {
    await page.getByRole('button', { name: 'Zutat hinzufügen' }).click();
    const picker = page.getByRole('dialog', { name: 'Zutat hinzufügen' });
    await picker.getByLabel('Zutat suchen').fill(query);
    await picker.getByRole('button', { name }).first().click();
    const amountDialog = page.getByRole('dialog', { name: /: Menge$/ });
    await amountDialog.getByLabel('Menge in g').fill(amount);
    await amountDialog.getByRole('button', { name: 'Hinzufügen' }).click();
  }
  await expect(page.getByText(/Zutaten zusammen 200 g/)).toBeVisible();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('2 Portionen · 187 kcal je Portion')).toBeVisible();

  await page.reload();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await page.getByLabel('Lebensmittel suchen').fill('overnight');
  await page.getByRole('button', { name: /^Overnight Oats/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(
    page.getByRole('region', { name: 'Mittagessen' }).getByText('Overnight Oats'),
  ).toBeVisible();
});

test('Vorlage: Frühstück speichern, nach Neuladen mit einem Tipp eintragen (D-268)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Bezeichnung (optional)').fill('Müsli');
  await quick.getByLabel('Energie (kcal)').fill('350');
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByRole('button', { name: 'Frühstück als Vorlage speichern' }).click();
  await page
    .getByRole('dialog', { name: 'Als Vorlage speichern' })
    .getByRole('button', { name: 'Speichern' })
    .click();
  await expect(page.getByText('Vorlage „Frühstück“ gespeichert')).toBeVisible();

  await page.reload();
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=dinner');
  await page
    .getByRole('list', { name: 'Vorlagen' })
    .getByRole('button', { name: /Frühstück/ })
    .click();
  await page
    .getByRole('dialog', { name: 'Frühstück eintragen' })
    .getByRole('button', { name: 'Alle eintragen' })
    .click();
  await expect(page.getByRole('region', { name: 'Abendessen' }).getByText('Müsli')).toBeVisible();
});

test('Meine Küche: ein Knopf für Lebensmittel, Rezepte und Vorlagen (D-272)', async ({
  page,
}, testInfo) => {
  await openPage(page, '/ernaehrung');
  await page.getByRole('button', { name: 'Meine Küche' }).click();
  if (testInfo.project.name.includes('mobile')) {
    const sheet = page.getByRole('dialog', { name: 'Meine Küche' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('link', { name: /Rezepte/ }).click();
  } else {
    const menu = page.getByRole('group', { name: 'Meine Küche' });
    await expect(menu.getByRole('link', { name: /Vorlagen/ })).toBeVisible();
    // Mittig unter „Ziel“ und „Meine Küche“.
    const ziel = await page.getByRole('link', { name: 'Ziel', exact: true }).boundingBox();
    const kitchen = await page.getByRole('button', { name: 'Meine Küche' }).boundingBox();
    const box = await menu.boundingBox();
    if (!ziel || !kitchen || !box) throw new Error('Knöpfe fehlen');
    expect(Math.abs(box.x + box.width / 2 - (ziel.x + kitchen.x + kitchen.width) / 2)).toBeLessThan(
      2,
    );
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Meine Küche' }).click();
    await page
      .getByRole('group', { name: 'Meine Küche' })
      .getByRole('link', { name: /Rezepte/ })
      .click();
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Rezepte' })).toBeVisible();
});
