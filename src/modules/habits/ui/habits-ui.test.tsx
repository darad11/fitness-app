// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { addDays, dayKey, isoWeekday, localTimeZone } from '@/shared/lib/time';
import { createTestRuntime } from '@/shared/testing/db';
import { listHabitLogs, listHabits } from '../data/habitRepository';
import { habitsRoutes } from '../routes';
import { addHabit, setHabitDone, setHabitWeekdays } from '../service/habitService';
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

const names = (region: HTMLElement) =>
  within(region)
    .getAllByRole('button', { name: / bearbeiten$/ })
    .map((button) => button.textContent);

describe('Tagesaufgaben verwalten (AH-03, D-283)', () => {
  it('fügt hinzu, benennt um, ordnet, pausiert und nimmt wieder auf', async () => {
    const user = userEvent.setup();
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    await screen.findByRole('heading', { level: 1, name: 'Tagesaufgaben' });
    expect(await screen.findByText('Noch keine Aufgabe. Leg oben eine an.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Aufgabe hinzufügen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gib der Aufgabe einen Namen.');
    await user.type(screen.getByLabelText('Name der Aufgabe'), '30 min Cardio{Enter}');
    await waitFor(() => {
      expect(screen.getByLabelText('Name der Aufgabe')).toHaveValue('');
    });
    await user.type(screen.getByLabelText('Name der Aufgabe'), 'Wasser{Enter}');
    const list = screen.getByRole('region', { name: 'Meine Aufgaben' });
    await waitFor(() => {
      expect(names(list)).toEqual(['30 min Cardio', 'Wasser']);
    });
    // In der Verwaltung wird nicht abgehakt.
    expect(within(list).queryAllByRole('checkbox')).toHaveLength(0);

    // Umbenennen: Tipp auf die Aufgabe öffnet sie.
    await user.click(within(list).getByRole('button', { name: 'Wasser bearbeiten' }));
    const field = within(list).getByDisplayValue('Wasser');
    await user.clear(field);
    await user.type(field, '2 l Wasser{Enter}');
    await waitFor(() => {
      expect(names(list)).toEqual(['30 min Cardio', '2 l Wasser']);
    });

    // Ordnen: zweite nach oben; die erste ist oben gesperrt.
    expect(within(list).getByRole('button', { name: 'Nach oben, 30 min Cardio' })).toBeDisabled();
    await user.click(within(list).getByRole('button', { name: 'Nach oben, 2 l Wasser' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser', '30 min Cardio']);
    });

    // Pausieren mit Rückgängig
    await user.click(within(list).getByRole('button', { name: '30 min Cardio bearbeiten' }));
    await user.click(within(list).getByRole('button', { name: 'Pausieren' }));
    expect(await screen.findByText('„30 min Cardio“ pausiert')).toBeVisible();
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser']);
    });
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser', '30 min Cardio']);
    });

    // Pausierte liegen hinter dem Symbol oben rechts.
    await user.click(within(list).getByRole('button', { name: '30 min Cardio bearbeiten' }));
    await user.click(within(list).getByRole('button', { name: 'Pausieren' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser']);
    });
    expect(screen.queryByRole('region', { name: 'Pausiert' })).toBeNull();
    const toggle = await within(list).findByRole('button', { name: 'Pausierte Aufgaben (1)' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const pausedBox = screen.getByRole('region', { name: 'Pausiert' });
    await user.click(
      within(pausedBox).getByRole('button', { name: 'Wieder aufnehmen, 30 min Cardio' }),
    );
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser', '30 min Cardio']);
    });
    expect(within(pausedBox).getByText('Keine pausierte Aufgabe.')).toBeVisible();
  });

  it('löscht eine Aufgabe, auch aus „Pausiert“, mit Rückgängig', async () => {
    const user = userEvent.setup();
    await addHabit(rt, 'Lesen');
    const b = await addHabit(rt, 'Dehnen');
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    const list = await screen.findByRole('region', { name: 'Meine Aufgaben' });
    await user.click(await within(list).findByRole('button', { name: 'Lesen bearbeiten' }));
    expect(within(list).getByText(/Vergangene Tage bleiben/)).toBeVisible();
    await user.click(within(list).getByRole('button', { name: 'Löschen' }));
    expect(await screen.findByText('„Lesen“ gelöscht')).toBeVisible();
    await waitFor(() => {
      expect(names(list)).toEqual(['Dehnen']);
    });
    await user.click(within(list).getByRole('button', { name: /Pausierte Aufgaben/ }));
    expect(screen.getByText('Keine pausierte Aufgabe.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['Lesen', 'Dehnen']);
    });

    await user.click(within(list).getByRole('button', { name: 'Dehnen bearbeiten' }));
    await user.click(within(list).getByRole('button', { name: 'Pausieren' }));
    const pausedBox = await screen.findByRole('region', { name: 'Pausiert' });
    await user.click(await within(pausedBox).findByRole('button', { name: 'Löschen, Dehnen' }));
    await waitFor(() => {
      expect(within(pausedBox).getByText('Keine pausierte Aufgabe.')).toBeVisible();
    });
    const stored = (await listHabits(rt.db)).find((habit) => habit.id === b.id);
    expect(stored?.removedAt).toBeDefined();
  });
});

