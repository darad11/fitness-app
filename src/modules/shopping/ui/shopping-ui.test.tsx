// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listShoppingItems } from '../data/shoppingRepository';
import { shoppingRoutes } from '../routes';

// Eigene Lebensmittel aus „Meine Küche“ (Ernährungsmodul) als Vorschläge.
vi.mock('@/modules/nutrition', () => ({
  loadOwnFoodNames: () => Promise.resolve(['Skyr natur', 'Milch']),
}));

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

function renderList() {
  const router = createMemoryRouter(shoppingRoutes, {
    initialEntries: ['/ernaehrung/einkaufsliste'],
  });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
}

const field = () => screen.getByLabelText('Was möchtest du einkaufen?');
const rows = () =>
  screen.queryAllByRole('checkbox').map((box) => box.closest('label')?.textContent ?? '');

describe('Einkaufsliste (D-287)', () => {
  it('trägt mehrere Artikel nacheinander ein, erkennt Mengen und verhindert Leeres', async () => {
    const user = userEvent.setup();
    renderList();
    expect(await screen.findByText(/Die Liste ist leer/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Zur Liste hinzufügen' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Gib einen Namen ein.');
    for (const text of ['500 g Hähnchenbrust', 'Äpfel', 'Reis 1 kg']) {
      await user.type(field(), `${text}{Enter}`);
      await waitFor(() => {
        expect(field()).toHaveValue('');
      });
    }
    expect(field()).toHaveFocus();
    await waitFor(() => {
      expect(rows()).toEqual(['Hähnchenbrust500 g', 'Äpfel', 'Reis1 kg']);
    });
    expect(screen.getByText('0 von 3 gekauft')).toBeVisible();
    // Nichts davon landet im Ernährungstagebuch.
    expect(await rt.db.foodLog.count()).toBe(0);
  });

  it('fragt bei Doppelten nach und rechnet gleiche Einheiten zusammen', async () => {
    const user = userEvent.setup();
    renderList();
    await user.type(await screen.findByLabelText('Was möchtest du einkaufen?'), 'Reis 1 kg{Enter}');
    await waitFor(() => {
      expect(rows()).toEqual(['Reis1 kg']);
    });
    await user.type(field(), 'reis 500 g{Enter}');
    expect(await screen.findByText(/„Reis“ steht schon auf der Liste \(1 kg\)/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /dazurechnen/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    await user.clear(field());
    await user.type(field(), 'Reis 2 kg{Enter}');
    await user.click(await screen.findByRole('button', { name: '2 kg dazurechnen' }));
    await waitFor(() => {
      expect(rows()).toEqual(['Reis3 kg']);
    });
  });

  it('abhaken, wieder öffnen, Gekaufte entfernen mit Rückgängig, „Zuletzt gekauft“', async () => {
    const user = userEvent.setup();
    renderList();
    for (const text of ['Milch', 'Brot']) {
      await user.type(await screen.findByLabelText('Was möchtest du einkaufen?'), `${text}{Enter}`);
      await waitFor(() => {
        expect(field()).toHaveValue('');
      });
    }
    await user.click(await screen.findByRole('checkbox', { name: 'Milch' }));
    expect(await screen.findByText('1 von 2 gekauft')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Gekauft (1)' }));
    const milk = await screen.findByRole('checkbox', { name: 'Milch' });
    expect(milk).toBeChecked();
    await user.click(milk);
    expect(await screen.findByText('0 von 2 gekauft')).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Milch' }));
    await user.click(await screen.findByRole('button', { name: 'Gekaufte entfernen' }));
    expect(await screen.findByText('1 Artikel entfernt')).toBeVisible();
    await waitFor(() => {
      expect(rows()).toEqual(['Brot']);
    });
    expect(screen.getByRole('button', { name: 'Milch wieder hinzufügen' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () => {
      expect((await listShoppingItems(rt.db)).every((i) => i.clearedAt === undefined)).toBe(true);
    });
  });

  it('bearbeitet Menge, Einheit und Kategorie, löscht mit Rückgängig, Ansicht nach Kategorie', async () => {
    const user = userEvent.setup();
    renderList();
    for (const text of ['Äpfel', 'Klopapier', 'Geschenk']) {
      await user.type(await screen.findByLabelText('Was möchtest du einkaufen?'), `${text}{Enter}`);
      await waitFor(() => {
        expect(field()).toHaveValue('');
      });
    }
    await user.click(await screen.findByRole('button', { name: 'Äpfel bearbeiten' }));
    await user.type(screen.getByLabelText('Menge'), '6');
    await user.selectOptions(screen.getByLabelText('Einheit'), 'Stück');
    await user.type(screen.getByLabelText('Notiz (optional)'), 'grüne');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(rows()[0]).toBe('Äpfelgrüne6 Stück');
    });

    await user.click(screen.getByText('Nach Kategorie'));
    const produce = screen.getByRole('region', { name: 'Obst und Gemüse' });
    expect(within(produce).getByText('Äpfel')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Haushalt' })).toHaveTextContent('Klopapier');
    expect(screen.getByRole('region', { name: 'Ohne Kategorie' })).toHaveTextContent('Geschenk');

    await user.click(screen.getByRole('button', { name: 'Geschenk bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(await screen.findByText('„Geschenk“ gelöscht')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Ohne Kategorie' })).toBeNull();
    });
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(await screen.findByRole('region', { name: 'Ohne Kategorie' })).toBeVisible();
  });

  it('schlägt beim Tippen frühere Namen und eigene Lebensmittel vor, ein Tipp fügt hinzu', async () => {
    const user = userEvent.setup();
    renderList();
    await user.type(await screen.findByLabelText('Was möchtest du einkaufen?'), 'milch{Enter}');
    await waitFor(() => {
      expect(rows()).toEqual(['milch']);
    });
    // Leeres Feld: keine Vorschläge.
    expect(screen.queryByRole('list', { name: 'Vorschläge' })).toBeNull();
    await user.type(field(), '2 sk');
    // „Milch“ (Lebensmittel) steht schon offen auf der Liste und wird nicht vorgeschlagen.
    const list = await screen.findByRole('list', { name: 'Vorschläge' });
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Skyr natur']);
    await user.click(within(list).getByRole('button', { name: 'Skyr natur hinzufügen' }));
    await waitFor(() => {
      expect(rows()).toEqual(['milch', 'Skyr natur2 Stück']);
    });
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
    expect(screen.queryByRole('list', { name: 'Vorschläge' })).toBeNull();
    await user.type(field(), 'Etwas ganz Neues{Enter}');
    await waitFor(() => {
      expect(rows()).toEqual(['milch', 'Skyr natur2 Stück', 'Etwas ganz Neues']);
    });
  });
});
