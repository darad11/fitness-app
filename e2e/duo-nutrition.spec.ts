import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, mainNav, openPage, test } from './fixtures';

// Ernährung beim iPhone Duo (D-381): aufgeklappt zwei Spalten, links Ring, Makros und weitere
// Nährwerte, rechts Mahlzeiten und Wasser; zugeklappt und im Zwischenmaß wie bisher eine Spalte.
// Handy-Profil.
test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height };
}

test('Ernährung aufgeklappt: Ring links, Mahlzeiten rechts und gleich zu sehen (D-381)', async ({
  page,
}) => {
  test.slow();
  await setDuoPose(page, 'auf');
  // Ein Schnelleintrag zum Frühstück.
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Bezeichnung (optional)').fill('Haferflocken');
  await quick.getByLabel('Energie (kcal)').fill('420');
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ernährung' })).toBeVisible();

  const stage = page.getByRole('region', { name: 'Gegessen' });
  const shortcuts = page.getByRole('navigation', { name: 'Ziel und Meine Küche' });
  const breakfast = page.getByRole('region', { name: 'Frühstück' });
  const snacks = page.getByRole('region', { name: 'Snacks' });
  const water = page.getByRole('region', { name: 'Wasser' });
  const add = breakfast.getByRole('link', { name: 'Zu Frühstück hinzufügen' });
  await expect(water).toBeVisible();

  // Links Ring und Knöpfe, rechts die Mahlzeiten und das Wasser.
  const right = (await box(stage)).right;
  for (const region of [breakfast, snacks, water]) {
    expect((await box(region)).left).toBeGreaterThan(right);
  }
  expect((await box(shortcuts)).top).toBeGreaterThanOrEqual((await box(stage)).bottom);
  expect((await box(shortcuts)).right).toBeLessThanOrEqual((await box(breakfast)).left);
  // Das Frühstück mit Eintrag und „Hinzufügen“ ist ohne Scrollen zu sehen, über der Tab-Leiste;
  // vorher begann die erste Mahlzeit bei 619 von 669 pt.
  await expect(breakfast.getByRole('button', { name: 'Haferflocken bearbeiten' })).toBeVisible();
  expect((await box(add)).bottom).toBeLessThanOrEqual((await box(mainNav(page))).top);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  // Weitere Nährwerte aufklappen, dann zuklappen und im Zwischenmaß: eine Spalte wie bisher,
  // die Mahlzeiten unter dem Ring; der aufgeklappte Bereich bleibt offen.
  await page.locator('summary[aria-label="Weitere Nährwerte"]').click();
  const extras = page.getByRole('group', { name: 'Weitere Nährwerte' });
  await expect(extras).toBeVisible();
  for (const pose of ['zu', 'hoch'] as const) {
    await setDuoPose(page, pose);
    await expect
      .poll(async () => (await box(breakfast)).top >= (await box(stage)).bottom, pose)
      .toBe(true);
    expect((await box(breakfast)).left, pose).toBeLessThan((await box(stage)).right);
    await expect(extras, pose).toBeVisible();
  }

  // Wieder aufgeklappt: zwei Spalten, der Bereich ist weiter offen, der Eintrag noch da.
  await setDuoPose(page, 'auf');
  await expect.poll(async () => (await box(breakfast)).left > (await box(stage)).right).toBe(true);
  await expect(extras).toBeVisible();
  await expect(breakfast.getByRole('button', { name: 'Haferflocken bearbeiten' })).toBeVisible();
});

/** Liegt die Mitte des Eintrags frei, also nicht unter der Tab-Leiste oder außerhalb? */
async function uncovered(page: Page, name: string) {
  return page.evaluate((label) => {
    const link = [...document.querySelectorAll('a')].find((a) =>
      a.textContent.trim().startsWith(label),
    );
    if (!link) return 'fehlt';
    const rect = link.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (y < 0 || y > window.innerHeight) return 'außerhalb';
    const hit = document.elementFromPoint(x, y);
    return hit && link.contains(hit) ? 'frei' : 'verdeckt';
  }, name);
}

test('Meine Küche aufgeklappt unten in der linken Spalte: das Menü ist ganz zu sehen (D-381)', async ({
  page,
}) => {
  await setDuoPose(page, 'auf');
  await openPage(page, '/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2200');
  await page.getByLabel('Eiweiß (g)').fill('140');
  await page.getByLabel('Kohlenhydrate (g)').fill('230');
  await page.getByLabel('Fett (g)').fill('75');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await openPage(page, '/ernaehrung');
  await expect(page.getByRole('region', { name: 'Wasser' })).toBeVisible();
  // Mit offenen weiteren Nährwerten ist die linke Spalte länger als die rechte eines leeren
  // Tags: Unter „Meine Küche“ reicht die Seite nicht, um das Menü über die Tab-Leiste zu
  // scrollen. Es öffnet deshalb nach oben.
  await page.locator('summary[aria-label="Weitere Nährwerte"]').click();
  await expect(page.getByRole('group', { name: 'Weitere Nährwerte' })).toBeVisible();
  await page.getByRole('button', { name: /Meine Küche/ }).click();
  for (const name of ['Meine Lebensmittel', 'Rezepte', 'Einkaufsliste', 'Vorlagen']) {
    await expect.poll(() => uncovered(page, name), name).toBe('frei');
  }
});