describe('Karte „Tagesaufgaben“ auf „Heute“', () => {
  it('zeigt den Leerzustand mit Weg zur Verwaltung', async () => {
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByText(/Leg dir eigene Aufgaben/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Aufgabe hinzufügen' })).toHaveAttribute(
      'href',
      '/heute/aufgaben',
    );
    expect(screen.getByRole('link', { name: 'Tagesaufgaben verwalten' })).toHaveAttribute(
      'href',
      '/heute/aufgaben',
    );
  });

  it('hakt ab, nimmt zurück und zeigt den Fortschritt ohne Serie', async () => {
    const user = userEvent.setup();
    await addHabit(rt, 'Wasser');
    await addHabit(rt, 'Dehnen');
    await addHabit(rt, 'Lesen');
    renderRoutes(CARD_ROUTE, '/heute');
    await user.click(await screen.findByRole('checkbox', { name: 'Wasser' }));
    expect(await screen.findByText('1 von 3 erledigt')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Heute erledigt' })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Dehnen' }));
    await user.click(screen.getByRole('checkbox', { name: 'Lesen' }));
    expect(await screen.findByText('Alles erledigt')).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Lesen' }));
    expect(await screen.findByText('2 von 3 erledigt')).toBeVisible();
    expect(screen.queryByText(/Serie/)).toBeNull();
    expect((await listHabitLogs(rt.db, today())).filter((log) => log.done)).toHaveLength(2);
  });

  it('neuer Tag: gestern Abgehaktes ist heute offen, gestern bleibt gespeichert', async () => {
    const a = await addHabit(rt, 'Wasser', { now: () => new Date(Date.now() - 2 * 86_400_000) });
    await setHabitDone(rt, a.id, addDays(today(), -1), true);
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser' })).not.toBeChecked();
    expect(screen.getByText('0 von 1 erledigt')).toBeVisible();
    const yesterday = (await listHabitLogs(rt.db)).find(
      (log) => log.dayKey === addDays(today(), -1),
    );
    expect(yesterday).toMatchObject({ habitId: a.id, done: true });
  });

  it('neu laden: Abgehaktes von heute bleibt abgehakt', async () => {
    const a = await addHabit(rt, 'Wasser');
    await setHabitDone(rt, a.id, today(), true);
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser' })).toBeChecked();
    cleanup();
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser' })).toBeChecked();
  });
});

describe('Wochentage (D-285)', () => {
  it('Karte zeigt nur heute fällige Aufgaben; Verwaltung zeigt alle mit Wochentagen', async () => {
    const user = userEvent.setup();
    const weekday = isoWeekday(today());
    const other = (weekday % 7) + 1;
    const a = await addHabit(rt, 'Training');
    await addHabit(rt, 'Wasser');
    await setHabitWeekdays(rt, a.id, [other]);
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser' })).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: 'Training' })).toBeNull();
    expect(screen.getByText('0 von 1 erledigt')).toBeVisible();
    cleanup();

    renderRoutes(habitsRoutes, '/heute/aufgaben');
    const list = await screen.findByRole('region', { name: 'Meine Aufgaben' });
    const row = await within(list).findByRole('button', { name: 'Training bearbeiten' });
    const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    expect(row).toHaveTextContent(names[other - 1]!);
    await user.click(row);
    const todayToggle = within(list).getByRole('button', { name: `${names[weekday - 1]} fällig` });
    expect(todayToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(todayToggle);
    await user.click(within(list).getByRole('switch', { name: 'Mit Training abhaken' }));
    await user.click(within(list).getByRole('button', { name: 'Speichern' }));
    await waitFor(async () => {
      const saved = (await listHabits(rt.db)).find((habit) => habit.id === a.id);
      expect(saved?.schedule?.at(-1)?.weekdays).toEqual([weekday, other].sort((x, y) => x - y));
      expect(saved?.autoDone).toBe('training');
    });
    cleanup();
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Training' })).toBeVisible();
  });

  it('nichts fällig: eigener Hinweis statt Leerzustand', async () => {
    const other = (isoWeekday(today()) % 7) + 1;
    const a = await addHabit(rt, 'Training');
    await setHabitWeekdays(rt, a.id, [other]);
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByText('Heute ist keine Aufgabe fällig.')).toBeVisible();
  });
});

describe('Mit Wasserziel abhaken (D-289)', () => {
  it('höchstens eine Regel: Wasserziel schaltet Training aus und wird gespeichert', async () => {
    const user = userEvent.setup();
    const a = await addHabit(rt, '2 l Wasser');
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    const list = await screen.findByRole('region', { name: 'Meine Aufgaben' });
    await user.click(await within(list).findByRole('button', { name: '2 l Wasser bearbeiten' }));
    const training = within(list).getByRole('switch', { name: 'Mit Training abhaken' });
    const water = within(list).getByRole('switch', { name: 'Mit Wasserziel abhaken' });
    await user.click(training);
    expect(training).toBeChecked();
    await user.click(water);
    expect(water).toBeChecked();
    expect(training).not.toBeChecked();
    await user.click(within(list).getByRole('button', { name: 'Speichern' }));
    await waitFor(async () => {
      expect((await listHabits(rt.db)).find((habit) => habit.id === a.id)?.autoDone).toBe('water');
    });
    expect(
      await within(list).findByRole('button', { name: '2 l Wasser bearbeiten' }),
    ).toHaveTextContent('mit Wasserziel');
    // Noch nichts getrunken: nicht abgehakt.
    expect(await listHabitLogs(rt.db)).toEqual([]);
  });
});
