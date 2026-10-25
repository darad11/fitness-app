// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSettings } from '@/modules/settings';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import { createTestRuntime } from '@/shared/testing/db';
import { catalogDbName } from '../data/catalogStore';
import { setOffConsent } from '../data/openFoodFacts';
import { commitCatalog, prepareCatalog } from '../service/catalogService';
import {
  listDayEntries,
  listFoods,
  listRecipes,
  listTargets,
  toFoodItem,
} from '../data/nutritionRepository';
import { nutritionRoutes } from '../routes';
import { createFood, localDayKey, logFood, logQuick } from '../service/nutritionService';
import { createRecipe, ingredientFrom } from '../service/recipeService';

const localDay = () => localDayKey(new Date());
const setOffConsentForTest = () => setOffConsent(rt.db, true);

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await Dexie.delete(catalogDbName(rt.db));
  await rt.db.delete();
});

const WAIT = { timeout: 10_000 };

/**
 * Importierte Testlebensmittel (ÖNWT) statt des früher gebündelten BLS (D-279), mit dessen Werten
 * für Haferflocken und Banane, damit die erwarteten Zahlen gleich bleiben.
 */
async function seedCatalog() {
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
  const file = new Blob([
    JSON.stringify({
      rows: [
        row('C133000', 'Hafer Flocken', [348, 13.22, 53.3, 0.74, 6.65, 1.34, 10.98, 0]),
        row('F503100', 'Banane roh', [79, 1.32, 15.89, 13.89, 0.4, 0.07, 2, 0]),
        row('M161000', 'Speisequark mager', [67, 12, 4, 4, 0.3, 0.2, 0, 0.1]),
      ],
    }),
  ]);
  await commitCatalog(rt.db, await prepareCatalog(file));
}

async function renderAt(path: string, heading: string) {
  const router = createMemoryRouter(nutritionRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: heading }, WAIT);
  return router;
}

