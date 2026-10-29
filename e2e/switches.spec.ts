import type { Locator, Page } from '@playwright/test';
import { expect, openPage, pageOverflowX, test } from './fixtures';

/**
 * Alle Ein-/Aus-Schalter der App (F5, D-322; Liste in `docs/testing.md` Abschnitt „Schalter“).
 * Getippt wird auf den Schalter selbst, nicht auf seine Beschriftung: Bis F5 war nur die
 * Beschriftung mit dem Kontrollkästchen verbunden, ein Tipp auf die Schalterfläche bewirkte
 * nichts. Je Schalter: Tippfläche mindestens 44 × 44, Zustand sofort sichtbar, gespeichert und
 * nach dem Neuladen unverändert.
 */

/** Tippt (Handy) bzw. klickt (Desktop) auf die Schalterfläche und prüft vorher die Tippfläche. */
async function tapSwitch(scope: Page | Locator, name: string, touch: boolean) {
  const control = scope.getByRole('switch', { name, exact: true });
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box?.width ?? 0, `Tippfläche „${name}“ breit genug`).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0, `Tippfläche „${name}“ hoch genug`).toBeGreaterThanOrEqual(44);
  if (touch) await control.tap();
  else await control.click();
}

/** Neue Aufgabe anlegen und ihre Detailansicht öffnen (Einstellungen, D-335). */
async function addTask(page: Page, name: string) {
  await openPage(page, '/heute/aufgaben');
  await page.getByLabel('Name der Aufgabe').fill(name);
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await page
    .getByRole('region', { name: 'Meine Aufgaben' })
    .getByRole('link', { name: `${name} bearbeiten` })
    .click();
  return settingsOf(page);
}

/** Einstellungen in der Detailansicht der Aufgabe. */
function settingsOf(page: Page) {
  return page.getByRole('region', { name: 'Einstellungen' });
}

test('Tagesaufgabe: „Mit Training abhaken“ per Tipp auf den Schalter, gespeichert nach Neuladen', async ({
  page,
  hasTouch,
}) => {
  const settings = await addTask(page, 'Lesen');
  await tapSwitch(settings, 'Mit Training abhaken', hasTouch);
  await expect(settings.getByRole('switch', { name: 'Mit Training abhaken' })).toBeChecked();
  await settings.getByRole('button', { name: 'Speichern' }).click();
  await expect(settings.getByText('Gespeichert.')).toBeVisible();
  await page.reload();
  await expect(
    settingsOf(page).getByRole('switch', { name: 'Mit Training abhaken' }),
  ).toBeChecked();
  await expect(
    settingsOf(page).getByRole('switch', { name: 'Mit Wasserziel abhaken' }),
  ).not.toBeChecked();
  await openPage(page, '/heute/aufgaben');
  await expect(page.getByRole('link', { name: 'Lesen bearbeiten' })).toHaveAccessibleDescription(
    'Täglich · mit Training abhaken',
  );
});

test('Tagesaufgabe: „Mit Wasserziel abhaken“ per Tipp und Tastatur, nur eine Regel zugleich', async ({
  page,
  hasTouch,
}) => {
  const list = await addTask(page, 'Trinken');
  await tapSwitch(list, 'Mit Training abhaken', hasTouch);
  await tapSwitch(list, 'Mit Wasserziel abhaken', hasTouch);
  await expect(list.getByRole('switch', { name: 'Mit Wasserziel abhaken' })).toBeChecked();
  await expect(list.getByRole('switch', { name: 'Mit Training abhaken' })).not.toBeChecked();
  // Tastatur: Leertaste schaltet aus und wieder ein.
  const water = list.getByRole('switch', { name: 'Mit Wasserziel abhaken' });
  // Chromium hält ein angetipptes Element bis zu 150 ms „aktiv“ und hebt das per Zeitgeber auf.
  // Fiel das zwischen Drücken und Loslassen der Leertaste, löste die Taste nichts aus: der
  // einmalige Fehlschlag aus F6 §7 (Stabilität §2, D-344). Erst nach dem Tipp weiter.
  await expect.poll(() => water.evaluate((element) => element.matches(':active'))).toBe(false);
  await water.focus();
  await page.keyboard.press('Space');
  await expect(water).not.toBeChecked();
  // Der Fokus bleibt am Schalter. Schlug einmal fehl, ohne dass sich das nachstellen ließ
  // (Bericht F6 §7); diese Prüfung zeigt dann, ob der Fokus verloren ging.
  await expect(water).toBeFocused();
  await page.keyboard.press('Space');
  await expect(water).toBeChecked();
  await list.getByRole('button', { name: 'Speichern' }).click();
  await expect(list.getByText('Gespeichert.')).toBeVisible();
  await page.reload();
  await expect(
    settingsOf(page).getByRole('switch', { name: 'Mit Wasserziel abhaken' }),
  ).toBeChecked();
});

