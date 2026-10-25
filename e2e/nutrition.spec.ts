import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/** Lebensmitteldaten wie aus der BLS-Recherche importieren (D-263); der gebündelte BLS entfällt (D-279). */
async function importFoods(page: Page) {
  await importRows(page, [
    ['0200001', 'Kartoffel geschält gekocht', [72, 2, 15, 0.8, 0.1, 0, 1.7, 0]],
    ['C133000', 'Hafer Flocken', [348, 13.22, 53.3, 0.74, 6.65, 1.34, 10.98, 0]],
    ['F503100', 'Banane roh', [79, 1.32, 15.89, 13.89, 0.4, 0.07, 2, 0]],
  ]);
}

/** Importiert Zeilen [Code, Name, Werte in der Reihenfolge kcal, Eiweiß, KH, Zucker, Fett, gesFS, Ballaststoffe, Salz]. */
async function importRows(page: Page, rows: [string, string, number[]][]) {
  const row = (code: string, name: string, v: number[]) => {
    const [kcal, protein, carbs, sugar, fat, saturatedFat, fiber, salt] = v;
    return {
      code,
      source: 'ÖNWT-HH',
      name,
      kcal,
      protein,
      carbs,
      sugar,
      fat,
      saturatedFat,
      fiber,
      salt,
    };
  };
  const content = JSON.stringify({ rows: rows.map(([code, name, v]) => row(code, name, v)) });
  await openPage(page, '/ernaehrung/lebensmittel');
  await page.getByLabel('Datei auswählen').setInputFiles({
    name: 'nuts-recherche.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content, 'utf8'),
  });
  await page
    .getByRole('dialog', { name: 'Lebensmitteldaten importieren' })
    .getByRole('button', { name: 'Importieren' })
    .click();
  await expect(
    page.getByText(`${String(rows.length)} Lebensmittel importiert`, { exact: true }),
  ).toBeVisible();
}

test('Ernährung: Ziel setzen, importiertes Lebensmittel protokollieren, nach Neuladen erhalten, auf „Heute“ sehen', async ({
  page,
}) => {
  test.slow();
  await importFoods(page);
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
  const extras = page.getByRole('group', { name: 'Weitere Nährwerte' });
  // Kompakt: je Zeile Name und „Ist / Referenz g“ (D-359, D-363).
  await expect(extras).toContainText('Zucker');
  await expect(extras).toContainText('Salz');
  for (const reference of ['/ 6 g', '/ 90 g', '/ 20 g', '/ 30 g'])
    await expect(extras).toContainText(reference);
  await expect(extras).not.toContainText('höchstens');
  // Barrierefreiheit der aufgeklappten Liste (die Prüfung je Seite sieht sie nur zugeklappt).
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  const axe = await new AxeBuilder({ page }).include('details[open]').withTags(tags).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  // Erklärung und Quellen im Blatt hinter dem Info-Symbol.
  await extras.getByRole('button', { name: 'Erklärung und Quellen' }).click();
  const sheet = page.getByRole('dialog', { name: 'Weitere Nährwerte' });
  await expect(sheet).toContainText('Salz: höchstens 6 g');
  await expect(sheet).toContainText('Ballaststoffe: mindestens 30 g');
  await expect(sheet).toContainText('VO (EU) Nr. 1169/2011, Anhang XIII');
  const axeSheet = await new AxeBuilder({ page }).include('dialog[open]').withTags(tags).analyze();
  expect(axeSheet.violations.map((violation) => violation.id)).toEqual([]);
  await sheet.getByRole('button', { name: 'Schließen' }).click();
  await expect(sheet).toBeHidden();

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
  await importFoods(page);
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

test('Suche: Mehrzahl, Umlautschreibweise und Synonyme, lose vor Marke (D-356)', async ({
  page,
}) => {
  test.slow();
  // Namen in der Schreibweise der Quelle; die Werte sind Testwerte, nur die Namen zählen hier.
  await importRows(page, [
    ['T000001', 'Tomate roh', [22, 1, 3, 3, 0.1, 0, 1.3, 0]],
    ['T000002', 'Hühnerei roh', [135, 13, 0.3, 0.3, 9, 2.4, 0, 0.4]],
    ['T000003', 'Apfel roh', [58, 0.4, 11.7, 10.5, 0.5, 0.2, 2.3, 0]],
    ['T000004', 'Apfelmus', [59, 0.3, 12.5, 11.6, 0.4, 0.2, 1.8, 0]],
    ['T000005', 'Erdäpfel gekocht', [72, 2, 15, 0.8, 0.1, 0, 1.7, 0]],
    ['T000006', 'Eierlikör', [280, 4, 30, 30, 6, 3, 0, 0.1]],
  ]);
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  const search = page.getByLabel('Lebensmittel suchen');
  const results = page.getByRole('list', { name: /Treffer$/ });
  // Die importierten Einträge stehen neben der Grundauswahl (D-362); gefunden werden sie über
  // Mehrzahl, Umlautschreibweise und Synonyme genauso.
  for (const [query, expected] of [
    ['Tomaten', /^Tomate roh\s*ÖNWT/],
    ['Paradeiser', /^Tomate roh\s*ÖNWT/],
    ['Eier', /^Hühnerei roh\s*ÖNWT/],
    ['Ei', /^Hühnerei roh\s*ÖNWT/],
    ['Aepfel', /^Apfel roh\s*ÖNWT/],
    ['Äpfel', /^Apfel roh\s*ÖNWT/],
    ['Kartoffeln', /^Erdäpfel gekocht\s*ÖNWT/],
  ] as const) {
    await search.fill(query);
    await expect(results.getByRole('button', { name: expected })).toBeVisible();
  }
});
