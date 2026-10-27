import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

// Fortschritt beim iPhone Duo (D-382): Die Erklärung der Kalorien-Schätzung steht unter den
// Kacheln statt in der Kachel; die Kacheln sind gleich hoch, die Zahlen stehen auf einer Linie.
// Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

test('Fortschritt: Kacheln gleich hoch, Erklärung der Kalorien darunter (D-382)', async ({
  page,
}) => {
  test.slow();
  // Erst das Körpergewicht, dann ein kurzes Training: Die Kalorien werden geschätzt.
  await openPage(page, '/fortschritt/gewicht');
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill('80');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  await openPage(page, '/training');
  await page.getByRole('button', { name: 'Freies Training starten' }).click();
  await page.getByRole('button', { name: 'Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByLabel('Übungen suchen').fill('beinpresse');
  await picker.getByRole('button', { name: /^Beinpresse Oberschenkel/ }).click();
  await expect(picker).toBeHidden();
  const set = 'Beinpresse, Arbeitssatz 1';
  await page.getByLabel(`Gewicht in kg, ${set}`).fill('100');
  await page.getByLabel(`Wiederholungen, ${set}`).fill('10');
  await page.getByRole('button', { name: `Satz erledigt, ${set}` }).click();
  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
  ).toBeVisible();

  await openPage(page, '/fortschritt');
  const figures = page.getByRole('region', { name: 'Zeitraum' });
  const list = figures.locator('dl');
  const tiles = list.locator(':scope > div');
  // Der Hinweis direkt unter den Kacheln. Welcher es ist, hängt an der Dauer: Ein Training unter
  // einer Sekunde hat die Dauer 0 und keine Schätzung (in der CI einmal so geschehen); geprüft
  // wird hier die Lage, nicht der Wortlaut.
  const note = list.locator('xpath=following-sibling::div[1]');
  for (const pose of ['zu', 'hoch', 'auf'] as const) {
    await setDuoPose(page, pose);
    await expect(tiles, pose).toHaveCount(4);
    await expect(note, pose).toHaveText(/Schätzung nach MET|Körpergewicht geschätzt/);
    const layout = await figures.evaluate((section) => {
      const dl = section.querySelector('dl');
      const rect = (el: Element) => el.getBoundingClientRect();
      const tileEls = dl ? [...dl.children] : [];
      return {
        heights: tileEls.map((el) => rect(el).height),
        // Unterkante der Zahl je Kachel: Die Zahlen stehen auf einer Linie je Reihe.
        values: tileEls.map((el) => {
          const value = el.querySelector('dd span span');
          return value ? Math.round(rect(value).bottom - rect(el).top) : null;
        }),
        listBottom: dl ? rect(dl).bottom : 0,
        hintInTile: dl
          ? ['Schätzung nach MET', 'Körpergewicht geschätzt', 'ohne Kalorien-Schätzung'].some(
              (text) => dl.textContent.includes(text),
            )
          : true,
      };
    });
    // Vorher war „Kalorien“ durch die Erklärung rund doppelt so hoch wie die anderen Kacheln.
    expect(Math.max(...layout.heights) - Math.min(...layout.heights), pose).toBeLessThanOrEqual(1);
    expect(new Set(layout.values).size, `${pose}: Zahlen auf einer Linie`).toBe(1);
    expect(layout.hintInTile, pose).toBe(false);
    // Die Erklärung steht unter den Kacheln.
    const noteBox = await note.boundingBox();
    expect(noteBox?.y ?? 0, pose).toBeGreaterThanOrEqual(layout.listBottom);
  }
});