for (const width of [360, 390]) {
  test(`Tagesaufgabe bearbeiten: Feld, sieben Wochentage und Schalter bleiben in der Karte „Einstellungen“ (${String(width)} pt)`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Handy-Breiten');
    await page.setViewportSize({ width, height: 844 });
    const list = await addTask(page, 'Schritte');
    const card = await list.boundingBox();
    expect(card).not.toBeNull();
    if (!card) return;
    const inside = async (locator: Locator, label: string) => {
      const box = await locator.boundingBox();
      expect(box, label).not.toBeNull();
      if (!box) return;
      expect(box.x, `${label} links`).toBeGreaterThanOrEqual(card.x);
      expect(box.x + box.width, `${label} rechts`).toBeLessThanOrEqual(card.x + card.width + 0.5);
    };
    await inside(list.getByLabel('Name der Aufgabe'), 'Namensfeld');
    const days = list.getByRole('button', { name: / fällig$/ });
    await expect(days).toHaveCount(7);
    const tops = new Set<number>();
    for (let i = 0; i < 7; i += 1) {
      const day = days.nth(i);
      await inside(day, `Wochentag ${String(i + 1)}`);
      tops.add(Math.round((await day.boundingBox())?.y ?? -1));
    }
    expect(tops.size, 'sieben Wochentage in einer Zeile').toBe(1);
    for (const name of ['Mit Training abhaken', 'Mit Wasserziel abhaken']) {
      await inside(list.getByRole('switch', { name }), name);
    }
    // „Pausieren“ und „Löschen“ als Paar in einer Zeile, nicht auf zwei Zeilen verteilt (F6 §9).
    const pause = list.getByRole('button', { name: 'Pausieren' });
    const remove = list.getByRole('button', { name: 'Löschen' });
    await inside(list.getByRole('button', { name: 'Speichern' }), 'Speichern');
    await inside(pause, 'Pausieren');
    await inside(remove, 'Löschen');
    expect(
      Math.round((await pause.boundingBox())?.y ?? -1),
      'Pausieren und Löschen in einer Zeile',
    ).toBe(Math.round((await remove.boundingBox())?.y ?? -2));
    // Kein waagrechtes Scrollen der Seite.
    expect(await pageOverflowX(page), 'waagrechter Überlauf').toBeLessThanOrEqual(0);
  });
}

async function addWeight(page: Page, kg: string) {
  await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
  await sheet.getByLabel('Gewicht in kg').fill(kg);
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
}

test('Körpergewicht: „Als Tabelle“ wechselt zur Tabelle, bleibt beim Zeitraum und nach Neuladen', async ({
  page,
  hasTouch,
}) => {
  await openPage(page, '/fortschritt/gewicht');
  await addWeight(page, '80,5');
  await expect(page.getByRole('img', { name: /Gewichtsverlauf/ })).toBeVisible();
  await tapSwitch(page, 'Als Tabelle', hasTouch);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByText('30 Tage', { exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Als Tabelle' })).toBeChecked();
  await expect(page.getByRole('table')).toBeVisible();
  await tapSwitch(page, 'Als Tabelle', hasTouch);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /Gewichtsverlauf/ })).toBeVisible();
});

