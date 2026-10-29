import type { CDPSession, Locator, Page } from '@playwright/test';
import { DUO } from './duo';
import { expect, openPage, test } from './fixtures';

/**
 * Bildschirmtastatur in Formularen (D-391). Playwright öffnet keine Tastatur; nachgestellt wird,
 * was iOS tut: Ein Finger tippt das Feld an (Berührung an der Stelle, ohne dass Playwright vorher
 * scrollt), danach wird das Fenster um die Tastatur niedriger, denn iOS legt feste Leisten über
 * die Tastatur. Geprüft je Feld und Haltung: Tab-Leiste und Kreis sind aus; das Feld steht nach
 * dem Antippen im oberen Teil der Seite, in einem Schritt und ohne Umweg über den Seitenanfang;
 * geht die Tastatur auf, scrollt die App nicht, und das Feld ist ganz zu sehen, von nichts
 * verdeckt; die Fußleiste im Training bleibt dabei über der Tastatur und geht nur aus, wenn sie
 * das Feld verdecken würde; nach dem Schließen ist die Tab-Leiste wieder da.
 */

interface Pose {
  name: string;
  width: number;
  height: number;
  insets: { top: number; right: number; bottom: number; left: number };
}

const POSES: Pose[] = [
  { name: 'zugeklappt', ...DUO.zu },
  { name: 'aufgeklappt', ...DUO.auf },
  // iPhone 15 als App vom Home-Bildschirm.
  { name: 'iPhone', width: 393, height: 852, insets: { top: 59, right: 0, bottom: 34, left: 0 } },
];

/** Anteil der Höhe, den die Tastatur samt Leiste darüber nimmt (Duo zugeklappt 54 %, Bild B). */
const KEYBOARD = 0.55;

test.skip(({ isMobile }) => !isMobile, 'Bildschirmtastatur nur am Touch-Gerät');

// Die Regeln gelten nur mit Touch-Zeiger, wie ihn Safari am iPhone meldet. Meldet eine
// nachgestellte Engine keinen, wird der Test dort übersprungen statt falsch geprüft.
test.beforeEach(async ({ page }) => {
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  test.skip(!coarse, 'Engine meldet keinen Touch-Zeiger (pointer: coarse)');
});

/** Eine Sitzung je Seite, damit die Vorgabe für den sicheren Bereich bestehen bleibt. */
const sessions = new WeakMap<Page, CDPSession>();

/** Haltung mit sicherem Bereich (nur Chromium stellt ihn nach) und Fensterhöhe. */
async function setPose(page: Page, pose: Pose, height = pose.height) {
  if (page.context().browser()?.browserType().name() === 'chromium') {
    let cdp = sessions.get(page);
    if (!cdp) {
      cdp = await page.context().newCDPSession(page);
      sessions.set(page, cdp);
    }
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: pose.insets });
  }
  await page.setViewportSize({ width: pose.width, height });
}

const frames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );

/** Scrollpositionen des Rahmens ab jetzt mitschreiben (für „kein Sprung“). */
async function startScrollLog(page: Page) {
  await page.evaluate(() => {
    const frame = document.getElementById('seite');
    const log: number[] = [frame?.scrollTop ?? 0];
    (window as unknown as { tippLog: number[] }).tippLog = log;
    frame?.addEventListener(
      'scroll',
      () => {
        log.push(frame.scrollTop);
      },
      { passive: true },
    );
  });
}

const scrollLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { tippLog: number[] }).tippLog);

const frameTop = (page: Page) =>
  page.evaluate(() => document.getElementById('seite')?.scrollTop ?? 0);

/** Ist das Feld ganz zu sehen und oben wie unten von nichts verdeckt? */
async function uncovered(field: Locator) {
  return field.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + Math.min(rect.width / 2, 40);
    const hit = (y: number) => {
      const top = document.elementFromPoint(x, y);
      return top !== null && (top === element || element.contains(top) || top.contains(element));
    };
    return {
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      height: window.innerHeight,
      visible: hit(rect.top + 3) && hit(rect.bottom - 3),
      covering: document.elementFromPoint(x, rect.bottom - 3)?.outerHTML.slice(0, 80) ?? 'nichts',
    };
  });
}

/**
 * Lage des Feldes im Rahmen: unter dem Abstand oben (im Training unter dem Kopf,
 * `--tastatur-oben`), über der Linie bei 40 % der Höhe abzüglich der Fußleiste im Training
 * (`--tastatur-unten`)?
 */
