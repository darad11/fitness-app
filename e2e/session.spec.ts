import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

const toSec = (text: string | null) => {
  const [m = 0, s = 0] = (text ?? '0:00').split(':').map(Number);
  return m * 60 + s;
};

async function expectNoAxeViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(
      (v) => `${where} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([]);
}

test('Training aus einer Vorlage: erfassen, neu laden, beenden (AK-TRN-01, -06, -07, -16, -19)', async ({
  page,
}) => {
  // Langer Ablauf mit Neuladen und mehreren axe-Prüfungen: dreifaches Zeitlimit für langsame CI-Runner.
  test.slow();
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tag A', exact: true })).toBeVisible();
  await expect(page.getByText('0 von 17 Sätzen')).toBeVisible();
  // Vollbild: keine Hauptnavigation im Player.
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);

  const warmup = 'Kniebeuge mit Langhantel, Aufwärmsatz 1';
  const done = page.getByRole('button', { name: `Satz erledigt, ${warmup}` });
  // Ohne Gewicht verlangt „erledigt" eine Eingabe; die Wiederholungen kommen aus dem festen Ziel.
  await done.click();
  await expect(page.getByRole('alert').first()).toContainText('Trag zuerst die Werte ein');
  await page.getByLabel(`Gewicht in kg, ${warmup}`).fill('40');
  await done.click();
  await expect(
    page.getByRole('button', { name: `Erledigt zurücknehmen, ${warmup}` }),
  ).toBeVisible();
  await expect(page.getByText('1 von 17 Sätzen')).toBeVisible();
  await expectNoAxeViolations(page, 'Player');

  // Pausentimer nach „erledigt" (AK-TRN-10, -11): Restzeit, ±15 s, Vollansicht, Neuladen, Überspringen.
  // ±15 s in der großen Pause: Dort stehen sie in jeder Fenstergröße; bei niedrigem Fenster (unter
  // 45 rem, z. B. iPhone in Safari) ist die kleine Pause einzeilig ohne ±15 s (D-380).
  const rest = page.getByRole('region', { name: 'Pause' });
  const timer = rest.getByRole('timer');
  await expect(timer).toHaveText(/^\d:\d\d$/);
  const before = toSec(await timer.textContent());
  await page.getByRole('button', { name: 'Pause groß anzeigen' }).click();
  await expect(page.getByRole('button', { name: 'Pause klein anzeigen' })).toBeVisible();
  await rest.getByRole('button', { name: '15 s weniger' }).click();
  await expect.poll(async () => toSec(await timer.textContent())).toBeLessThanOrEqual(before - 14);
  await expectNoAxeViolations(page, 'Pause groß');
  await page.getByRole('button', { name: 'Pause klein anzeigen' }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Pause' }).getByRole('timer')).toHaveText(
    /^\d:\d\d$/,
  );
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await expect(page.getByRole('region', { name: 'Pause' })).toHaveCount(0);

  // Erledigt übersteht ein sofortiges Neuladen (AK-TRN-16).
  await page.reload();
  await expect(
    page.getByRole('button', { name: `Erledigt zurücknehmen, ${warmup}` }),
  ).toBeVisible();
  await expect(page.getByLabel(`Gewicht in kg, ${warmup}`)).toHaveValue('40');
  await expect(page.getByLabel(`Wiederholungen, ${warmup}`)).toHaveValue('10');

  // Eine Eingabe ist nach 0,6 s gespeichert (AK-TRN-16), mit Komma.
  const working = 'Kniebeuge mit Langhantel, Arbeitssatz 1';
  await page.getByLabel(`Gewicht in kg, ${working}`).fill('62,5');
  await page.getByLabel(`Wiederholungen, ${working}`).fill('8');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByLabel(`Gewicht in kg, ${working}`)).toHaveValue('62,5');
  await expect(page.getByLabel(`Wiederholungen, ${working}`)).toHaveValue('8');

  // Rückgängig behält die Werte (AK-TRN-07).
  await page.getByRole('button', { name: `Satz erledigt, ${working}` }).click();
  await page.getByRole('button', { name: `Erledigt zurücknehmen, ${working}` }).click();
  await expect(page.getByRole('button', { name: `Satz erledigt, ${working}` })).toBeVisible();
  await expect(page.getByLabel(`Gewicht in kg, ${working}`)).toHaveValue('62,5');
  await page.getByRole('button', { name: `Satz erledigt, ${working}` }).click();

  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Training beenden?' });
  await expect(dialog).toContainText('15 Sätze sind noch offen.');
  await expectNoAxeViolations(page, 'Dialog');
  await dialog.getByRole('button', { name: 'Training beenden' }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
  ).toBeVisible();
  // Zeile aus der Mikrotext-Tabelle (F4, D-318); die Dauer hängt vom Tempo des Testlaufs ab.
  await expect(
    page.getByText(
      /^(Weniger als eine Minute|1 Minute|\d+ Minuten), 5 Übungen, 2 Sätze\. Das warst du\.$/,
    ),
  ).toBeVisible();
  // Kacheln Dauer, Übungen, Sätze; danach Gesamtvolumen (FORM, D-315).
  await expect(page.getByText('Sätze', { exact: true })).toBeVisible();
  await expect(page.getByRole('definition').nth(2)).toHaveText('2');
  // Im Wert steht danach der Hinweis „Gewicht × Wiederholungen ohne Aufwärmsätze“.
  await expect(page.getByRole('definition').nth(3)).toContainText('500 kg');
  await expectNoAxeViolations(page, 'Abschluss');
  // „Zur Übersicht" per Ereignis statt Zeigerklick: Im CI-Chromium (Pixel-7-Emulation) meldet die
  // Treffererkennung an dieser Stelle fälschlich <main>; lokal und in WebKit klappt der Klick.
  const doneLink = page.getByRole('link', { name: 'Zur Übersicht' });
  await expect(doneLink).toHaveAttribute('href', '/heute');
  await doneLink.dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Freies Training starten' })).toBeVisible();

  // Verlauf mit Liste nach Woche und Detail (AK-HIS-01, AK-HIS-02).
  await openPage(page, '/training');
  await page.getByRole('main').getByRole('link', { name: 'Verlauf' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /^Woche ab/ })).toBeVisible();
  const entry = page.getByRole('link', { name: /Tag A · Ganzkörper A\/B/ });
  await expect(entry).toContainText('2 Sätze · 500 kg');
  await expectNoAxeViolations(page, 'Verlauf');
  await entry.click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tag A · Ganzkörper A/B' }),
  ).toBeVisible();
  const squatRegion = page.getByRole('region', { name: 'Kniebeuge mit Langhantel' });
  await expect(squatRegion.getByRole('listitem').first()).toContainText(
    'Aufwärmsatz 140 × 10Erledigt',
  );
  await expect(squatRegion.getByRole('listitem').nth(2)).toContainText(
    'Arbeitssatz 162,5 × 8Erledigt',
  );
  await expectNoAxeViolations(page, 'Verlauf Detail');

  // Beim nächsten Mal erscheinen die Vorwerte (AK-TRN-05).
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
  await expect(page.getByLabel(`Gewicht in kg, ${working}`)).toHaveAttribute('placeholder', '62,5');
  await expect(page.getByText(/^Letztes Mal: /).first()).toBeVisible();
});

test('Freies Training: Übung auswählen, verwerfen und rückgängig machen (AK-TRN-02, -21, -22)', async ({
  page,
}) => {
  test.slow();
  await openPage(page, '/mehr/einstellungen');
  // Trainingseinstellungen wirken sofort (AK-SET-02): Standardpause 60 s.
  await page.getByRole('combobox', { name: 'Standardpause' }).selectOption('60');
  await expect(page.getByRole('combobox', { name: 'Standardpause' })).toHaveValue('60');
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();
  await expect(page.getByText('Noch keine Übung.')).toBeVisible();

  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill('klimmz unterst');
  await picker.getByRole('button', { name: /^Klimmzüge mit Unterstützung/ }).click();
  await expect(picker).toBeHidden();
  const set = 'Klimmzüge mit Unterstützung, Arbeitssatz 1';
  await page.getByLabel(`Entlastung in kg, ${set}`).fill('20');
  await page.getByLabel(`Wiederholungen, ${set}`).fill('6');
  await page.getByRole('button', { name: `Satz erledigt, ${set}` }).click();
  await expect(page.getByText('1 von 1 Sätzen')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pause' }).getByRole('timer')).toHaveText(
    /^(1:00|0:5\d)$/,
  );
  await expectNoAxeViolations(page, 'Player dunkel');

  await page.getByRole('button', { name: 'Training verwerfen' }).click();
  await page
    .getByRole('dialog', { name: 'Training verwerfen?' })
    .getByRole('button', { name: 'Verwerfen' })
    .click();
  await expect(page.getByText('Training verworfen')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();
  await expect(page.getByLabel(`Entlastung in kg, ${set}`)).toHaveValue('20');

  // Ein zweiter Start bietet das Fortsetzen an (AK-TRN-22).
  await openPage(page, '/training');
  await expect(page.getByRole('link', { name: 'Training fortsetzen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Freies Training starten' })).toHaveCount(0);

  // Leiste „Training läuft" auf anderen Seiten mit Rücksprung; „Heute" zeigt die Karte (AK-TRN-17, AK-DSH-01).
  await openPage(page, '/mehr');
  const banner = page.getByRole('status').filter({ hasText: 'Training läuft' });
  await expect(banner).toContainText('1 von 1 Sätzen');
  await expectNoAxeViolations(page, 'Leiste Training läuft');
  await banner.getByRole('link', { name: 'Training fortsetzen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Freies Training' })).toBeVisible();
  await openPage(page, '/heute');
  await expect(page.getByRole('region', { name: 'Freies Training' })).toContainText(
    '1 von 1 Sätzen',
  );
  await expect(page.getByRole('status').filter({ hasText: 'Training läuft' })).toHaveCount(0);
});