test('Übungsfortschritt: „Als Tabelle“ bleibt nach Neuladen', async ({ page, hasTouch }) => {
  await openPage(page, '/uebungen');
  await page.getByLabel('Übungen suchen').fill('Bankdrücken mit Langhantel');
  // Die ID aus dem Link, ohne die Details zu öffnen: Dort lädt die Schleife (D-403), und WebKit
  // meldet das beim Weggehen abgebrochene Laden als Konsolenfehler (D-447).
  const href = await page
    .getByRole('link', { name: /^Bankdrücken mit Langhantel/ })
    .first()
    .getAttribute('href');
  const id = href?.split('/').pop() ?? '';
  expect(id).not.toBe('');
  await openPage(page, `/fortschritt/uebung/${id}`);
  const control = page.getByRole('switch', { name: 'Als Tabelle' });
  await expect(control).not.toBeChecked();
  await tapSwitch(page, 'Als Tabelle', hasTouch);
  await expect(control).toBeChecked();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Als Tabelle' })).toBeChecked();
});

for (const name of [
  'Pause nach „erledigt“ automatisch starten',
  'Ton bei Pausenende',
  'Bildschirm im Training aktiv halten',
]) {
  test(`Einstellungen: „${name}“ umschalten und nach Neuladen behalten`, async ({
    page,
    hasTouch,
  }) => {
    await openPage(page, '/mehr/einstellungen');
    const control = page.getByRole('switch', { name, exact: true });
    const before = await control.isChecked();
    await tapSwitch(page, name, hasTouch);
    await expect(control).toBeChecked({ checked: !before });
    await page.reload();
    await expect(page.getByRole('switch', { name, exact: true })).toBeChecked({ checked: !before });
  });
}

test('Eigene Übung: „Je Seite“ beim Anlegen, gespeichert nach Neuladen', async ({
  page,
  hasTouch,
}) => {
  await openPage(page, '/uebungen');
  await page.getByRole('button', { name: 'Eigene Übung' }).click();
  const dialog = page.getByRole('dialog', { name: 'Eigene Übung anlegen' });
  await dialog.getByLabel('Name').fill('Ausfallschritt am Kabel');
  await tapSwitch(dialog, 'Je Seite', hasTouch);
  await expect(dialog.getByRole('switch', { name: 'Je Seite' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Anlegen' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ausfallschritt am Kabel' }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Bearbeiten' }).first().click();
  const edit = page.getByRole('dialog', { name: 'Eigene Übung bearbeiten' });
  await expect(edit.getByRole('switch', { name: 'Je Seite' })).toBeChecked();
});

test('Eigenes Programm: „Nach der letzten Woche von vorn beginnen“ speichert sofort', async ({
  page,
  hasTouch,
}) => {
  await openPage(page, '/training/vorlagen/full_body_ab');
  await page.getByRole('button', { name: 'Übernehmen und anpassen' }).click();
  await expect(page).toHaveURL(/\/training\/programme\/[0-9a-f-]+$/);
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  const name = 'Nach der letzten Woche von vorn beginnen';
  const control = page.getByRole('switch', { name });
  const before = await control.isChecked();
  await tapSwitch(page, name, hasTouch);
  await expect(control).toBeChecked({ checked: !before });
  await page.reload();
  await expect(page.getByRole('switch', { name })).toBeChecked({ checked: !before });
});

/** Legt ein eigenes Lebensmittel an; „Favorit“ gibt es erst beim Bearbeiten (speichert sofort). */
async function createFood(page: Page, name: string) {
  await openPage(page, '/ernaehrung/lebensmittel/neu');
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Energie (kcal)').fill('120');
  await page.getByLabel('Eiweiß (g)').fill('5');
  await page.getByLabel('Kohlenhydrate (g)').fill('20');
  await page.getByLabel('Fett (g)').fill('2');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).not.toHaveURL(/\/neu$/);
}

test('Lebensmittel: „Favorit“ speichert sofort und bleibt nach Neuladen', async ({
  page,
  hasTouch,
}) => {
  await createFood(page, 'Dinkelbrot');
  await openPage(page, '/ernaehrung/lebensmittel');
  await page
    .getByRole('link', { name: /Dinkelbrot/ })
    .first()
    .click();
  await expect(page.getByRole('switch', { name: 'Favorit' })).not.toBeChecked();
  await tapSwitch(page, 'Favorit', hasTouch);
  await expect(page.getByRole('switch', { name: 'Favorit' })).toBeChecked();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Favorit' })).toBeChecked();
});

test('Rezept: „Favorit“ speichert sofort und bleibt nach Neuladen', async ({ page, hasTouch }) => {
  await createFood(page, 'Haferdrink');
  await openPage(page, '/ernaehrung/rezepte/neu');
  await page.getByLabel('Name', { exact: true }).fill('Porridge');
  await page.getByRole('button', { name: 'Zutat hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Zutat hinzufügen' });
  await picker.getByLabel('Zutat suchen').fill('haferdrink');
  await picker
    .getByRole('button', { name: /^Haferdrink/ })
    .first()
    .click();
  const amount = page.getByRole('dialog', { name: /: Menge$/ });
  await amount.getByLabel(/^Menge in/).fill('200');
  await amount.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/\/ernaehrung\/rezepte$/);
  await page
    .getByRole('link', { name: /Porridge/ })
    .first()
    .click();
  await expect(page.getByRole('switch', { name: 'Favorit' })).not.toBeChecked();
  await tapSwitch(page, 'Favorit', hasTouch);
  await expect(page.getByRole('switch', { name: 'Favorit' })).toBeChecked();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Favorit' })).toBeChecked();
});