async function inUpperPart(field: Locator) {
  return field.evaluate((element) => {
    // Wie `revealField`: Rahmen der Seite oder Dialog über den ganzen Bildschirm; Blätter nicht.
    const dialog = element.closest('dialog');
    const frame = dialog
      ? dialog.clientHeight >= window.innerHeight * 0.9
        ? dialog
        : null
      : document.getElementById('seite');
    if (!frame?.contains(element)) return { inFrame: false, ok: true, detail: 'Blatt' };
    const rect = element.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    const bar = (name: string) => parseFloat(frame.style.getPropertyValue(name)) || 0;
    const padding = parseFloat(getComputedStyle(frame).scrollPaddingTop) || 0;
    const top = box.top + (bar('--tastatur-oben') || padding);
    const line = box.top + frame.clientHeight * 0.4 - bar('--tastatur-unten');
    // Höher geht es nicht: direkt unter dem Abstand oben, mit Platz für die Beschriftung.
    const highest = top + (parseFloat(getComputedStyle(element).scrollMarginTop) || 0);
    return {
      inFrame: true,
      ok: rect.top >= top - 1 && (rect.bottom <= line + 1 || rect.top <= highest + 1),
      detail: `Feld ${String(Math.round(rect.top))} bis ${String(Math.round(rect.bottom))}, oben ${String(Math.round(top))}, Linie ${String(Math.round(line))}`,
    };
  });
}

/**
 * Tippt das Feld an und prüft alles von „Tastatur geht auf“ bis „Tastatur geht zu“. `bar`: Seite
 * mit Tab-Leiste (nicht im Training).
 */
async function typeInto(page: Page, pose: Pose, field: Locator, label: string, bar = true) {
  await expect(field, label).toBeVisible();
  const box = await field.boundingBox();
  expect(box, label).not.toBeNull();
  await startScrollLog(page);
  // Antippen an der Stelle des Feldes, ohne dass Playwright es vorher in den Blick scrollt.
  const x = (box?.x ?? 0) + Math.min((box?.width ?? 0) / 2, 40);
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  // Was unter dem Finger liegt, für die Meldung, falls der Fokus nicht ankommt (WebKit in der CI).
  const hit = await page.evaluate(
    ([px, py]) => document.elementFromPoint(px ?? 0, py ?? 0)?.outerHTML.slice(0, 160) ?? 'nichts',
    [x, y],
  );
  await page.touchscreen.tap(x, y);
  try {
    await expect(field).toBeFocused();
  } catch (error) {
    const state = await page.evaluate(() => ({
      active: document.activeElement?.outerHTML.slice(0, 160) ?? 'nichts',
      scroll: document.getElementById('seite')?.scrollTop ?? -1,
    }));
    const now = await field.boundingBox();
    throw new Error(
      `${label}: Fokus fehlt. Getippt bei ${String(Math.round(x))}, ${String(Math.round(y))} auf ${hit}; Feld jetzt bei ${String(Math.round(now?.y ?? -1))}, vorher ${String(Math.round(box?.y ?? -1))}; Fokus auf ${state.active}; Rahmen gescrollt ${String(state.scroll)}`,
      { cause: error },
    );
  }
  await frames(page);
  if (bar) await expect(page.locator('.tabbar-dock'), `${label}: Tab-Leiste aus`).toBeHidden();
  const placed = await inUpperPart(field);
  expect(placed.ok, `${pose.name}, ${label}: im oberen Teil (${placed.detail})`).toBe(true);
  // Bleibt die Fußleiste im Training über der Tastatur (hohes Fenster), steht das Feld darüber.
  const above = await field.evaluate((element, share) => {
    const foot = document.querySelector('.player-foot');
    if (!foot || getComputedStyle(foot).visibility === 'hidden') return null;
    const limit = window.innerHeight * (1 - share) - foot.getBoundingClientRect().height;
    return { bottom: Math.round(element.getBoundingClientRect().bottom), limit: Math.round(limit) };
  }, KEYBOARD);
  if (above) {
    expect(
      above.bottom,
      `${pose.name}, ${label}: über der Fußleiste über der Tastatur (Grenze ${String(above.limit)})`,
    ).toBeLessThanOrEqual(above.limit);
  }
  const before = await frameTop(page);

  // Tastatur geht auf.
  await setPose(page, pose, Math.round(pose.height * (1 - KEYBOARD)));
  await page.waitForTimeout(250);
  await frames(page);
  const after = await frameTop(page);
  expect(Math.abs(after - before), `${pose.name}, ${label}: App scrollt nicht`).toBeLessThanOrEqual(
    1,
  );
  const seen = await uncovered(field);
  expect(
    seen.visible,
    `${pose.name}, ${label}: ganz zu sehen (${String(seen.top)} bis ${String(seen.bottom)} von ${String(seen.height)}, darüber ${seen.covering})`,
  ).toBe(true);
  if (bar) await expect(page.locator('.tabbar-dock'), `${label}: Tab-Leiste aus`).toBeHidden();
  // Die Fußleiste im Training bleibt über der Tastatur; Platz für Kopf, Feld und sie ist in allen
  // Haltungen hier, „Satz erledigt“ bleibt also in Reichweite.
  const foot = page.locator('.player-foot');
  if ((await foot.count()) > 0) {
    await expect(foot, `${pose.name}, ${label}: Fußleiste über der Tastatur`).toBeVisible();
  }

  // Kein Sprung: alle Scrollpositionen zwischen Anfang und Ende, kein Umweg über den Anfang.
  const log = await scrollLog(page);
  const first = log[0] ?? 0;
  const last = log.at(-1) ?? 0;
  const [low, high] = [Math.min(first, last) - 1, Math.max(first, last) + 1];
  expect(
    log.every((value) => value >= low && value <= high),
    `${pose.name}, ${label}: kein Sprung (${log.map(String).join(', ')})`,
  ).toBe(true);

  // Tastatur geht zu.
  await field.evaluate((element) => {
    (element as HTMLElement).blur();
  });
  await setPose(page, pose);
  await frames(page);
  if (bar)
    await expect(page.locator('.tabbar-dock'), `${label}: Tab-Leiste wieder da`).toBeVisible();
}

