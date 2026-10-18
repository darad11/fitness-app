// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { addDays, dayKey, localTimeZone } from '@/shared/lib/time';
import { createTestRuntime } from '@/shared/testing/db';
import { listHabitLogs, listHabits } from '../data/habitRepository';
import { habitsRoutes } from '../routes';
import { addHabit, setHabitDone } from '../service/habitService';
import { TasksCard } from './TasksCard';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

const today = () => dayKey(new Date(), localTimeZone());
const CARD_ROUTE = [{ path: '/heute', Component: TasksCard }];

function renderRoutes(routes: typeof habitsRoutes, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  return router;
}

describe('Tagesaufgaben verwalten (AH-03, AH-04, D-253)', () => {
  it('legt Aufgaben an, benennt um, ordnet und beendet mit Rückgängig', async () => {
    const user = userEvent.setup();
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    await screen.findByRole('heading', { level: 1, name: 'Tagesaufgaben' });
    expect(await screen.findByText('Noch keine Aufgabe. Leg oben eine an.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Aufgabe anlegen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gib der Aufgabe einen Namen.');
    await user.type(screen.getByLabelText('Name der Aufgabe'), '30 min Cardio{Enter}');
    await waitFor(() => {
      expect(screen.getByLabelText('Name der Aufgabe')).toHaveValue('');
    });
    await user.type(screen.getByLabelText('Name der Aufgabe'), 'Wasser{Enter}');
    await waitFor(async () => {
      expect((await listHabits(rt.db)).map((h) => h.name)).toEqual(['30 min Cardio', 'Wasser']);
    });
    const list = screen.getByRole('region', { name: 'Heute' });
    await waitFor(() => {
      expect(within(list).getAllByRole('checkbox')).toHaveLength(2);
    });

    // Umbenennen
    await user.click(within(list).getAllByRole('button', { name: 'Umbenennen' })[1]!);
    const field = within(list).getByLabelText('Name der Aufgabe');
    await user.clear(field);
    await user.type(field, '2 l Wasser{Enter}');
    expect(await within(list).findByText('2 l Wasser')).toBeVisible();

    // Ordnen: zweite nach oben; die erste ist oben gesperrt.
    expect(within(list).getByRole('button', { name: 'Nach oben, 30 min Cardio' })).toBeDisabled();
    await user.click(within(list).getByRole('button', { name: 'Nach oben, 2 l Wasser' }));
    await waitFor(() => {
      expect(
        within(list)
          .getAllByRole('checkbox')
          .map((c) => c.closest('label')?.textContent),
      ).toEqual(['2 l Wasser', '30 min Cardio']);
    });

    // Beenden mit Rückgängig
    await user.click(within(list).getByRole('button', { name: 'Beenden, 30 min Cardio' }));
    expect(await screen.findByText('„30 min Cardio“ beendet')).toBeVisible();
    await waitFor(() => {
      expect(within(list).getAllByRole('checkbox')).toHaveLength(1);
    });
    expect(screen.getByRole('region', { name: 'Beendete Aufgaben' })).toHaveTextContent(
      '30 min Cardio',
    );
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(within(list).getAllByRole('checkbox')).toHaveLength(2);
    });
  });

  it('hakt ab, zeigt Serie und Übersicht', async () => {
    const user = userEvent.setup();
    const a = await addHabit(rt, 'A', { now: () => new Date(Date.now() - 3 * 86_400_000) });
    await setHabitDone(rt, a.id, addDays(today(), -1), true);
    await setHabitDone(rt, a.id, addDays(today(), -2), true);
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    await screen.findByRole('heading', { level: 1, name: 'Tagesaufgaben' });
    const tiles = await screen.findAllByRole('definition');
    expect(tiles[0]).toHaveTextContent('2 Tage');
    expect(screen.getByText(/Heute noch offen/)).toBeVisible();
    expect(tiles[1]).toHaveTextContent('0 / 1');
    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    await waitFor(() => {
      expect(screen.getAllByRole('definition')[0]).toHaveTextContent('3 Tage');
    });
    expect(screen.getByText('Alles erledigt')).toBeVisible();
    const overview = screen.getByRole('list', { name: /Letzte 14 Tage/ });
    const items = within(overview).getAllByRole('listitem');
    expect(items).toHaveLength(14);
    expect(items[13]).toHaveClass('bg-success-soft');
    expect(items[10]).not.toHaveClass('bg-success-soft');
    expect((await listHabitLogs(rt.db, today()))[0]).toMatchObject({ habitId: a.id, done: true });
  });
});

describe('Karte „Tagesaufgaben“ auf „Heute“', () => {
  it('zeigt den Leerzustand mit Weg zur Verwaltung', async () => {
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByText(/Leg dir eigene Aufgaben/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Aufgabe anlegen' })).toHaveAttribute(
      'href',
      '/heute/aufgaben',
    );
    expect(screen.getByRole('link', { name: 'Verwalten' })).toHaveAttribute(
      'href',
      '/heute/aufgaben',
    );
  });

  it('hakt Aufgaben ab und zeigt Serie und Fortschritt', async () => {
    const user = userEvent.setup();
    await addHabit(rt, 'Wasser');
    await addHabit(rt, 'Dehnen');
    renderRoutes(CARD_ROUTE, '/heute');
    await user.click(await screen.findByRole('checkbox', { name: 'Wasser' }));
    expect(await screen.findByText(/Keine Serie · 1 von 2 erledigt/)).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Dehnen' }));
    expect(await screen.findByText(/Serie: 1 Tag · Alles erledigt/)).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Dehnen' }));
    expect(await screen.findByText(/Keine Serie · 1 von 2 erledigt/)).toBeVisible();
  });
});
