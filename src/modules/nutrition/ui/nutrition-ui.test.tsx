// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { catalogDbName } from '../data/catalogStore';
import { listDayEntries, listFoods, listTargets } from '../data/nutritionRepository';
import { nutritionRoutes } from '../routes';
import { localDayKey } from '../service/nutritionService';

const localDay = () => localDayKey(new Date());

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
    'protokolliert aus dem BLS, ändert, löscht mit Rückgängig und nimmt Schnelleinträge',
    { timeout: 40_000 },
    async () => {
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
        await screen.findByRole('button', { name: /^Hafer FlockenBLS348 kcal/ }, WAIT),
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

  it('findet österreichische Bezeichnungen', { timeout: 30_000 }, async () => {
    const user = userEvent.setup();
    await renderAt('/ernaehrung/hinzufuegen?mahlzeit=lunch', 'Lebensmittel hinzufügen');
    const search = await screen.findByLabelText('Lebensmittel suchen', {}, WAIT);
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    }, WAIT);
    await user.type(search, 'topfen');
    const list = await screen.findByRole('list', { name: /Treffer$/ }, WAIT);
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(5);
    expect(within(list).getAllByRole('button')[0]).toHaveTextContent(/quark/i);
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
    expect(await within(snacks).findByText('1 × Becher (450 g)')).toBeVisible();
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
});