/**
 * Einfachauswahl (Zeitraum, Ansicht, Art, Bezugsgröße): jede Option per Tipp auf den sichtbaren
 * Chip. Die Optionsfelder liegen in ihrem `label`, deshalb wirkt der Tipp auf den ganzen Chip.
 */
const CHOICE_PAGES: readonly { path: string; setup?: (page: Page) => Promise<void> }[] = [
  {
    path: '/fortschritt',
    setup: async (page) => {
      await openPage(page, '/training/nachtragen');
      await page.getByText('Aktivität', { exact: true }).first().click();
      await page.getByLabel('Art der Aktivität').selectOption('run');
      await page.getByLabel('Dauer in Minuten').fill('30');
      await page.getByRole('button', { name: 'Speichern' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Laufen' })).toBeVisible();
      await openPage(page, '/fortschritt');
    },
  },
  {
    path: '/fortschritt/gewicht',
    // Ohne Eintrag zeigt die Seite den leeren Zustand. Die Auswahl erscheint erst, wenn das erste
    // Gewicht aus der Datenbank zurückkommt; vorher gezählt, fand der Test keine (WebKit, D-351).
    setup: async (page) => {
      await addWeight(page, '80,5');
      await expect(page.getByRole('group', { name: 'Zeitraum', exact: true })).toBeVisible();
    },
  },
  { path: '/ernaehrung/wasser' },
  { path: '/training/nachtragen' },
  { path: '/ernaehrung/lebensmittel/neu' },
  {
    path: '/heute/aufgaben',
    setup: async (page) => {
      await page.getByLabel('Name der Aufgabe').fill('Dehnen');
      await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
      await expect(page.getByRole('link', { name: 'Dehnen bearbeiten' })).toBeVisible();
    },
  },
  {
    path: '/ernaehrung/einkaufsliste',
    setup: async (page) => {
      await page.getByLabel('Was möchtest du einkaufen?').fill('Äpfel');
      await page.getByRole('button', { name: 'Zur Liste hinzufügen' }).click();
      await expect(page.getByRole('checkbox', { name: /Äpfel/ })).toBeVisible();
    },
  },
];

for (const { path, setup } of CHOICE_PAGES) {
  test(`Einfachauswahl auf ${path}: jede Option per Tipp auf den Chip`, async ({ page }) => {
    await openPage(page, path);
    if (setup) await setup(page);
    const groups = page.locator('fieldset').filter({ has: page.locator('input[type="radio"]') });
    const count = await groups.count();
    expect(count, `Auswahl auf ${path}`).toBeGreaterThan(0);
    for (let g = 0; g < count; g += 1) {
      const options = groups
        .nth(g)
        .locator('label')
        .filter({ has: page.locator('input') });
      const n = await options.count();
      expect(n).toBeGreaterThan(1);
      for (const index of [...Array(n).keys()].reverse()) {
        await options.nth(index).click();
        await expect(options.nth(index).locator('input')).toBeChecked();
      }
    }
  });
}