describe('Ernährung (Schritt G, D-261)', () => {
  it(
    'protokolliert importierte Lebensmittel, ändert, löscht mit Rückgängig und nimmt Schnelleinträge',
    { timeout: 40_000 },
    async () => {
      await seedCatalog();
      const user = userEvent.setup();
      const router = await renderAt('/ernaehrung', 'Ernährung');
      expect(await screen.findByText('Noch kein Tagesziel.', {}, WAIT)).toBeVisible();
      await user.click(screen.getByRole('link', { name: 'Zu Frühstück hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Lebensmittel hinzufügen' }, WAIT);
      const search = await screen.findByLabelText('Lebensmittel suchen', {}, WAIT);
      await waitFor(() => {
        expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      }, WAIT);
      await user.type(search, 'haferflocken');
      await user.click(
        await screen.findByRole('button', { name: /^Hafer FlockenÖNWT348 kcal/ }, WAIT),
      );
      const dialog = screen.getByRole('dialog', { name: 'Hafer Flocken hinzufügen' });
      const amount = within(dialog).getByLabelText('Menge in g');
      await user.clear(amount);
      await user.type(amount, '50');
      expect(within(dialog).getByRole('status')).toHaveTextContent('174 kcal');
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      expect(router.state.location.pathname).toBe('/ernaehrung');
      const breakfast = await screen.findByRole('region', { name: 'Frühstück' }, WAIT);
      expect(within(breakfast).getByText('Hafer Flocken')).toBeVisible();
      expect(within(breakfast).getByText('50 g')).toBeVisible();
      expect(screen.getAllByText('174 kcal').length).toBeGreaterThan(0);

      // Menge ändern.
      await user.click(within(breakfast).getByRole('button', { name: 'Hafer Flocken bearbeiten' }));
      const edit = screen.getByRole('dialog', { name: 'Hafer Flocken' });
      await user.clear(within(edit).getByLabelText('Menge in g'));
      await user.type(within(edit).getByLabelText('Menge in g'), '80');
      await user.click(within(edit).getByRole('button', { name: 'Speichern' }));
      expect(await within(breakfast).findByText('80 g')).toBeVisible();
      expect(screen.getAllByText('278 kcal').length).toBeGreaterThan(0);

      // Löschen und Rückgängig.
      await user.click(within(breakfast).getByRole('button', { name: 'Hafer Flocken bearbeiten' }));
      await user.click(
        within(screen.getByRole('dialog', { name: 'Hafer Flocken' })).getByRole('button', {
          name: 'Löschen',
        }),
      );
      expect(await screen.findByText('„Hafer Flocken“ gelöscht')).toBeVisible();
      await waitFor(() => {
        expect(within(breakfast).queryByText('Hafer Flocken')).toBeNull();
      });
      await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
      expect(await within(breakfast).findByText('Hafer Flocken')).toBeVisible();

      // Schnelleintrag zum Abendessen.
      await user.click(screen.getByRole('link', { name: 'Zu Abendessen hinzufügen' }));
      await user.click(await screen.findByRole('button', { name: 'Schnelleintrag' }, WAIT));
      const quick = screen.getByRole('dialog', { name: 'Schnelleintrag' });
      await user.type(within(quick).getByLabelText('Bezeichnung (optional)'), 'Pizza');
      await user.type(within(quick).getByLabelText('Energie (kcal)'), '850');
      await user.click(within(quick).getByRole('button', { name: 'Hinzufügen' }));
      const dinner = await screen.findByRole('region', { name: 'Abendessen' }, WAIT);
      expect(await within(dinner).findByText('Pizza')).toBeVisible();
      expect(screen.getByText('1.128 kcal')).toBeVisible();
      expect(screen.getByText('Enthält Schätzungen (Schnelleinträge).')).toBeVisible();
    },
  );

  it('Doppeltipp auf „Hinzufügen“ trägt nur einmal ein (C-02)', { timeout: 30_000 }, async () => {
    const user = userEvent.setup();
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=dinner', 'Lebensmittel hinzufügen');
    await user.click(await screen.findByRole('button', { name: 'Schnelleintrag' }, WAIT));
    const quick = screen.getByRole('dialog', { name: 'Schnelleintrag' });
    await user.type(within(quick).getByLabelText('Energie (kcal)'), '850');
    await user.dblClick(within(quick).getByRole('button', { name: 'Hinzufügen' }));
    await waitFor(async () => {
      expect(await rt.db.foodLog.count()).toBe(1);
    }, WAIT);
    // Ein zweiter Eintrag käme kurz danach; es bleibt bei einem.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await rt.db.foodLog.count()).toBe(1);
  });

  it(
    'Doppeltipp auf „Speichern“ legt eine Vorlage nur einmal an (C-02)',
    { timeout: 30_000 },
    async () => {
      const user = userEvent.setup();
      await logQuick(rt, { name: 'Müsli', slot: 'breakfast', dayKey: localDay(), kcal: 350 });
      await renderAt('/ernaehrung', 'Ernährung');
      await user.click(
        await screen.findByRole('button', { name: 'Frühstück als Vorlage speichern' }, WAIT),
      );
      const save = screen.getByRole('dialog', { name: 'Als Vorlage speichern' });
      await user.dblClick(within(save).getByRole('button', { name: 'Speichern' }));
      expect(await screen.findByText('Vorlage „Frühstück“ gespeichert', {}, WAIT)).toBeVisible();
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(await rt.db.mealTemplates.count()).toBe(1);
    },
  );

  it('findet österreichische Bezeichnungen', { timeout: 30_000 }, async () => {
    await seedCatalog();
    const user = userEvent.setup();
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
    const search = await screen.findByLabelText('Lebensmittel suchen', {}, WAIT);
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    }, WAIT);
    await user.type(search, 'topfen');
    const list = await screen.findByRole('list', { name: /Treffer$/ }, WAIT);
    // Zuerst die Grundauswahl (D-362), der importierte Quark über das Synonym danach.
    const names = within(list)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names[0]).toMatch(/^Topfen 10 %BLS/);
    expect(names.some((name) => name.startsWith('Speisequark magerÖNWT'))).toBe(true);
  });

  it('legt ein eigenes Lebensmittel mit Portion an und nutzt es', { timeout: 40_000 }, async () => {
    const user = userEvent.setup();
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
    await user.click(screen.getByRole('link', { name: 'Eigenes Lebensmittel anlegen' }));
    await screen.findByRole('heading', { level: 1, name: 'Neues Lebensmittel' }, WAIT);
    await user.type(screen.getByLabelText('Name'), 'Skyr Natur');
    await user.type(screen.getByLabelText('Marke (optional)'), 'Spar');
    await user.type(screen.getByLabelText('Energie (kcal)'), '63');
    await user.type(screen.getByLabelText('Eiweiß (g)'), '11');
    await user.type(screen.getByLabelText('Kohlenhydrate (g)'), '4');
    await user.type(screen.getByLabelText('Fett (g)'), '30');
    expect(await screen.findByText(/ergeben sich etwa 330 kcal/)).toBeVisible();
    await user.clear(screen.getByLabelText('Fett (g)'));
    await user.type(screen.getByLabelText('Fett (g)'), '0,2');
    expect(screen.queryByText(/ergeben sich etwa/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Portion hinzufügen' }));
    await user.type(screen.getByLabelText('Name der Portion'), 'Becher');
    await user.type(
      screen.getByLabelText('Menge in g', { selector: 'input[id$="-s0-amount"]' }),
      '450',
    );
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('heading', { level: 1, name: 'Lebensmittel hinzufügen' }, WAIT);
    const [food] = await listFoods(rt.db);
    expect(food).toMatchObject({
      name: 'Skyr Natur',
      brand: 'Spar',
      per100: { kcal: 63, fat: 0.2 },
    });
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    }, WAIT);
    await user.type(screen.getByLabelText('Lebensmittel suchen'), 'skyr');
    await user.click(await screen.findByRole('button', { name: /^Skyr Natur/ }, WAIT));
    const dialog = screen.getByRole('dialog', { name: 'Skyr Natur hinzufügen' });
    expect(within(dialog).getByLabelText('Einheit')).toHaveValue(food?.servings[0]?.id);
    expect(within(dialog).getByRole('status')).toHaveTextContent('284 kcal');
    await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
    const snacks = await screen.findByRole('region', { name: 'Snacks' }, WAIT);
    expect(await within(snacks).findByText(/1 × Becher \(450 g\)/)).toBeVisible();
  });

  it('legt Ziele selbst fest und übernimmt einen Vorschlag', { timeout: 30_000 }, async () => {
    const user = userEvent.setup();
    await renderAt('/ernaehrung/ziele', 'Tagesziele');
    await user.type(screen.getByLabelText('Energie (kcal)'), '2400');
    await user.type(screen.getByLabelText('Eiweiß (g)'), '150');
    await user.type(screen.getByLabelText('Kohlenhydrate (g)'), '250');
    await user.type(screen.getByLabelText('Fett (g)'), '80');
    await user.click(screen.getByRole('button', { name: 'Ziel speichern' }));
    expect(await screen.findByText('2.400 kcal')).toBeVisible();

    await user.type(screen.getByLabelText('Geburtsjahr'), '1990');
    await user.type(screen.getByLabelText('Größe (cm)'), '180');
    await user.type(screen.getByLabelText('Gewicht (kg)'), '80');
    await user.click(screen.getByRole('button', { name: 'Berechnen' }));
    expect(await screen.findByText(/Eiweiß 144 g · Kohlenhydrate \d+ g · Fett 90 g/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Vorschlag übernehmen' }));
    expect(await screen.findByText('Aus Vorschlag übernommen', { exact: false })).toBeVisible();
    const targets = await listTargets(rt.db);
    expect(targets).toHaveLength(2);
    expect(targets.find((x) => x.method === 'computed')?.inputsSnapshot).toMatchObject({
      birthYear: 1990,
      heightCm: 180,
      weightKg: 80,
    });
  });

  it(
    'importiert Lebensmitteldaten lokal, findet sie und entfernt sie wieder (D-263)',
    { timeout: 40_000 },
    async () => {
      const user = userEvent.setup();
      await renderAt('/ernaehrung/lebensmittel', 'Meine Lebensmittel');
      expect(
        await screen.findByText('Noch keine Lebensmitteldaten importiert.', {}, WAIT),
      ).toBeVisible();
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
          { code: 'X100000', source: 'BLS3.02', name: 'Testbrot hell', ...values },
          { code: '0003385', source: 'ÖNWT2.0', name: 'Altbrot, +++läuft aus', ...values },
        ],
      });
      await user.upload(
        screen.getByLabelText('Datei auswählen'),
        new File([content], 'nuts-recherche.json', { type: 'application/json' }),
      );
      const preview = await screen.findByRole(
        'dialog',
        { name: 'Lebensmitteldaten importieren' },
        WAIT,
      );
      expect(within(preview).getByText('1 Lebensmittel werden übernommen:')).toBeVisible();
      expect(within(preview).getByText('2 deutsche Einträge (BLS)')).toBeVisible();
      expect(within(preview).getByText('1 auslaufende Produkte')).toBeVisible();
      await user.click(within(preview).getByRole('button', { name: 'Importieren' }));
      expect(await screen.findByText('1 Lebensmittel importiert', {}, WAIT)).toBeVisible();
      expect(screen.getByText(/^Aus der Österreichischen Nährwerttabelle/)).toBeVisible();

      // In der Suche mit Herkunft; österreichische Begriffe greifen auch hier.
      cleanup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
      await waitFor(() => {
        expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      }, WAIT);
      await user.type(screen.getByLabelText('Lebensmittel suchen'), 'fisolen speck');
      await user.click(
        await screen.findByRole('button', { name: /^Fisolen mit SpeckÖNWT98 kcal/ }, WAIT),
      );
      const dialog = screen.getByRole('dialog', { name: 'Fisolen mit Speck hinzufügen' });
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      await waitFor(async () => {
        expect((await listDayEntries(rt.db, localDay()))[0]?.nameSnapshot).toBe(
          'Fisolen mit Speck',
        );
      });

      // Entfernen: Protokoll bleibt.
      cleanup();
      await renderAt('/ernaehrung/lebensmittel', 'Meine Lebensmittel');
      await user.click(await screen.findByRole('button', { name: 'Import entfernen' }, WAIT));
      await user.click(
        within(screen.getByRole('dialog', { name: 'Import entfernen?' })).getByRole('button', {
          name: 'Import entfernen',
        }),
      );
      expect(
        await screen.findByText('Noch keine Lebensmitteldaten importiert.', {}, WAIT),
      ).toBeVisible();
      expect(await listDayEntries(rt.db, localDay())).toHaveLength(1);
    },
  );

  it('meldet eine unpassende Datei', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    await renderAt('/ernaehrung/lebensmittel', 'Meine Lebensmittel');
    await user.upload(
      await screen.findByLabelText('Datei auswählen', {}, WAIT),
      new File(['{"foods":[]}'], 'falsch.json', { type: 'application/json' }),
    );
    expect(await screen.findByText(/Diese Datei passt nicht/, {}, WAIT)).toBeVisible();
  });

  it(
    'zeigt alle Nährwerte mit Zucker und Salz im Dialog und in der Tagessumme',
    { timeout: 40_000 },
    async () => {
      await seedCatalog();
      const user = userEvent.setup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=breakfast', 'Lebensmittel hinzufügen');
      await waitFor(() => {
        expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      }, WAIT);
      await user.type(screen.getByLabelText('Lebensmittel suchen'), 'haferflocken');
      await user.click(
        await screen.findByRole('button', { name: /^Hafer FlockenÖNWT348 kcal/ }, WAIT),
      );
      const dialog = screen.getByRole('dialog', { name: 'Hafer Flocken hinzufügen' });
      await user.clear(within(dialog).getByLabelText('Menge in g'));
      await user.type(within(dialog).getByLabelText('Menge in g'), '50');
      const table = within(dialog).getByRole('table', { name: 'Nährwerte' });
      const sugar = within(table).getByRole('row', { name: /davon Zucker/ });
      expect(
        within(sugar)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ).toEqual(['0,7 g', '0,4 g']);
      const fiber = within(table).getByRole('row', { name: /Ballaststoffe/ });
      expect(
        within(fiber)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ).toEqual(['11 g', '5,5 g']);
      expect(within(table).getByRole('row', { name: /Salz/ })).toHaveTextContent('0 g');
      expect(within(table).getByRole('columnheader', { name: 'für 50 g' })).toBeVisible();
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));

      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      const list = await screen.findByRole(
        'group',
        { name: 'Weitere Nährwerte', hidden: true },
        WAIT,
      );
      // Kompakt „Ist / Referenz g“ (D-363).
      expect(within(list).getByText('Zucker').nextElementSibling).toHaveTextContent('0,4 / 90 g');
      expect(within(list).getByText('Ballaststoffe').nextElementSibling).toHaveTextContent(
        '5,5 / 30 g',
      );
      expect(within(list).getByText('Salz').nextElementSibling).toHaveTextContent('0 / 6 g');

      // Bearbeiten zeigt die Werte des Eintrags.
      await user.click(screen.getByRole('button', { name: 'Hafer Flocken bearbeiten' }));
      const edit = screen.getByRole('dialog', { name: 'Hafer Flocken' });
      expect(within(edit).getByRole('table', { name: 'Nährwerte für 50 g' })).toBeVisible();
    },
  );

  it(
    'scannt per Eingabe, fragt um Erlaubnis, speichert das Produkt und trägt es ein (D-266)',
    { timeout: 40_000 },
    async () => {
      const fetchMock = vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              status: 1,
              product: {
                product_name: 'Skyr Natur',
                brands: 'Spar',
                serving_quantity: 150,
                nutriments: {
                  'energy-kcal_100g': 63,
                  proteins_100g: 11,
                  carbohydrates_100g: 4,
                  sugars_100g: 4,
                  fat_100g: 0.2,
                  salt_100g: 0.1,
                },
              },
            }),
            { status: 200 },
          ),
        ),
      );
      vi.stubGlobal('fetch', fetchMock);
      try {
        const user = userEvent.setup();
        await renderAt('/ernaehrung/hinzufuegen?mahlzeit=breakfast', 'Lebensmittel hinzufügen');
        await user.click(screen.getByRole('button', { name: 'Barcode scannen' }));
        const scanner = await screen.findByRole('dialog', { name: 'Barcode scannen' }, WAIT);
        // Ohne Kamera (jsdom) bleibt die Eingabe von Hand.
        expect(within(scanner).getByText(/Kamera ist hier nicht verfügbar/)).toBeVisible();
        await user.type(within(scanner).getByLabelText('Barcode eingeben'), '9001234567897');
        await user.click(within(scanner).getByRole('button', { name: 'Suchen' }));
        expect(within(scanner).getByRole('alert')).toHaveTextContent('kein gültiger Barcode');
        await user.clear(within(scanner).getByLabelText('Barcode eingeben'));
        await user.type(within(scanner).getByLabelText('Barcode eingeben'), '9001234567896');
        await user.click(within(scanner).getByRole('button', { name: 'Suchen' }));

        const consent = await screen.findByRole(
          'dialog',
          { name: 'Open Food Facts verwenden?' },
          WAIT,
        );
        expect(fetchMock).not.toHaveBeenCalled();
        await user.click(within(consent).getByRole('button', { name: 'Erlauben und suchen' }));

        const log = await screen.findByRole('dialog', { name: 'Skyr Natur hinzufügen' }, WAIT);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toMatch(
          /^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/9001234567896\.json\?fields=/,
        );
        expect(
          within(log).getByText('„Skyr Natur“ unter „Meine Lebensmittel“ gespeichert'),
        ).toBeVisible();
        expect(within(log).getByLabelText('Einheit')).toBeVisible();
        await user.click(within(log).getByRole('button', { name: 'Hinzufügen' }));
        await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
        const [food] = await listFoods(rt.db);
        expect(food).toMatchObject({ barcode: '9001234567896', source: 'off', brand: 'Spar' });
        const [entry] = await listDayEntries(rt.db, localDay());
        expect(entry).toMatchObject({
          nameSnapshot: 'Skyr Natur',
          brandSnapshot: 'Spar',
          amount: 150,
        });

        // Zweiter Scan: lokal, ohne Anfrage.
        cleanup();
        await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
        await user.click(screen.getByRole('button', { name: 'Barcode scannen' }));
        const again = await screen.findByRole('dialog', { name: 'Barcode scannen' }, WAIT);
        await user.type(within(again).getByLabelText('Barcode eingeben'), '9001234567896');
        await user.click(within(again).getByRole('button', { name: 'Suchen' }));
        expect(
          await screen.findByRole('dialog', { name: 'Skyr Natur hinzufügen' }, WAIT),
        ).toBeVisible();
        expect(fetchMock).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  it(
    'bietet bei unbekanntem Barcode das Formular mit Barcode an',
    { timeout: 30_000 },
    async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(() =>
          Promise.resolve(new Response(JSON.stringify({ status: 0 }), { status: 404 })),
        ),
      );
      try {
        const user = userEvent.setup();
        const router = await renderAt(
          '/ernaehrung/hinzufuegen?mahlzeit=lunch',
          'Lebensmittel hinzufügen',
        );
        await setOffConsentForTest();
        await user.click(screen.getByRole('button', { name: 'Barcode scannen' }));
        const scanner = await screen.findByRole('dialog', { name: 'Barcode scannen' }, WAIT);
        await user.type(within(scanner).getByLabelText('Barcode eingeben'), '96385074');
        await user.click(within(scanner).getByRole('button', { name: 'Suchen' }));
        expect(
          await within(scanner).findByText(
            /96385074 ist bei Open Food Facts nicht bekannt/,
            {},
            WAIT,
          ),
        ).toBeVisible();
        await user.click(within(scanner).getByRole('button', { name: 'Selbst anlegen' }));
        await screen.findByRole('heading', { level: 1, name: 'Neues Lebensmittel' }, WAIT);
        expect(screen.getByLabelText('Barcode (optional)')).toHaveValue('96385074');
        expect(router.state.location.search).toContain('zurueck=');
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  it(
    'legt ein Rezept aus zwei Zutaten an und trägt eine Portion ein (D-267)',
    { timeout: 60_000 },
    async () => {
      await seedCatalog();
      const user = userEvent.setup();
      await renderAt('/ernaehrung/rezepte', 'Rezepte');
      expect(await screen.findByText(/Noch keine Rezepte/, {}, WAIT)).toBeVisible();
      await user.click(screen.getByRole('link', { name: 'Neues Rezept' }));
      await screen.findByRole('heading', { level: 1, name: 'Neues Rezept' }, WAIT);
      await user.type(screen.getByLabelText('Name'), 'Overnight Oats');
      await user.clear(screen.getByLabelText('Portionen'));
      await user.type(screen.getByLabelText('Portionen'), '2');

      const addIngredient = async (query: string, name: RegExp, amount: string) => {
        await user.click(screen.getByRole('button', { name: 'Zutat hinzufügen' }));
        const picker = await screen.findByRole('dialog', { name: 'Zutat hinzufügen' }, WAIT);
        await waitFor(() => {
          expect(picker.querySelector('[aria-busy="true"]')).toBeNull();
        }, WAIT);
        await user.type(within(picker).getByLabelText('Zutat suchen'), query);
        await user.click(await within(picker).findByRole('button', { name }, WAIT));
        const amountDialog = screen.getByRole('dialog', { name: /: Menge$/ });
        await user.clear(within(amountDialog).getByLabelText('Menge in g'));
        await user.type(within(amountDialog).getByLabelText('Menge in g'), amount);
        await user.click(within(amountDialog).getByRole('button', { name: 'Hinzufügen' }));
      };
      await addIngredient('haferflocken', /^Hafer FlockenÖNWT/, '80');
      await addIngredient('banane roh', /^Banane rohÖNWT/, '120');
      expect(screen.getByLabelText('Menge Hafer Flocken in g')).toHaveValue('80');
      const table = screen.getByRole('table', { name: 'Nährwerte' });
      const energy = within(table).getByRole('row', { name: /Energie/ });
      expect(
        within(energy)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ).toEqual(['187 kcal', '373 kcal']);
      expect(screen.getByText(/Zutaten zusammen 200 g/)).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Speichern' }));
      await screen.findByRole('heading', { level: 1, name: 'Rezepte' }, WAIT);
      expect(await screen.findByText('2 Portionen · 187 kcal je Portion', {}, WAIT)).toBeVisible();

      cleanup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=breakfast', 'Lebensmittel hinzufügen');
      await waitFor(() => {
        expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      }, WAIT);
      await user.type(screen.getByLabelText('Lebensmittel suchen'), 'overnight');
      await user.click(await screen.findByRole('button', { name: /^Overnight OatsRezept/ }, WAIT));
      const log = screen.getByRole('dialog', { name: 'Overnight Oats hinzufügen' });
      expect(within(log).getByRole('status')).toHaveTextContent('187 kcal');
      await user.click(within(log).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      const [entry] = await listDayEntries(rt.db, localDay());
      expect(entry).toMatchObject({ kind: 'recipe', nameSnapshot: 'Overnight Oats', amount: 100 });
    },
  );

  it(
    'speichert eine Mahlzeit als Vorlage und trägt sie mit einem Tipp ein (D-268)',
    { timeout: 60_000 },
    async () => {
      const user = userEvent.setup();
      await logQuick(rt, { name: 'Müsli', slot: 'breakfast', dayKey: localDay(), kcal: 350 });
      await logQuick(rt, { name: 'Kaffee', slot: 'breakfast', dayKey: localDay(), kcal: 30 });
      await renderAt('/ernaehrung', 'Ernährung');
      await user.click(
        await screen.findByRole('button', { name: 'Frühstück als Vorlage speichern' }, WAIT),
      );
      const save = screen.getByRole('dialog', { name: 'Als Vorlage speichern' });
      expect(within(save).getByLabelText('Name der Vorlage')).toHaveValue('Frühstück');
      await user.clear(within(save).getByLabelText('Name der Vorlage'));
      await user.type(within(save).getByLabelText('Name der Vorlage'), 'Mein Frühstück');
      await user.click(within(save).getByRole('button', { name: 'Speichern' }));
      expect(
        await screen.findByText('Vorlage „Mein Frühstück“ gespeichert', {}, WAIT),
      ).toBeVisible();

      cleanup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=dinner', 'Lebensmittel hinzufügen');
      const templates = await screen.findByRole('list', { name: 'Vorlagen' }, WAIT);
      expect(within(templates).getByText('2 Einträge · 380 kcal')).toBeVisible();
      await user.click(within(templates).getByRole('button', { name: /Mein Frühstück/ }));
      const apply = screen.getByRole('dialog', { name: 'Mein Frühstück eintragen' });
      expect(within(apply).getByText('Alle Einträge kommen zu „Abendessen“.')).toBeVisible();
      await user.click(within(apply).getByRole('button', { name: 'Alle eintragen' }));
      const dinner = await screen.findByRole('region', { name: 'Abendessen' }, WAIT);
      expect(await within(dinner).findByText('Müsli', {}, WAIT)).toBeVisible();
      expect(within(dinner).getByText('Kaffee')).toBeVisible();
      expect(await listDayEntries(rt.db, localDay())).toHaveLength(4);

      cleanup();
      await renderAt('/ernaehrung/vorlagen', 'Vorlagen');
      await user.click(await screen.findByRole('button', { name: 'Mein Frühstück löschen' }, WAIT));
      expect(await screen.findByText('Vorlage „Mein Frühstück“ gelöscht', {}, WAIT)).toBeVisible();
      expect(await screen.findByText(/Noch keine Vorlagen/, {}, WAIT)).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
      expect(await screen.findByText('Mein Frühstück', {}, WAIT)).toBeVisible();
    },
  );

  it(
    'belegt Mengen ab 1000 ohne Tausenderpunkt vor und ändert sie nicht ungewollt (D-291)',
    { timeout: 60_000 },
    async () => {
      const user = userEvent.setup();
      const food = await createFood(rt, {
        name: 'Hafermilch',
        basis: 'ml',
        per100: { kcal: 46, protein: 1, carbs: 7, fat: 1.5 },
        servings: [{ name: 'Packung', amount: 1000 }],
      });
      const item = toFoodItem(food);
      const packung = food.servings[0]!;
      await logFood(rt, {
        food: item,
        slot: 'breakfast',
        dayKey: localDay(),
        quantity: { kind: 'amount', amount: 1500 },
      });
      await logFood(rt, {
        food: item,
        slot: 'breakfast',
        dayKey: localDay(),
        quantity: { kind: 'serving', servingId: packung.id, count: 1 / 3 },
      });
      const recipe = await createRecipe(rt, {
        name: 'Porridge',
        servings: 4,
        ingredients: [ingredientFrom(item, { kind: 'amount', amount: 1200 })],
      });

      // Eintrag bearbeiten: „1500“ statt „1.500“; nur die Mahlzeit ändern lässt die Menge in Ruhe.
      await renderAt('/ernaehrung', 'Ernährung');
      const breakfast = await screen.findByRole('region', { name: 'Frühstück' }, WAIT);
      const [byAmount] = within(breakfast).getAllByRole('button', {
        name: 'Hafermilch bearbeiten',
      });
      await user.click(byAmount!);
      const editAmount = screen.getByRole('dialog', { name: 'Hafermilch' });
      expect(within(editAmount).getByLabelText('Menge in ml')).toHaveValue('1500');
      await user.selectOptions(within(editAmount).getByLabelText('Mahlzeit'), 'lunch');
      await user.click(within(editAmount).getByRole('button', { name: 'Speichern' }));
      const lunch = await screen.findByRole('region', { name: 'Mittagessen' }, WAIT);
      await within(lunch).findByText('Hafermilch', {}, WAIT);

      // Portion: ein Drittel wird als „0,33“ gezeigt, bleibt beim Speichern aber ein Drittel.
      const remaining = await screen.findByRole('region', { name: 'Frühstück' }, WAIT);
      await user.click(within(remaining).getByRole('button', { name: 'Hafermilch bearbeiten' }));
      const editServing = screen.getByRole('dialog', { name: 'Hafermilch' });
      expect(within(editServing).getByLabelText('Anzahl (Packung)')).toHaveValue('0,33');
      await user.selectOptions(within(editServing).getByLabelText('Mahlzeit'), 'lunch');
      await user.click(within(editServing).getByRole('button', { name: 'Speichern' }));
      await waitFor(async () => {
        const entries = await listDayEntries(rt.db, localDay());
        expect(entries.map((e) => e.slot)).toEqual(['lunch', 'lunch']);
      }, WAIT);
      const entries = await listDayEntries(rt.db, localDay());
      const amountEntry = entries.find((e) => e.servingSnapshot === undefined);
      const servingEntry = entries.find((e) => e.servingSnapshot !== undefined);
      expect(amountEntry).toMatchObject({ amount: 1500, nutrients: { kcal: 690 } });
      expect(servingEntry?.amount).toBe(333.3);
      expect(servingEntry?.servingSnapshot?.count).toBeCloseTo(1 / 3, 10);

      // Lebensmittel bearbeiten: Portion „1000“ statt „1.000“; Speichern lässt sie bei 1000.
      cleanup();
      await renderAt(`/ernaehrung/lebensmittel/${food.id}`, 'Lebensmittel bearbeiten');
      expect(
        screen.getByLabelText('Menge in ml', { selector: 'input[id$="-s0-amount"]' }),
      ).toHaveValue('1000');
      await user.click(screen.getByRole('button', { name: 'Speichern' }));
      await screen.findByRole('heading', { level: 1, name: 'Meine Lebensmittel' }, WAIT);
      expect((await listFoods(rt.db))[0]?.servings[0]?.amount).toBe(1000);

      // Rezept bearbeiten: Zutat „1200“ statt „1.200“; Speichern lässt sie bei 1200.
      cleanup();
      await renderAt(`/ernaehrung/rezepte/${recipe.id}`, 'Rezept bearbeiten');
      expect(screen.getByLabelText('Menge Hafermilch in ml')).toHaveValue('1200');
      await user.click(screen.getByRole('button', { name: 'Speichern' }));
      await screen.findByRole('heading', { level: 1, name: 'Rezepte' }, WAIT);
      expect((await listRecipes(rt.db))[0]?.ingredients[0]?.amount).toBe(1200);
    },
  );
});

describe('Weitere Nährwerte mit Tagesreferenz (D-359)', () => {
  it(
    'zeigt Ist und Referenz mit Quelle; Einträge ohne Angabe zählen nicht als 0',
    { timeout: 30_000 },
    async () => {
      const muesli = await createFood(rt, {
        name: 'Müsli',
        basis: 'g',
        per100: {
          kcal: 370,
          protein: 10,
          carbs: 60,
          sugar: 20,
          fat: 8,
          saturatedFat: 2,
          fiber: 8,
          salt: 0.5,
        },
        servings: [],
      });
      // Apfel ohne Salz, gesättigte Fettsäuren und Ballaststoffe.
      const apple = await createFood(rt, {
        name: 'Apfel',
        basis: 'g',
        per100: { kcal: 58, protein: 0.3, carbs: 12, sugar: 10, fat: 0.6 },
        servings: [],
      });
      for (const [food, amount] of [
        [muesli, 100],
        [apple, 150],
      ] as const) {
        await logFood(rt, {
          food: toFoodItem(food),
          slot: 'breakfast',
          dayKey: localDay(),
          quantity: { kind: 'amount', amount },
        });
      }

      await renderAt('/ernaehrung', 'Ernährung');
      await screen.findByRole('region', { name: 'Frühstück' }, WAIT);
      const list = await openExtras();
      const terms = within(list).getAllByRole('term');
      const row = (label: string) => {
        const term = terms.find((item) => item.textContent.startsWith(label));
        if (!term?.parentElement) throw new Error(`Zeile ${label} fehlt`);
        return term.parentElement;
      };
      // Reihenfolge: Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe; je Zeile nur Name und
      // „Ist / Referenz g“ (D-363).
      expect(terms.map((term) => term.textContent.slice(0, 13))).toEqual([
        'Salz',
        'Zucker',
        'Gesättigte Fe',
        'Ballaststoffe',
      ]);
      // Zucker: 20 g aus dem Müsli und 15 g aus dem Apfel, beide mit Angabe: kein Sternchen.
      expect(row('Zucker').querySelector('dd')?.textContent).toBe('35 / 90 g');
      // Beim Apfel fehlen Salz, gesättigte Fettsäuren und Ballaststoffe: Sternchen, nicht als 0.
      for (const [label, ist, reference] of [
        ['Salz', '0,5', '6'],
        ['Gesättigte Fettsäuren', '2', '20'],
        ['Ballaststoffe', '8', '30'],
      ] as const) {
        const value = row(label).querySelector('dd');
        expect(value).toHaveTextContent(`${ist}* (nicht bei allen Einträgen angegeben) /`);
        expect(value?.textContent.endsWith(`/ ${reference} g`)).toBe(true);
      }
      // Ohne „von höchstens“, ohne Erklärzeilen, Quellen und Hinweise zu fehlenden Werten.
      expect(list.textContent).not.toMatch(/höchstens|mindestens|LMIV|DGE|Ohne Angabe|!/);
      expect(list.textContent).not.toMatch(/gut|super|geschafft/i);
      // Auch die Karte nennt die vier Werte nicht noch einmal; Eiweiß, Kohlenhydrate und Fett
      // haben beide Einträge.
      expect(screen.queryByText(/fehlen Werte für/)).toBeNull();

      // Erklärung, Sternchen, Einträge ohne Angabe und Quellen im Info-Blatt.
      await userEvent
        .setup()
        .click(within(list).getByRole('button', { name: 'Erklärung und Quellen' }));
      const sheet = screen.getByRole('dialog', { name: 'Weitere Nährwerte' });
      expect(sheet).toHaveTextContent('Salz: höchstens 6 g');
      expect(sheet).toHaveTextContent('Ballaststoffe: mindestens 30 g');
      expect(sheet).toHaveTextContent('Gesamtzucker, auch aus Obst und Milch.');
      expect(sheet).toHaveTextContent('Richtwert der DGE für Erwachsene.');
      expect(sheet).toHaveTextContent('* Bei mindestens einem Eintrag fehlt dieser Wert.');
      const missing = within(sheet).getByRole('heading', { name: 'Ohne Angabe an diesem Tag' });
      expect(missing.nextElementSibling).toHaveTextContent(
        'Salz:ApfelGesättigte Fettsäuren:ApfelBallaststoffe:Apfel',
      );
      expect(sheet).toHaveTextContent(/VO \(EU\) Nr\. 1169\/2011, Anhang XIII/);
      expect(sheet).toHaveTextContent(/freien Zucker unter 10 % der Energie/);
      expect(sheet.textContent).not.toMatch(/!/);
    },
  );

  it('zeigt „–“ mit Sternchen, wenn kein Eintrag einen Wert hat', { timeout: 30_000 }, async () => {
    await logQuick(rt, { kcal: 300, slot: 'lunch', dayKey: localDay() });
    await renderAt('/ernaehrung', 'Ernährung');
    const list = await openExtras();
    const salt = within(list).getByText('Salz', { selector: 'dt' }).parentElement;
    expect(salt?.querySelector('dd')).toHaveTextContent(
      '–* (nicht bei allen Einträgen angegeben) / 6 g',
    );
    expect(salt).not.toHaveTextContent('0 /');
    // Der Hinweis unter den Makros nennt nur Eiweiß, Kohlenhydrate und Fett (D-363).
    expect(
      screen.getByText(
        'Bei mindestens einem Eintrag fehlen Werte für Eiweiß, Kohlenhydrate und Fett.',
      ),
    ).toBeVisible();
    await userEvent
      .setup()
      .click(within(list).getByRole('button', { name: 'Erklärung und Quellen' }));
    // Fehlt derselbe Eintrag bei allen vier Werten, steht er im Blatt einmal.
    const sheet = screen.getByRole('dialog', { name: 'Weitere Nährwerte' });
    const missing = within(sheet).getByRole('heading', { name: 'Ohne Angabe an diesem Tag' });
    expect(missing.nextElementSibling).toHaveTextContent('Alle vier Werte:Schnelleintrag');
  });
});

/** „Weitere Nährwerte“ aufklappen (in jsdom über das Attribut, wie ein Tipp auf den Pfeil). */
async function openExtras(): Promise<HTMLElement> {
  const details = await waitFor(() => {
    const found = document.querySelector('summary[aria-label="Weitere Nährwerte"]')?.parentElement;
    if (!(found instanceof HTMLDetailsElement)) throw new Error('Weitere Nährwerte fehlen');
    return found;
  }, WAIT);
  details.open = true;
  return screen.findByRole('group', { name: 'Weitere Nährwerte' }, WAIT);
}

describe('Grundauswahl: suchen, Menge in g oder Stück, eintragen (D-362, Richtwerte D-365)', () => {
  const APFEL = stableId('bls:F110100');
  /** Richtwert für 1 Apfel aus der Liste (essbarer Anteil, D-365). */
  const APFEL_G = 158;

  async function openFood(query: string, button: RegExp, dialogName: string) {
    const user = userEvent.setup();
    const search = await screen.findByLabelText('Lebensmittel suchen', {}, WAIT);
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    }, WAIT);
    await user.clear(search);
    await user.type(search, query);
    await user.click(await screen.findByRole('button', { name: button }, WAIT));
    return { user, dialog: screen.getByRole('dialog', { name: dialogName }) };
  }

  it(
    'trägt zwei Eier als Stück ein; Plus zählt in halben Stück; Ring und weitere Nährwerte sofort',
    { timeout: 40_000 },
    async () => {
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=breakfast', 'Lebensmittel hinzufügen');
      const { user, dialog } = await openFood('Eier', /^EiBLS135 kcal/, 'Ei hinzufügen');
      // Mit Richtwert ist „1 Stück“ vorgewählt (D-365).
      expect(within(dialog).getByRole('radio', { name: 'Stück' })).toBeChecked();
      expect(within(dialog).getByLabelText('Anzahl (Stück)')).toHaveValue('1');
      expect(within(dialog).getByText('1 Stück · ca. 51 g')).toBeVisible();
      expect(within(dialog).getByText(/^Richtwert: 51 g je Stück/)).toBeVisible();
      expect(within(dialog).getByRole('status')).toHaveTextContent('69 kcal');
      expect(within(dialog).getByText('Quelle: BLS 4.0, E111100 „Hühnerei roh“')).toBeVisible();
      // Plus und Minus in halben Stück.
      const more = within(dialog).getByRole('button', { name: 'Anzahl erhöhen' });
      await user.click(more);
      expect(within(dialog).getByText('1,5 Stück · ca. 77 g')).toBeVisible();
      await user.click(more);
      expect(within(dialog).getByLabelText('Anzahl (Stück)')).toHaveValue('2');
      expect(within(dialog).getByText('2 Stück · ca. 102 g')).toBeVisible();
      expect(within(dialog).getByRole('status')).toHaveTextContent('138 kcal');
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));

      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      const breakfast = await screen.findByRole('region', { name: 'Frühstück' }, WAIT);
      expect(within(breakfast).getByText('Ei')).toBeVisible();
      expect(within(breakfast).getByText('2 × Stück (102 g)')).toBeVisible();
      expect(screen.getAllByText('138 kcal').length).toBeGreaterThan(0);
      const list = await screen.findByRole(
        'group',
        { name: 'Weitere Nährwerte', hidden: true },
        WAIT,
      );
      const salt = within(list).getByText('Salz', { selector: 'dt' }).parentElement;
      expect(salt?.querySelector('dd')).toHaveTextContent('0,4 / 6 g');
      const [entry] = await listDayEntries(rt.db, localDay());
      expect(entry).toMatchObject({
        nameSnapshot: 'Ei',
        amount: 102,
        servingSnapshot: { name: 'Stück', count: 2 },
        nutrients: { kcal: 137.7, protein: 13.44, fat: 9.18, salt: 0.4, fiber: 0 },
      });
      // Ohne Anpassung merkt sich die App nichts: Es gilt der Richtwert.
      expect((await loadSettings(rt.db)).pieceWeights).toBeUndefined();
    },
  );

  it(
    'Apfel: Richtwert vorgewählt, ein Tipp trägt ein; „Gewicht anpassen“ wird gemerkt und lässt sich zurücksetzen',
    { timeout: 60_000 },
    async () => {
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
      let { user, dialog } = await openFood('Äpfel', /^ApfelBLS58 kcal/, 'Apfel hinzufügen');
      expect(within(dialog).getByRole('radio', { name: 'Stück' })).toBeChecked();
      expect(within(dialog).getByText(`1 Stück · ca. ${APFEL_G} g`)).toBeVisible();
      expect(within(dialog).getByText(/^Richtwert: \d+ g je Stück/)).toBeVisible();
      // Keine Frage nach dem Gewicht.
      expect(within(dialog).queryByLabelText('Gewicht für 1 Stück in g')).toBeNull();
      expect(within(dialog).queryByText(/Küchenwaage/)).toBeNull();
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      expect((await listDayEntries(rt.db, localDay()))[0]).toMatchObject({
        amount: APFEL_G,
        servingSnapshot: { name: 'Stück', count: 1 },
      });
      expect((await loadSettings(rt.db)).pieceWeights).toBeUndefined();

      // „Gewicht anpassen“: Feld mit dem Richtwert, mit Fokus; beim Hinzufügen gemerkt.
      cleanup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
      ({ user, dialog } = await openFood('Apfel', /^ApfelBLS58 kcal/, 'Apfel hinzufügen'));
      await user.click(within(dialog).getByRole('button', { name: 'Gewicht anpassen' }));
      const weight = within(dialog).getByLabelText('Gewicht für 1 Stück in g');
      expect(weight).toHaveValue(String(APFEL_G));
      expect(weight).toHaveAccessibleDescription(/^Richtwert: \d+ g je Stück.*merkt sich/);
      await waitFor(() => {
        expect(weight).toHaveFocus();
      });
      await user.clear(weight);
      await user.type(weight, '180');
      expect(within(dialog).getByText('1 Stück · ca. 180 g')).toBeVisible();
      expect(within(dialog).getByRole('status')).toHaveTextContent('104 kcal');
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      expect((await loadSettings(rt.db)).pieceWeights).toEqual({ [APFEL]: 180 });

      // Der nächste Apfel zeigt das eigene Gewicht; zurücksetzen nimmt es beim Hinzufügen zurück.
      cleanup();
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
      ({ user, dialog } = await openFood('Apfel', /^ApfelBLS58 kcal/, 'Apfel hinzufügen'));
      expect(within(dialog).getByText('1 Stück · ca. 180 g')).toBeVisible();
      expect(
        within(dialog).getByText(`Dein Gewicht: 180 g je Stück, Richtwert ${APFEL_G} g`),
      ).toBeVisible();
      await user.click(within(dialog).getByRole('button', { name: 'Auf Richtwert zurücksetzen' }));
      expect(within(dialog).getByText(`1 Stück · ca. ${APFEL_G} g`)).toBeVisible();
      expect(
        within(dialog).queryByRole('button', { name: 'Auf Richtwert zurücksetzen' }),
      ).toBeNull();
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      await screen.findByRole('heading', { level: 1, name: 'Ernährung' }, WAIT);
      expect((await loadSettings(rt.db)).pieceWeights).toBeUndefined();
    },
  );

  it(
    'wechselt zu Gramm mit derselben Menge und lehnt krumme Stückzahlen ab',
    { timeout: 30_000 },
    async () => {
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=snacks', 'Lebensmittel hinzufügen');
      const { user, dialog } = await openFood('Eier', /^EiBLS135 kcal/, 'Ei hinzufügen');
      const count = within(dialog).getByLabelText('Anzahl (Stück)');
      await user.clear(count);
      await user.type(count, '1,3');
      await user.click(within(dialog).getByRole('button', { name: 'Hinzufügen' }));
      expect(within(dialog).getByRole('alert')).toHaveTextContent(
        'in ganzen oder halben Schritten',
      );
      await user.clear(count);
      await user.type(count, '2');
      // „Gramm“ bleibt wählbar; aus 2 Stück zu 51 g werden 102 g.
      await user.click(within(dialog).getByRole('radio', { name: 'Gramm' }));
      expect(within(dialog).getByLabelText('Menge in g')).toHaveValue('102');
      expect(within(dialog).queryByText(/Richtwert/)).toBeNull();
      expect(await listDayEntries(rt.db, localDay())).toEqual([]);
    },
  );

  it('ohne Richtwert nur Gramm, ohne „Stück“ und ohne Frage', { timeout: 30_000 }, async () => {
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
    const { dialog } = await openFood(
      'Kürbis',
      /^Kürbis, HokkaidoBLS/,
      'Kürbis, Hokkaido hinzufügen',
    );
    expect(within(dialog).queryByRole('radio')).toBeNull();
    expect(within(dialog).queryByText('Stück')).toBeNull();
    expect(within(dialog).getByLabelText('Menge in g')).toHaveValue('100');
    expect(within(dialog).queryByText(/Richtwert|Gewicht für 1/)).toBeNull();
  });

  it(
    'kennzeichnet abgeleitete Werte und nennt die Quelle, auch bei USDA',
    { timeout: 30_000 },
    async () => {
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
      const feta = await openFood('Feta', /^FetaBLS284 kcal/, 'Feta hinzufügen');
      const fiber = within(feta.dialog).getByRole('rowheader', { name: 'Ballaststoffe' });
      expect(fiber.nextElementSibling).toHaveTextContent('0 g* (abgeleitet)');
      expect(
        within(feta.dialog).getByText(/^\* Abgeleitet: Die Quelle nennt keinen Wert/),
      ).toBeVisible();
      await feta.user.click(within(feta.dialog).getByRole('button', { name: 'Abbrechen' }));

      const { dialog } = await openFood(
        'Pfefferoni',
        /^PfefferoniUSDA45 kcal/,
        'Pfefferoni hinzufügen',
      );
      expect(
        within(dialog).getByText(
          'Quelle: USDA SR28, 11670 „Peppers, hot chili, green, raw“, umgerechnet nach EU-Regeln',
        ),
      ).toBeVisible();
      expect(within(dialog).queryByText(/Abgeleitet/)).toBeNull();
    },
  );

  it(
    'zeigt die zweite Spalte nur, wenn die Menge von 100 g abweicht (D-364)',
    { timeout: 30_000 },
    async () => {
      await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
      const { user, dialog } = await openFood('Feta', /^FetaBLS284 kcal/, 'Feta hinzufügen');
      const table = within(dialog).getByRole('table', { name: 'Nährwerte' });
      const headers = () =>
        within(table)
          .getAllByRole('columnheader')
          .map((header) => header.textContent);
      // 100 g: eine Spalte, mit Kopf „je 100 g“.
      expect(headers()).toEqual(['je 100 g']);
      const energy = within(table).getByRole('row', { name: /Energie/ });
      expect(
        within(energy)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ).toEqual(['284 kcal']);
      // 150 g: zwei Spalten.
      const amount = within(dialog).getByLabelText('Menge in g');
      await user.clear(amount);
      await user.type(amount, '150');
      expect(headers()).toEqual(['je 100 g', 'für 150 g']);
      expect(
        within(energy)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ).toEqual(['284 kcal', '426 kcal']);
      // Köpfe und Werte brechen nicht um, die Wertespalten haben eine feste Breite.
      for (const cell of table.querySelectorAll('thead th, tbody td')) {
        expect(cell).toHaveClass('whitespace-nowrap');
        expect(cell.className).toMatch(/w-\[(3\.75|6\.25)rem\]/);
      }
      // Wieder 100 g: wieder eine Spalte.
      await user.clear(amount);
      await user.type(amount, '100');
      expect(headers()).toEqual(['je 100 g']);
    },
  );

  it('nennt bei Stück die Anzahl im Spaltenkopf (D-364)', { timeout: 30_000 }, async () => {
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=breakfast', 'Lebensmittel hinzufügen');
    const { user, dialog } = await openFood('Eier', /^EiBLS135 kcal/, 'Ei hinzufügen');
    const table = within(dialog).getByRole('table', { name: 'Nährwerte' });
    expect(within(table).getByRole('columnheader', { name: 'für 1 Stück' })).toBeVisible();
    const count = within(dialog).getByLabelText('Anzahl (Stück)');
    await user.clear(count);
    await user.type(count, '2');
    expect(within(table).getByRole('columnheader', { name: 'für 2 Stück' })).toBeVisible();
  });
});