for (const pose of POSES) {
  test(`${pose.name}: Einkaufsliste, Eintrag oben und Artikel bearbeiten (D-391)`, async ({
    page,
  }) => {
    test.slow();
    await setPose(page, pose);
    await openPage(page, '/ernaehrung/einkaufsliste');
    const add = page.getByLabel('Was möchtest du einkaufen?');
    for (const name of ['Brot', 'Milch', 'Eier', 'Butter', 'Äpfel', 'Käse', 'Reis', 'Nudeln']) {
      await add.fill(name);
      await add.press('Enter');
      await expect(page.getByRole('button', { name: `${name} bearbeiten` })).toBeVisible();
    }
    await add.evaluate((element) => {
      (element as HTMLElement).blur();
    });
    await page.evaluate(() => document.getElementById('seite')?.scrollTo({ top: 0 }));
    await typeInto(page, pose, add, 'Was möchtest du einkaufen?');

    // Artikel weiter unten bearbeiten: Das Formular öffnet mit dem Fokus im Namen.
    const edit = page.getByRole('button', { name: 'Reis bearbeiten' });
    await edit.scrollIntoViewIfNeeded();
    await edit.click();
    const name = page.getByLabel('Name', { exact: true });
    await expect(name).toBeFocused();
    await frames(page);
    await expect(page.locator('.tabbar-dock'), 'Tab-Leiste aus').toBeHidden();
    const placed = await inUpperPart(name);
    expect(placed.ok, `${pose.name}, Name: im oberen Teil (${placed.detail})`).toBe(true);
    await name.evaluate((element) => {
      (element as HTMLElement).blur();
    });
    for (const label of ['Menge', 'Notiz (optional)']) {
      await typeInto(page, pose, page.getByLabel(label, { exact: true }), label);
    }
  });

  test(`${pose.name}: Lebensmittel suchen und Menge (D-391)`, async ({ page }) => {
    await setPose(page, pose);
    await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    const search = page.getByLabel('Lebensmittel suchen');
    await typeInto(page, pose, search, 'Lebensmittel suchen');
    await search.fill('Apfel');
    await page.getByRole('button', { name: /^Apfel\s*BLS/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await typeInto(
      page,
      pose,
      dialog.getByRole('textbox', { name: /^(Anzahl \(|Menge in )/ }),
      'Menge im Blatt',
    );
  });

  test(`${pose.name}: Gewicht erfassen (D-391)`, async ({ page }) => {
    await setPose(page, pose);
    await openPage(page, '/fortschritt/gewicht');
    await page.getByRole('button', { name: 'Gewicht erfassen' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Gewicht erfassen' });
    await typeInto(page, pose, sheet.getByLabel('Gewicht in kg'), 'Gewicht in kg');
  });

  test(`${pose.name}: Ziele (D-391)`, async ({ page }) => {
    await setPose(page, pose);
    await openPage(page, '/ernaehrung/ziele');
    for (const label of ['Energie (kcal)', 'Eiweiß (g)', 'Kohlenhydrate (g)', 'Fett (g)']) {
      await page.getByLabel(label).scrollIntoViewIfNeeded();
      await typeInto(page, pose, page.getByLabel(label), label);
    }
  });

  test(`${pose.name}: Tagesaufgaben (D-391)`, async ({ page }) => {
    await setPose(page, pose);
    await openPage(page, '/heute/aufgaben');
    await typeInto(page, pose, page.getByLabel('Name der Aufgabe'), 'Name der Aufgabe');
  });

  test(`${pose.name}: Anmeldung (D-391)`, async ({ page }) => {
    await setPose(page, pose);
    await openPage(page, '/mehr/synchronisierung');
    const login = page.getByRole('dialog', { name: 'FORM' });
    for (const label of ['E-Mail', 'Passwort']) {
      await typeInto(page, pose, login.getByLabel(label, { exact: true }), label, false);
    }
  });

  test(`${pose.name}: Eingaben im Training, Fußleiste verdeckt kein Feld (D-391)`, async ({
    page,
  }) => {
    test.slow();
    await setPose(page, pose);
    await openPage(page, '/training/vorlagen/full_body_ab');
    await page.getByRole('button', { name: 'Tag A heute trainieren' }).click();
    await expect(page).toHaveURL(/\/training\/einheit\/[0-9a-f-]+$/);
    const weights = page.getByLabel(/^Gewicht in kg, /);
    await expect(weights.first()).toBeVisible();
    await typeInto(page, pose, weights.first(), 'kg im ersten Satz', false);
    // Ein Satz weiter unten, so weit unten, wie er noch im Fenster steht.
    const low = await page.evaluate(() => {
      const fields = [
        ...document.querySelectorAll<HTMLInputElement>('input[aria-label^="Gewicht in kg, "]'),
      ];
      const foot = document.querySelector('.player-foot')?.getBoundingClientRect().top ?? 0;
      let index = 0;
      fields.forEach((field, i) => {
        const rect = field.getBoundingClientRect();
        if (rect.bottom < foot - 4 && rect.top > 0) index = i;
      });
      return index;
    });
    await typeInto(page, pose, weights.nth(low), `kg im Satz ${String(low + 1)}`, false);

    // Scrollst du beim Tippen das Feld unter die Fußleiste, ist sie aus, bis es wieder frei steht.
    const field = weights.nth(low);
    const box = await field.boundingBox();
    await page.touchscreen.tap((box?.x ?? 0) + 20, (box?.y ?? 0) + (box?.height ?? 0) / 2);
    await expect(field).toBeFocused();
    await setPose(page, pose, Math.round(pose.height * (1 - KEYBOARD)));
    await frames(page);
    const foot = page.locator('.player-foot');
    await expect(foot, `${pose.name}: Fußleiste über der Tastatur`).toBeVisible();
    const shift = await field.evaluate((element) => {
      const bar = document.querySelector('.player-foot')?.getBoundingClientRect().top ?? 0;
      return Math.ceil(bar - element.getBoundingClientRect().top + 8);
    });
    const scrollFrame = (top: number) =>
      page.evaluate((delta) => {
        document.getElementById('seite')?.scrollBy({ top: delta, behavior: 'instant' });
      }, top);
    await scrollFrame(-shift);
    await frames(page);
    await expect(foot, `${pose.name}: Fußleiste aus, solange sie das Feld verdeckte`).toBeHidden();
    await scrollFrame(shift);
    await frames(page);
    await expect(foot, `${pose.name}: Fußleiste wieder da`).toBeVisible();
    await field.evaluate((element) => {
      (element as HTMLElement).blur();
    });
    await setPose(page, pose);
  });
}

test('iPhone ohne gemeldeten sicheren Bereich: In der Anmeldung bleibt das Feld zu sehen, wenn der Abstand über dem Logo mit der Tastatur kleiner wird (Nachtrag zu D-391)', async ({
  page,
}) => {
  // Wie WebKit in der CI, das keinen sicheren Bereich nachstellt: Der Abstand über dem Logo hängt
  // dann nur an der Höhe des Fensters (`30dvh`) und wird mit der Tastatur 140 px kleiner; das Feld
  // stand danach bei -32 px.
  const pose: Pose = {
    name: 'iPhone ohne sicheren Bereich',
    width: 393,
    height: 852,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  await setPose(page, pose);
  await openPage(page, '/mehr/synchronisierung');
  const login = page.getByRole('dialog', { name: 'FORM' });
  for (const label of ['E-Mail', 'Passwort']) {
    await typeInto(page, pose, login.getByLabel(label, { exact: true }), label, false);
  }
});
