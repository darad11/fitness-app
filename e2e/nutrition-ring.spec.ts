import type { Page } from '@playwright/test';
import { expect, openPage, test } from './fixtures';

/** Ernährung (F5 Abschnitt 5, D-326): Ring mit Makros, Datumszeile, Hinweis, Aktuelles Ziel. */

async function setTarget(page: Page) {
  await openPage(page, '/ernaehrung/ziele');
  await page.getByLabel('Energie (kcal)').fill('2390');
  await page.getByLabel('Eiweiß (g)').fill('162');
  await page.getByLabel('Kohlenhydrate (g)').fill('256');
  await page.getByLabel('Fett (g)').fill('80');
  await page.getByRole('button', { name: 'Ziel speichern' }).click();
  await expect(page.getByText(/^2\D?390 kcal$/)).toBeVisible();
}

async function quickEntry(page: Page, kcal: string, macros?: [string, string, string]) {
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=breakfast');
  await page.getByRole('button', { name: 'Schnelleintrag' }).click();
  const quick = page.getByRole('dialog', { name: 'Schnelleintrag' });
  await quick.getByLabel('Energie (kcal)').fill(kcal);
  if (macros) {
    await quick.getByLabel('Eiweiß (g, optional)').fill(macros[0]);
    await quick.getByLabel('Kohlenhydrate (g, optional)').fill(macros[1]);
    await quick.getByLabel('Fett (g, optional)').fill(macros[2]);
  }
  await quick.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(quick).toBeHidden();
}

const ring = (page: Page) => page.getByRole('main').getByRole('img', { name: /kcal/ }).first();
const parts = (page: Page) =>
  ring(page)
    .locator('circle[data-part]')
    .evaluateAll((circles) => circles.map((c) => c.getAttribute('data-part')));

test('Ring mit Makros: Spur bei 0, Abschnitte nach Anteil, Grau ab 5 %, voll über dem Ziel', async ({
  page,
}) => {
  test.slow();
  await page.clock.install({ time: new Date('2026-10-22T09:00:00+02:00') });
  await setTarget(page);

  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(/^0 von 2\D?390 kcal$/);
  expect(await parts(page)).toEqual([]);
  await expect(page.getByText(/^noch 2\D?390 kcal$/)).toBeVisible();

  // Beispiel aus dem Auftrag: 46 g Eiweiß, 17 g Kohlenhydrate, 51 g Fett, 732 kcal.
  await quickEntry(page, '732', ['46', '17', '51']);
  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(
    /^732 von 2\D?390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459$/,
  );
  expect(await parts(page)).toEqual(['protein', 'carbs', 'fat']);
  await expect(ring(page).locator('circle[data-cap]')).toHaveCount(2);
  await expect(ring(page)).toContainText('732');
  await expect(ring(page)).toContainText(/\/ 2\D?390 kcal/);
  // Drei Spalten mit Ist / Ziel unter dem Ring, darunter „noch x kcal“.
  const card = page.getByRole('region', { name: 'Gegessen' });
  const columns = card.locator('dl').first().locator(':scope > div');
  await expect(columns).toHaveCount(3);
  const [ringBox, first, third] = [
    await ring(page).boundingBox(),
    await columns.nth(0).boundingBox(),
    await columns.nth(2).boundingBox(),
  ];
  expect((first?.y ?? 0) - ((ringBox?.y ?? 0) + (ringBox?.height ?? 0))).toBeGreaterThan(0);
  expect(Math.abs((first?.y ?? 0) - (third?.y ?? 1))).toBeLessThan(1);
  await expect(card.getByText(/^noch 1\D?658 kcal$/)).toBeVisible();

  // Ohne Makros: 350 kcal von 1.082 sind über 5 %, also ein grauer Abschnitt am Ende.
  await quickEntry(page, '350');
  await openPage(page, '/ernaehrung');
  await expect(ring(page)).toHaveAccessibleName(
    /^1\D?082 von 2\D?390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459, nicht zugeordnet 371$/,
  );
  expect(await parts(page)).toEqual(['protein', 'carbs', 'fat', 'other']);
  await expect(
    page.getByText(
      'Bei mindestens einem Eintrag fehlen Werte für Eiweiß, Kohlenhydrate, Zucker, Fett, gesättigte Fettsäuren, Ballaststoffe und Salz.',
    ),
  ).toBeVisible();

  // Über dem Ziel: voll, ohne runde Enden, neutral „x kcal über dem Tagesziel“.
  await quickEntry(page, '1600', ['100', '200', '40']);
  await openPage(page, '/ernaehrung');
  await expect(ring(page).locator('circle[data-cap]')).toHaveCount(0);
  const over = page.getByText(/^292 kcal über dem Tagesziel$/);
  await expect(over).toBeVisible();
  await expect(over).toHaveClass(/text-muted/);

  // „Heute“: dieselbe Komponente, kompakt, mit Einheit in der Mitte.
  await openPage(page, '/heute');
  const today = page.getByRole('region', { name: 'Ernährung heute' });
  const small = today.getByRole('img', { name: /kcal/ });
  await expect(small).toHaveAccessibleName(/^2\D?682 von 2\D?390 kcal, davon Eiweiß 584/);
  await expect(small).toContainText(/\/ 2\D?390 kcal/);
  expect(
    await small
      .locator('circle[data-part]')
      .evaluateAll((circles) => circles.map((c) => c.getAttribute('data-part'))),
  ).toEqual(['protein', 'carbs', 'fat', 'other']);
  await expect(today.getByText(/^292 kcal über dem Tagesziel$/)).toBeVisible();
});

