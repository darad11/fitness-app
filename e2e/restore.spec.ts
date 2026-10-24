import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/**
 * Wiederherstellen aus dem Export (A-14, D-345): Export, danach etwas ändern, die Datei wieder
 * einspielen. Vorher sichert die App den aktuellen Stand als zweite Datei. Fremde und
 * beschädigte Dateien lehnt sie ab, ohne etwas zu ändern.
 */
async function recordWeight(page: Page, value: string) {
  await openPage(page, '/fortschritt/gewicht');
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill(value);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
}

async function expectWeight(page: Page, value: string) {
  await openPage(page, '/mehr/profil');
  await expect(page.getByText(new RegExp(`Dein aktuelles Gewicht: ${value}\\skg`))).toBeVisible();
}

test('Sicherung wiederherstellen: prüfen, Zusammenfassung, vorher sichern, ersetzen (A-14, D-345)', async ({
  page,
}, testInfo) => {
  test.slow();
  await recordWeight(page, '80,4');

  // Export wie bisher.
  await openPage(page, '/mehr/daten');
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Jetzt exportieren' }).click();
  const backupPath = testInfo.outputPath('sicherung.json');
  await (await exported).saveAs(backupPath);

  // Danach ändert sich etwas.
  await recordWeight(page, '82,0');
  await expectWeight(page, '82,0');

  // Fremde und beschädigte Dateien: abgelehnt, nichts geändert.
  await openPage(page, '/mehr/daten');
  const card = page.getByRole('region', { name: 'Sicherung wiederherstellen' });
  const choose = card.getByLabel('Sicherung wählen');
  await choose.setInputFiles({
    name: 'fremd.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hallo":"welt"}'),
  });
  await expect(card.getByRole('status')).toHaveText(
    'Diese Datei ist keine Sicherung von FORM. An deinen Daten hat sich nichts geändert.',
  );
  const damaged = readFileSync(backupPath, 'utf8').replace('"body_weight"', '"photo"');
  await choose.setInputFiles({
    name: 'neuer.json',
    mimeType: 'application/json',
    buffer: Buffer.from(damaged),
  });
  await expect(card.getByRole('status')).toContainText('von einer neueren Version von FORM');
  await choose.setInputFiles({
    name: 'kaputt.json',
    mimeType: 'application/json',
    buffer: Buffer.from(readFileSync(backupPath, 'utf8').slice(0, 200)),
  });
  await expect(card.getByRole('status')).toContainText('Diese Datei lässt sich nicht lesen.');
  await expectWeight(page, '82,0');

  // Die echte Sicherung: Zusammenfassung, doppelte Bestätigung, vorher die Sicherung des Stands.
  await openPage(page, '/mehr/daten');
  await choose.setInputFiles(backupPath);
  const summary = card.getByRole('region', { name: 'In dieser Sicherung' });
  await expect(summary).toContainText('Trainings');
  await expect(summary).toContainText('Ernährungseinträge');
  await expect(summary).toContainText('Aufgaben');
  await card.getByRole('button', { name: 'Wiederherstellen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Daten ersetzen?' });
  await expect(dialog).toContainText('Zuerst sichert FORM den aktuellen Stand als Datei.');
  const before = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Sichern und ersetzen' }).click();
  const saved = await before;
  expect(saved.suggestedFilename()).toMatch(
    /^form-sicherung-vor-wiederherstellung-\d{4}-\d{2}-\d{2}-\d{4}\.json$/,
  );
  await expect(card.getByRole('status')).toHaveText(
    /^Die Sicherung vom .+ ist wiederhergestellt\.$/,
  );
  await expectWeight(page, '80,4');

  // Nach dem Neuladen bleibt der wiederhergestellte Stand.
  await page.reload();
  await expectWeight(page, '80,4');
});
