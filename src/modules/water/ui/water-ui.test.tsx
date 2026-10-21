// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { addDays, dayKey, localTimeZone } from '@/shared/lib/time';
import { createTestRuntime } from '@/shared/testing/db';
import { listWaterEntries } from '../data/waterRepository';
import { waterRoutes } from '../routes';
import { addWater } from '../service/waterService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

function renderPage(path = '/ernaehrung/wasser') {
  const router = createMemoryRouter(waterRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
}

const card = () => screen.getByRole('region', { name: 'Heute' });
const amountText = () => within(card()).getByRole('progressbar').getAttribute('aria-label');

describe('Wasser (D-289)', () => {
  it('Schnellmenge, eigene Menge, ungültige Eingabe, letzten Eintrag entfernen und zurückholen', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Noch 2 l bis zum Tagesziel.')).toBeVisible();
    await user.click(within(card()).getByRole('button', { name: '250 ml hinzufügen' }));
    await waitFor(() => {
      expect(amountText()).toBe('250 ml von 2 l getrunken');
    });
    expect(screen.getByText('Noch 1,75 l bis zum Tagesziel.')).toBeVisible();

    await user.click(within(card()).getByRole('button', { name: 'Eigene Menge' }));
    await user.type(within(card()).getByLabelText('Menge'), '-5{Enter}');
    expect(within(card()).getByRole('alert')).toHaveTextContent('zwischen 1 ml und 5 l');
    await user.clear(within(card()).getByLabelText('Menge'));
    await user.type(within(card()).getByLabelText('Menge'), '0,5 l{Enter}');
    await waitFor(() => {
      expect(amountText()).toBe('750 ml von 2 l getrunken');
    });

    await user.click(
      within(card()).getByRole('button', { name: 'Letzten Eintrag entfernen (500 ml)' }),
    );
    await waitFor(() => {
      expect(amountText()).toBe('250 ml von 2 l getrunken');
    });
    expect(screen.getByText('500 ml entfernt')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(amountText()).toBe('750 ml von 2 l getrunken');
    });
  });

  it('Ziel erreicht und darüber: weiter eintragen möglich', async () => {
    const user = userEvent.setup();
    renderPage();
    const add = async (name: string) => {
      await user.click(await within(card()).findByRole('button', { name }));
    };
    await screen.findByText('Noch 2 l bis zum Tagesziel.');
    for (const name of ['750 ml hinzufügen', '750 ml hinzufügen', '500 ml hinzufügen']) {
      await add(name);
    }
    expect(await screen.findByText('Tagesziel erreicht.')).toBeVisible();
    await add('250 ml hinzufügen');
    expect(await screen.findByText('Tagesziel erreicht, 250 ml darüber.')).toBeVisible();
    expect(amountText()).toBe('2,25 l von 2 l getrunken');
  });

  it('Einträge bearbeiten und löschen, Ziel ändern, eigene Schnellmengen', async () => {
    const user = userEvent.setup();
    await addWater(rt, 250);
    await addWater(rt, 500);
    renderPage();
    const entries = await screen.findByRole('region', { name: 'Einträge' });
    await user.click(within(entries).getByRole('button', { name: '250 ml bearbeiten' }));
    const field = within(entries).getByRole('textbox');
    await user.clear(field);
    await user.type(field, '300{Enter}');
    await waitFor(() => {
      expect(amountText()).toBe('800 ml von 2 l getrunken');
    });
    await user.click(within(entries).getByRole('button', { name: '500 ml bearbeiten' }));
    await user.click(within(entries).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => {
      expect(amountText()).toBe('300 ml von 2 l getrunken');
    });
    expect((await listWaterEntries(rt.db)).map((e) => e.amountMl)).toEqual([300]);

    const goal = screen.getByRole('region', { name: 'Tagesziel' });
    expect(within(goal).getByText('Noch kein eigenes Ziel; bis dahin gilt 2 l.')).toBeVisible();
    await user.type(within(goal).getByLabelText('Ziel in ml'), '50{Enter}');
    expect(within(goal).getByRole('alert')).toHaveTextContent('zwischen 250 ml und 8.000 ml');
    await user.clear(within(goal).getByLabelText('Ziel in ml'));
    await user.type(within(goal).getByLabelText('Ziel in ml'), '2.500{Enter}');
    expect(await within(goal).findByText('Dein Ziel: 2,5 l pro Tag.')).toBeVisible();
    await waitFor(() => {
      expect(amountText()).toBe('300 ml von 2,5 l getrunken');
    });

    const quick = screen.getByRole('region', { name: 'Schnellmengen' });
    const first = within(quick).getByLabelText('Schnellmenge 1 in ml');
    await user.clear(first);
    await user.type(first, '330');
    await user.click(within(quick).getByRole('button', { name: 'Schnellmengen speichern' }));
    expect(await within(card()).findByRole('button', { name: '330 ml hinzufügen' })).toBeVisible();
    await user.click(within(quick).getByRole('button', { name: 'Standard' }));
    expect(await within(card()).findByRole('button', { name: '150 ml hinzufügen' })).toBeVisible();
  });

  it('früherer Tag: Datum als Titel, Nachtragen zählt zu diesem Tag, Verlauf ohne erfundene Tage', async () => {
    const user = userEvent.setup();
    const today = dayKey(new Date(), localTimeZone());
    const yesterday = addDays(today, -1);
    await addWater(rt, 1000, { day: yesterday });
    renderPage(`/ernaehrung/wasser?tag=${yesterday}`);
    const entries = await screen.findByRole('region', { name: 'Einträge' });
    expect(within(entries).getByText(/^nachgetragen am/)).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Heute' })).toBeNull();
    const verlauf = screen.getByRole('region', { name: 'Verlauf' });
    expect(within(verlauf).getByText('Ø pro Tag').nextElementSibling).toHaveTextContent('1 l');
    expect(within(verlauf).getByText(/5 Tage ohne Eintrag zählen nicht mit/)).toBeVisible();
    await user.click(within(verlauf).getByText('30 Tage'));
    expect(within(verlauf).getByText(/28 Tage ohne Eintrag/)).toBeVisible();
    expect(await rt.db.foodLog.count()).toBe(0);
  });
});