for (const width of [360, 390, 768]) {
  test(`Datumszeile einzeilig, kein Überlauf (${String(width)} pt)`, async ({ page, isMobile }) => {
    test.skip(!isMobile && width < 768, 'schmale Breiten im Handy-Projekt');
    await page.clock.install({ time: new Date('2026-10-22T09:00:00+02:00') });
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, '/ernaehrung');
    const line = page.getByText('Heute · Do., 22. Okt.', { exact: true });
    await expect(line).toBeVisible();
    const box = await line.boundingBox();
    const lineHeight = await line.evaluate((element) =>
      parseFloat(getComputedStyle(element).lineHeight),
    );
    expect(box?.height ?? 0).toBeLessThan(lineHeight * 1.5);
    await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
    await expect(page.getByText('Mi., 21. Okt.', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('„Aktuelles Ziel“ ohne Datum, Text folgt der Art des Ziels', async ({ page }) => {
  await setTarget(page);
  const current = page.getByRole('region', { name: /kcal/ }).first();
  await expect(current).toContainText('Selbst festgelegt');
  await expect(current).not.toContainText('Seit');
  // Vorschlag übernehmen: Der Text wechselt.
  await page.getByLabel('Geburtsjahr').fill('1990');
  await page.getByLabel('Größe (cm)').fill('180');
  await page.getByLabel('Gewicht (kg)').fill('80');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await page.getByRole('button', { name: 'Vorschlag übernehmen' }).click();
  await expect(current).toContainText('Aus Vorschlag übernommen');
  await expect(current).not.toContainText('Seit');
});

/** Farbe in OKLab (F6, D-333); versteht rgb(), color(srgb …), oklab() und oklch(). */
function lab(css: string): [number, number, number] {
  const num = String.raw`(-?[\d.]+)(%?)`;
  const ok = new RegExp(String.raw`^(oklab|oklch)\(\s*${num}\s+${num}\s+${num}`).exec(css);
  if (ok) {
    const l = Number(ok[2]) / (ok[3] ? 100 : 1);
    if (ok[1] === 'oklab') return [l, Number(ok[4]), Number(ok[6])];
    const h = (Number(ok[6]) * Math.PI) / 180;
    return [l, Number(ok[4]) * Math.cos(h), Number(ok[4]) * Math.sin(h)];
  }
  const rgb = /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(css);
  const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(css);
  const values = rgb
    ? [rgb[1], rgb[2], rgb[3]].map((v) => Number(v) / 255)
    : srgb
      ? [srgb[1], srgb[2], srgb[3]].map(Number)
      : null;
  if (!values) throw new Error(`Farbe nicht lesbar: ${css}`);
  const [r = 0, g = 0, b = 0] = values.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Buntheit und Farbton (OKLCH) und wie weit die Farbe außerhalb von sRGB liegt (0 = darin). */
function describe(css: string) {
  const [l, a, b] = lab(css);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ] as const;
  const linear = [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ];
  const outside = Math.max(0, ...linear.map((v) => Math.max(-v, v - 1)));
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { c: Math.hypot(a, b), h: (h + 360) % 360, outside };
}

const MACRO_RGB = {
  protein: 'rgb(52, 214, 192)',
  carbs: 'rgb(90, 146, 255)',
  fat: 'rgb(176, 140, 255)',
} as const;

test('Ring V2: Türkis, Blau, Violett in Ring, Balken und auf „Heute“; Übergang über den Farbton (F6)', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-22T09:00:00+02:00') });
  await setTarget(page);
  // 1.500 kcal zu fast gleichen Teilen: Abschnitte von rund 75°, der Übergang reicht 18° weit.
  await quickEntry(page, '1500', ['125', '125', '55']);
  for (const path of ['/ernaehrung', '/heute']) {
    await openPage(page, path);
    const card =
      path === '/heute'
        ? page.getByRole('region', { name: 'Ernährung heute' })
        : page.getByRole('region', { name: 'Gegessen' });
    const view = card.getByRole('img', { name: /kcal/ });
    // Erst wenn die Einträge geladen sind, hat der Ring seine drei Abschnitte.
    await expect(view.locator('circle[data-part]')).toHaveCount(3);
    const colors = await view
      .locator('circle[data-part]')
      .evaluateAll((circles) =>
        circles.map((c) => [c.getAttribute('data-part'), getComputedStyle(c).stroke]),
      );
    expect(colors, `${path}: Ring`).toEqual(Object.entries(MACRO_RGB));
    // Balken unter bzw. neben dem Ring in denselben Farben.
    const bars = await card
      .locator('dl')
      .first()
      .locator('.bg-meter-track > div')
      .evaluateAll((fills) => fills.map((f) => getComputedStyle(f).backgroundColor));
    expect(bars, `${path}: Balken`).toEqual(Object.values(MACRO_RGB));

    const blends = await view.locator('[data-blend]').evaluateAll((groups) =>
      groups.map((g) => ({
        name: g.getAttribute('data-blend') ?? '',
        width: Number(g.getAttribute('data-end')) - Number(g.getAttribute('data-start')),
        steps: [...g.querySelectorAll('path')].map((p) => getComputedStyle(p).stroke),
      })),
    );
    expect(blends.map((b) => b.name)).toEqual(['protein-carbs', 'carbs-fat']);
    for (const blend of blends) {
      const [from, to] = blend.name.split('-') as [keyof typeof MACRO_RGB, keyof typeof MACRO_RGB];
      const [a, b] = [describe(MACRO_RGB[from]), describe(MACRO_RGB[to])];
      expect(blend.width, `${path} ${blend.name}: 2 × 18°`).toBeCloseTo(36, 2);
      expect(blend.steps).toHaveLength(36);
      // Jeder Schritt liegt im Farbton zwischen den beiden Abschnitten, der Farbton wandert
      // gleichmäßig; die Buntheit fällt kaum ab (kein trübes Grau) und steigt nicht über die der
      // Abschnitte (kein greller Mischton), jede Mischfarbe ist darstellbar.
      let previous = a.h;
      for (const step of blend.steps) {
        const color = describe(step);
        expect(color.h).toBeGreaterThanOrEqual(Math.min(a.h, b.h) - 1);
        expect(color.h).toBeLessThanOrEqual(Math.max(a.h, b.h) + 1);
        expect(color.h).toBeGreaterThanOrEqual(previous - 0.5);
        expect(color.c, `${blend.name}: nicht trüb`).toBeGreaterThanOrEqual(
          Math.min(a.c, b.c) * 0.8,
        );
        expect(color.c, `${blend.name}: nicht greller als die Abschnitte`).toBeLessThanOrEqual(
          Math.max(a.c, b.c) + 0.005,
        );
        expect(color.outside, `${blend.name}: darstellbar (${step})`).toBeLessThan(0.002);
        previous = color.h;
      }
    }
  }
});
