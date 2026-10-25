import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Grundauswahl aus dem BLS 4.0 (Phase Ernährung §6, D-362): ohne Import sofort da, nachgeladen
 * und vom Service Worker vorab gespeichert. Ablauf: suchen → Ergebnis wählen → Menge in g oder
 * Stück → Nährwerte prüfen → hinzufügen.
 */

/** Richtwert für 1 Apfel aus der Liste (essbarer Anteil, D-365). */
const APFEL_G = 158;

const firstResult = (page: Page) =>
  page
    .getByRole('list', { name: /Treffer$/ })
    .getByRole('button')
    .first();

async function openAdd(page: Page, slot = 'breakfast') {
  await openPage(page, `/ernaehrung/hinzufuegen?mahlzeit=${slot}`);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

test('Grundauswahl: Suche nach Einzahl, Mehrzahl, Umlautschreibweise und österreichischen Namen (D-362)', async ({
  page,
}) => {
  await openAdd(page, 'lunch');
  const search = page.getByLabel('Lebensmittel suchen');
  for (const [query, expected] of [
    ['Apfel', /^Apfel\s*BLS\s*58 kcal/],
    ['Äpfel', /^Apfel\s*BLS/],
    ['Aepfel', /^Apfel\s*BLS/],
    ['Ei', /^Ei\s*BLS\s*135 kcal/],
    ['Eier', /^Ei\s*BLS/],
    ['Tomate', /^Paradeiser\s*BLS/],
    ['Tomaten', /^Paradeiser\s*BLS/],
    ['Paradeiser', /^Paradeiser\s*BLS/],
    ['Erdäpfel', /^Erdäpfel, roh\s*BLS/],
    ['Topfen', /^Topfen 10 %\s*BLS/],
  ] as const) {
    await search.fill(query);
    await expect(firstResult(page)).toHaveAccessibleName(expected);
  }
  // Keine vorgetäuschten Treffer: Äpfel sind keine Erdäpfel und kein Granatapfel.
  await search.fill('Äpfel');
  const results = page.getByRole('list', { name: /Treffer$/ });
  await expect(results.getByRole('button', { name: /^(Erdäpfel|Granatapfel)/ })).toHaveCount(0);
  // Beim Tippen findet schon der Wortanfang („Erdäp“ für Erdäpfel, „Parad“ für Paradeiser).
  await search.fill('Erdäp');
  await expect(firstResult(page)).toHaveAccessibleName(/^Erdäpfel, roh/);
  await search.fill('Parad');
  await expect(firstResult(page)).toHaveAccessibleName(/^Paradeiser\s*BLS/);
});

test('Grundauswahl: zwei Eier als Stück eintragen, Ring und weitere Nährwerte sofort (D-362, D-365)', async ({
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
  await expect(page.getByRole('img', { name: /^0 von 2\D?200 kcal/ })).toBeVisible();
  await page.getByRole('link', { name: 'Zu Frühstück hinzufügen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lebensmittel hinzufügen' }),
  ).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByLabel('Lebensmittel suchen').fill('Eier');
  await page.getByRole('button', { name: /^Ei\s*BLS/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Ei hinzufügen' });
  // Richtwert vorgewählt: „1 Stück · ca. 51 g“; Plus zählt in halben Stück.
  await expect(dialog.getByRole('radio', { name: 'Stück' })).toBeChecked();
  await expect(dialog.getByText('1 Stück · ca. 51 g')).toBeVisible();
  await expect(dialog.getByText(/^Richtwert: 51 g je Stück/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Gewicht anpassen' })).toBeVisible();
  const more = dialog.getByRole('button', { name: 'Anzahl erhöhen' });
  await more.click();
  await expect(dialog.getByText('1,5 Stück · ca. 77 g')).toBeVisible();
  await more.click();
  await expect(dialog.getByLabel('Anzahl (Stück)')).toHaveValue('2');
  await expect(dialog.getByText('2 Stück · ca. 102 g')).toBeVisible();
  await expect(dialog.getByRole('status')).toHaveText('138 kcal');
  const table = dialog.getByRole('table', { name: 'Nährwerte' });
  await expect(table.getByRole('columnheader', { name: 'für 2 Stück' })).toBeVisible();
  await expect(table.getByRole('row', { name: /^Eiweiß/ })).toContainText('13 g');
  await expect(dialog.getByText('Quelle: BLS 4.0, E111100 „Hühnerei roh“')).toBeVisible();
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  const breakfast = page.getByRole('region', { name: 'Frühstück' });
  await expect(breakfast.getByText('2 × Stück (102 g)')).toBeVisible();
  // Ring und weitere Nährwerte zeigen den Eintrag sofort, ohne Neuladen.
  await expect(page.getByRole('img', { name: /^138 von 2\D?200 kcal/ })).toBeVisible();
  await page.locator('summary[aria-label="Weitere Nährwerte"]').click();
  const extras = page.getByRole('group', { name: 'Weitere Nährwerte' });
  await expect(extras).toContainText('0,4 / 6 g');
  // Tagesziel 2.200 kcal: gesättigte Fettsäuren höchstens 24 g (D-369).
  await expect(extras).toContainText('2,5 / 24 g');
});

test('Grundauswahl: Apfel mit einem Tipp, eigenes Gewicht nach Neuladen gemerkt, zurücksetzbar (D-365)', async ({
  page,
}) => {
  test.slow();
  await openAdd(page, 'snacks');
  await page.getByLabel('Lebensmittel suchen').fill('Äpfel');
  await page.getByRole('button', { name: /^Apfel\s*BLS/ }).click();
  let dialog = page.getByRole('dialog', { name: 'Apfel hinzufügen' });
  // Richtwert vorgewählt, keine Frage nach dem Gewicht: ein Tipp auf „Hinzufügen“ genügt.
  await expect(dialog.getByRole('radio', { name: 'Stück' })).toBeChecked();
  await expect(dialog.getByText(`1 Stück · ca. ${APFEL_G} g`)).toBeVisible();
  await expect(dialog.getByLabel('Gewicht für 1 Stück in g')).toHaveCount(0);
  // Barrierefreiheit des Dialogs mit Umschaltung, Zähler, Richtwert und Quelle.
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  const axe = await new AxeBuilder({ page }).include('dialog[open]').withTags(tags).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Snacks' }).getByText(`1 × Stück (${APFEL_G} g)`),
  ).toBeVisible();

  // „Gewicht anpassen“: Feld mit Fokus, beim Hinzufügen gemerkt.
  await openAdd(page, 'snacks');
  await page.getByLabel('Lebensmittel suchen').fill('Apfel');
  await page.getByRole('button', { name: /^Apfel\s*BLS/ }).click();
  dialog = page.getByRole('dialog', { name: 'Apfel hinzufügen' });
  await dialog.getByRole('button', { name: 'Gewicht anpassen' }).click();
  const weight = dialog.getByLabel('Gewicht für 1 Stück in g');
  await expect(weight).toBeFocused();
  const axeAdjust = await new AxeBuilder({ page }).include('dialog[open]').withTags(tags).analyze();
  expect(axeAdjust.violations.map((violation) => violation.id)).toEqual([]);
  await weight.fill('180');
  await expect(dialog.getByText('1 Stück · ca. 180 g')).toBeVisible();
  await expect(dialog.getByRole('status')).toHaveText('104 kcal');
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(
    page.getByRole('region', { name: 'Snacks' }).getByText('1 × Stück (180 g)'),
  ).toBeVisible();

  // Nach Neuladen zeigt der nächste Apfel das eigene Gewicht; zurücksetzen geht.
  await page.reload();
  await openAdd(page, 'snacks');
  await page.getByLabel('Lebensmittel suchen').fill('Apfel');
  await page.getByRole('button', { name: /^Apfel\s*BLS/ }).click();
  dialog = page.getByRole('dialog', { name: 'Apfel hinzufügen' });
  await expect(dialog.getByRole('radio', { name: 'Stück' })).toBeChecked();
  await expect(dialog.getByText('1 Stück · ca. 180 g')).toBeVisible();
  await expect(
    dialog.getByText(`Dein Gewicht: 180 g je Stück, Richtwert ${APFEL_G} g`),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Auf Richtwert zurücksetzen' }).click();
  await expect(dialog.getByText(`1 Stück · ca. ${APFEL_G} g`)).toBeVisible();
});

test('Grundauswahl: Banane mit dem Richtwert für den essbaren Anteil (D-365)', async ({ page }) => {
  await openAdd(page, 'snacks');
  await page.getByLabel('Lebensmittel suchen').fill('Banane');
  await page.getByRole('button', { name: /^Banane\s*BLS/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Banane hinzufügen' });
  await expect(dialog.getByRole('radio', { name: 'Stück' })).toBeChecked();
  await expect(dialog.getByText('1 Stück · ca. 120 g')).toBeVisible();
  await expect(dialog.getByText('Richtwert: 120 g je Stück, ohne Schale')).toBeVisible();
  // 120 g Banane ohne Schale: 79 kcal je 100 g ergeben 95 kcal.
  await expect(dialog.getByRole('status')).toHaveText('95 kcal');
});

test('Grundauswahl: ohne Richtwert nur Gramm, ohne Frage (D-365)', async ({ page }) => {
  await openAdd(page, 'lunch');
  await page.getByLabel('Lebensmittel suchen').fill('Kürbis');
  await page.getByRole('button', { name: /^Kürbis, Hokkaido\s*BLS/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Kürbis, Hokkaido hinzufügen' });
  await expect(dialog.getByLabel('Menge in g')).toHaveValue('100');
  await expect(dialog.getByRole('radio')).toHaveCount(0);
  await expect(dialog.getByText(/Stück|Richtwert/)).toHaveCount(0);
});

test('Grundauswahl: offline suchen und eintragen (D-362)', async ({ page, context }) => {
  test.slow();
  await openPage(page, '/heute');
  // Erst wenn der Service Worker die Seite steuert; die Grundauswahl wurde noch nicht geladen.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await openAdd(page, 'dinner');
  await page.getByLabel('Lebensmittel suchen').fill('Paradeiser');
  await page.getByRole('button', { name: /^Paradeiser\s*BLS/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Paradeiser hinzufügen' });
  await dialog.getByText('Gramm', { exact: true }).click();
  await dialog.getByLabel('Menge in g').fill('150');
  await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(
    page.getByRole('region', { name: 'Abendessen' }).getByText('Paradeiser'),
  ).toBeVisible();
  await context.setOffline(false);
});
