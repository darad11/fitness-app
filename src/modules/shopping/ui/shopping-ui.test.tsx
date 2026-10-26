// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('zeigt unter dem Feld, was gerade dazukam; „Fertig“ schließt die Eingabe', async () => {
    const user = userEvent.setup();
    renderList();
    expect(await screen.findByText(/Die Liste ist leer/)).toBeVisible();
    for (const text of ['Reis 1 kg', 'Äpfel', 'Brot', 'Milch']) {
      await user.type(field(), `${text}{Enter}`);
      await waitFor(() => {
        expect(field()).toHaveValue('');
      });
    }
    // Die letzten drei, neueste zuerst.
    expect((await screen.findByText(/Hinzugefügt:/)).closest('p')).toHaveTextContent(
      'Hinzugefügt: Milch · Brot · Äpfel',
    );
    await user.click(screen.getByRole('button', { name: 'Fertig' }));
    expect(field()).not.toHaveFocus();
    expect(screen.queryByText(/Hinzugefügt:/)).toBeNull();
  });
});

/**
 * Wischen zum Löschen (D-360) mit Zeiger-Ereignissen wie auf dem iPhone. jsdom kennt keine
 * Breiten, deshalb bekommt die Zeile 343 px wie am Handy.
 */
describe('Wischen zum Löschen (D-360)', () => {
  async function listWith(names: readonly string[]) {
    const user = userEvent.setup();
    renderList();
    await screen.findByText(/Die Liste ist leer/);
    for (const name of names) {
      await user.type(field(), `${name}{Enter}`);
      await waitFor(() => {
        expect(field()).toHaveValue('');
      });
    }
    await waitFor(() => {
      expect(rows()).toHaveLength(names.length);
    });
    return user;
  }

  function swipeRow(name: string) {
    const label = screen.getAllByText(name).find((el) => el.closest('[data-swipe-row]'));
    const row = label?.closest<HTMLElement>('[data-swipe-row]');
    if (!row) throw new Error(`Zeile ${name} fehlt`);
    vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 16, y: 200, width: 343, height: 56 }),
    );
    return row;
  }

  /** Wisch über `dx`/`dy` Pixel in zehn Schritten, dann loslassen. */
  function swipe(row: HTMLElement, dx: number, dy = 0) {
    const start = { clientX: 300, clientY: 228 };
    fireEvent.pointerDown(row, { ...start, pointerId: 1, isPrimary: true, button: 0 });
    for (let step = 1; step <= 10; step++) {
      fireEvent.pointerMove(row, {
        pointerId: 1,
        isPrimary: true,
        clientX: start.clientX + (dx * step) / 10,
        clientY: start.clientY + (dy * step) / 10,
      });
    }
    fireEvent.pointerUp(row, {
      pointerId: 1,
      isPrimary: true,
      clientX: start.clientX + dx,
      clientY: start.clientY + dy,
    });
  }

  it('löscht nur den gewischten Artikel und bietet Rückgängig an', async () => {
    const user = await listWith(['Milch', 'Brot', 'Äpfel']);
    swipe(swipeRow('Milch'), -200);
    expect(await screen.findByText('„Milch“ gelöscht')).toBeVisible();
    await waitFor(() => {
      expect(rows()).toEqual(['Brot', 'Äpfel']);
    });
    expect((await listShoppingItems(rt.db)).map((item) => item.name).sort()).toEqual([
      'Brot',
      'Äpfel',
    ]);
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(rows()).toEqual(['Milch', 'Brot', 'Äpfel']);
    });
  });

  it('folgt dem Zeiger auch neben der Zeile, ohne ihn zu fangen (Nachtrag zu D-384)', async () => {
    await listWith(['Milch', 'Brot']);
    const row = swipeRow('Milch');
    const capture = vi.fn();
    row.setPointerCapture = capture;
    const start = { clientX: 300, clientY: 228 };
    fireEvent.pointerDown(row, { ...start, pointerId: 1, isPrimary: true, button: 0 });
    // Bewegung und Loslassen kommen am Fenster an, auch wenn der Zeiger die Zeile verlassen hat.
    for (let step = 1; step <= 10; step++) {
      fireEvent.pointerMove(document.body, {
        pointerId: 1,
        isPrimary: true,
        clientX: start.clientX - 20 * step,
        clientY: start.clientY + 4,
      });
    }
    fireEvent.pointerUp(document.body, {
      pointerId: 1,
      isPrimary: true,
      clientX: start.clientX - 200,
      clientY: start.clientY + 4,
    });
    expect(await screen.findByText('„Milch“ gelöscht')).toBeVisible();
    await waitFor(() => {
      expect(rows()).toEqual(['Brot']);
    });
    expect(capture).not.toHaveBeenCalled();
  });

  it('lässt kurze, schräge, senkrechte und Wische nach rechts ohne Folgen', async () => {
    await listWith(['Milch']);
    const row = swipeRow('Milch');
    swipe(row, -60); // zu kurz
    swipe(row, -150, 90); // schräg
    swipe(row, 0, 150); // senkrecht
    swipe(row, 200); // nach rechts
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(rows()).toEqual(['Milch']);
    expect(screen.queryByText(/gelöscht/)).toBeNull();
    expect(row.style.transform).toBe('');
  });

  it('hakt nach einem Wisch nicht ab, ein Tipp danach schon', async () => {
    const user = await listWith(['Milch']);
    const row = swipeRow('Milch');
    // Der Klick, den der Browser (mit der Maus) nach einer Geste schickt, hakt nicht ab: nach
    // einem zu kurzen waagrechten und nach einem schrägen Wisch.
    swipe(row, -80);
    fireEvent.click(within(row).getByText('Milch'));
    swipe(row, -150, 90);
    fireEvent.click(within(row).getByText('Milch'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect((await listShoppingItems(rt.db)).map((item) => item.doneAt)).toEqual([undefined]);
    expect(screen.getByText('0 von 1 gekauft')).toBeVisible();
    // Ein normaler Tipp danach hakt ab; der Artikel wandert zu „Gekauft“.
    await user.click(screen.getByRole('checkbox', { name: 'Milch' }));
    expect(await screen.findByRole('button', { name: 'Gekauft (1)' })).toBeVisible();
  });

  it('lässt senkrechtes Scrollen dem Browser und behält den Weg über „Bearbeiten“', async () => {
    const user = await listWith(['Milch']);
    const row = swipeRow('Milch');
    expect(row.className).toContain('touch-pan-y');
    // Die Anzeige hinter der Zeile ist für Screenreader ausgeblendet; gelöscht wird dort über
    // „Bearbeiten“ und „Löschen“.
    await user.click(screen.getByRole('button', { name: 'Milch bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(await screen.findByText('„Milch“ gelöscht')).toBeVisible();
  });
});
