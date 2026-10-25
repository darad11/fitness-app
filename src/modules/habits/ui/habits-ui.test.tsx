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
import {
  addHabit,
  setHabitAutoDone,
  setHabitDone,
  setHabitWeekdays,
} from '../service/habitService';
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

/** Namen der Zeilen in der Reihenfolge der Liste (der Link heißt „… bearbeiten“). */
/** Text eines Links wie für Screenreader, ohne ausgeblendete Teile (Name aus dem Inhalt, D-377). */
function accessibleText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => {
    node.remove();
  });
  return copy.textContent.replace(/\s+/g, ' ').trim();
}

const names = (region: HTMLElement) =>
  within(region)
    .getAllByRole('link', { name: / bearbeiten$/ })
    .map((link) => accessibleText(link).replace(/ bearbeiten$/, ''));

const myTasks = () => screen.findByRole('region', { name: 'Meine Aufgaben' });

/** Detailansicht über die Zeile öffnen; wartet auf die Einstellungen. */
async function openDetails(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(
    await within(await myTasks()).findByRole('link', { name: `${name} bearbeiten` }),
  );
  return screen.findByRole('region', { name: 'Einstellungen' });
}

describe('Tagesaufgaben verwalten (AH-03, D-283; Detailansicht D-335)', () => {
  it('fügt hinzu, hakt ab, benennt in der Detailansicht um, ordnet, pausiert und nimmt wieder auf', async () => {
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
    let list = await myTasks();
    await waitFor(() => {
      expect(names(list)).toEqual(['30 min Cardio', 'Wasser']);
    });
    // Abhaken geht auch hier, links in der Zeile (V1).
    await user.click(within(list).getByRole('checkbox', { name: 'Wasser abhaken' }));
    await waitFor(async () => {
      expect((await listHabitLogs(rt.db, today())).filter((log) => log.done)).toHaveLength(1);
    });

    // Umbenennen: die Zeile öffnet die Detailansicht mit den Einstellungen.
    const settings = await openDetails(user, 'Wasser');
    const field = within(settings).getByLabelText('Name der Aufgabe');
    expect(field).toHaveValue('Wasser');
    await user.clear(field);
    await user.type(field, '2 l Wasser');
    await user.click(within(settings).getByRole('button', { name: 'Speichern' }));
    expect(await within(settings).findByText('Gespeichert.')).toBeVisible();
    expect(await screen.findByRole('heading', { level: 1, name: '2 l Wasser' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Tagesaufgaben' }));
    list = await myTasks();
    await waitFor(() => {
      expect(names(list)).toEqual(['30 min Cardio', '2 l Wasser']);
    });

    // Ordnen über „Reihenfolge ändern“: die erste ist oben gesperrt.
    await user.click(within(list).getByRole('button', { name: 'Reihenfolge ändern' }));
    expect(within(list).getByRole('button', { name: 'Nach oben, 30 min Cardio' })).toBeDisabled();
    await user.click(within(list).getByRole('button', { name: 'Nach oben, 2 l Wasser' }));
    await user.click(within(list).getByRole('button', { name: 'Fertig' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser', '30 min Cardio']);
    });

    // Pausieren in der Detailansicht, zurück mit „Rückgängig“.
    await user.click(
      within(await openDetails(user, '30 min Cardio')).getByRole('button', { name: 'Pausieren' }),
    );
    expect(await screen.findByText('„30 min Cardio“ pausiert')).toBeVisible();
    list = await myTasks();
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser']);
    });
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['2 l Wasser', '30 min Cardio']);
    });

    // Pausierte liegen hinter dem Symbol oben rechts.
    await user.click(
      within(await openDetails(user, '30 min Cardio')).getByRole('button', { name: 'Pausieren' }),
    );
    list = await myTasks();
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

  it('löscht in der Detailansicht und aus „Pausiert“, mit Rückgängig', async () => {
    const user = userEvent.setup();
    await addHabit(rt, 'Lesen');
    const b = await addHabit(rt, 'Dehnen');
    renderRoutes(habitsRoutes, '/heute/aufgaben');
    const settings = await openDetails(user, 'Lesen');
    expect(within(settings).getByText(/Vergangene Tage bleiben/)).toBeVisible();
    await user.click(within(settings).getByRole('button', { name: 'Löschen' }));
    expect(await screen.findByText('„Lesen“ gelöscht')).toBeVisible();
    const list = await myTasks();
    await waitFor(() => {
      expect(names(list)).toEqual(['Dehnen']);
    });
    await user.click(within(list).getByRole('button', { name: /Pausierte Aufgaben/ }));
    expect(screen.getByText('Keine pausierte Aufgabe.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => {
      expect(names(list)).toEqual(['Lesen', 'Dehnen']);
    });

    await user.click(
      within(await openDetails(user, 'Dehnen')).getByRole('button', { name: 'Pausieren' }),
    );
    await user.click(
      await within(await myTasks()).findByRole('button', { name: /Pausierte Aufgaben/ }),
    );
    const pausedBox = await screen.findByRole('region', { name: 'Pausiert' });
    await user.click(await within(pausedBox).findByRole('button', { name: 'Löschen, Dehnen' }));
    await waitFor(() => {
      expect(within(pausedBox).getByText('Keine pausierte Aufgabe.')).toBeVisible();
    });
    const stored = (await listHabits(rt.db)).find((habit) => habit.id === b.id);
    expect(stored?.removedAt).toBeDefined();
  });
});

describe('Zeile einer Aufgabe (F6, D-335)', () => {
  it('Abhakfeld hakt nur ab, die Zeile öffnet die Details; Rhythmus darunter, erledigt gedämpft', async () => {
    const user = userEvent.setup();
    const weekday = isoWeekday(today());
    const later = (weekday % 7) + 1;
    const walk = await addHabit(rt, 'Spaziergang');
    const cardio = await addHabit(rt, '30 min Cardio');
    const water = await addHabit(rt, '2 l Wasser');
    await setHabitWeekdays(
      rt,
      cardio.id,
      [weekday, later].sort((x, y) => x - y),
    );
    await setHabitAutoDone(rt, water.id, 'water');
    const router = renderRoutes([...CARD_ROUTE, ...habitsRoutes], '/heute');
    const box = await screen.findByRole('checkbox', { name: 'Spaziergang abhaken' });
    const row = screen.getByRole('link', { name: 'Spaziergang bearbeiten' });
    // Rhythmus: „Täglich“, „Mo · Di“ usw., Regel dazu; als Beschreibung des Links.
    expect(row).toHaveAccessibleDescription('Täglich');
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    expect(
      screen.getByRole('link', { name: '30 min Cardio bearbeiten' }),
    ).toHaveAccessibleDescription(
      [weekday, later]
        .sort((x, y) => x - y)
        .map((day) => days[day - 1])
        .join(' · '),
    );
    expect(screen.getByRole('link', { name: '2 l Wasser bearbeiten' })).toHaveAccessibleDescription(
      'Täglich · mit Wasserziel abhaken',
    );
    // Abhaken bleibt auf „Heute“ und öffnet nichts.
    await user.click(box);
    await waitFor(() => {
      expect(box).toBeChecked();
    });
    expect(router.state.location.pathname).toBe('/heute');
    const title = within(row).getByText('Spaziergang');
    expect(title).toHaveClass('text-muted');
    expect(title.className).not.toMatch(/line-through/);
    // Die Zeile öffnet die Detailansicht; „Zurück“ führt nach „Heute“.
    await user.click(row);
    expect(await screen.findByRole('heading', { level: 1, name: 'Spaziergang' })).toBeVisible();
    expect(router.state.location.pathname).toBe(`/heute/aufgaben/${walk.id}`);
    expect(screen.getByRole('region', { name: 'Einstellungen' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Heute' }));
    expect(router.state.location.pathname).toBe('/heute');
  });

  it('mit der Tastatur: Tab zum Abhakfeld, Leertaste hakt ab; Tab zur Zeile, Enter öffnet', async () => {
    const user = userEvent.setup();
    await addHabit(rt, 'Lesen');
    const router = renderRoutes([...CARD_ROUTE, ...habitsRoutes], '/heute');
    const box = await screen.findByRole('checkbox', { name: 'Lesen abhaken' });
    const row = screen.getByRole('link', { name: 'Lesen bearbeiten' });
    box.focus();
    await user.keyboard(' ');
    await waitFor(() => {
      expect(box).toBeChecked();
    });
    expect(router.state.location.pathname).toBe('/heute');
    await user.tab();
    expect(row).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Lesen' })).toBeVisible();
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
    await user.click(await screen.findByRole('checkbox', { name: 'Wasser abhaken' }));
    expect(await screen.findByText('1 von 3 erledigt')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Heute erledigt' })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Dehnen abhaken' }));
    await user.click(screen.getByRole('checkbox', { name: 'Lesen abhaken' }));
    expect(await screen.findByText('Alles erledigt')).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Lesen abhaken' }));
    expect(await screen.findByText('2 von 3 erledigt')).toBeVisible();
    expect(screen.queryByText(/Serie/)).toBeNull();
    expect((await listHabitLogs(rt.db, today())).filter((log) => log.done)).toHaveLength(2);
  });

  it('neuer Tag: gestern Abgehaktes ist heute offen, gestern bleibt gespeichert', async () => {
    const a = await addHabit(rt, 'Wasser', { now: () => new Date(Date.now() - 2 * 86_400_000) });
    await setHabitDone(rt, a.id, addDays(today(), -1), true);
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser abhaken' })).not.toBeChecked();
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
    expect(await screen.findByRole('checkbox', { name: 'Wasser abhaken' })).toBeChecked();
    cleanup();
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Wasser abhaken' })).toBeChecked();
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
    expect(await screen.findByRole('checkbox', { name: 'Wasser abhaken' })).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: 'Training abhaken' })).toBeNull();
    expect(screen.getByText('0 von 1 erledigt')).toBeVisible();
    cleanup();

    renderRoutes(habitsRoutes, '/heute/aufgaben');
    const list = await screen.findByRole('region', { name: 'Meine Aufgaben' });
    const row = await within(list).findByRole('link', { name: 'Training bearbeiten' });
    const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    expect(row).toHaveTextContent(names[other - 1]!);
    // Heute nicht fällig: das Abhakfeld ist gesperrt.
    expect(
      within(list).getByRole('checkbox', { name: 'Training abhaken, heute nicht fällig' }),
    ).toBeDisabled();
    await user.click(row);
    const settings = await screen.findByRole('region', { name: 'Einstellungen' });
    const todayToggle = within(settings).getByRole('button', {
      name: `${names[weekday - 1]} fällig`,
    });
    expect(todayToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(todayToggle);
    await user.click(within(settings).getByRole('switch', { name: 'Mit Training abhaken' }));
    await user.click(within(settings).getByRole('button', { name: 'Speichern' }));
    await waitFor(async () => {
      const saved = (await listHabits(rt.db)).find((habit) => habit.id === a.id);
      expect(saved?.schedule?.at(-1)?.weekdays).toEqual([weekday, other].sort((x, y) => x - y));
      expect(saved?.autoDone).toBe('training');
    });
    cleanup();
    renderRoutes(CARD_ROUTE, '/heute');
    expect(await screen.findByRole('checkbox', { name: 'Training abhaken' })).toBeVisible();
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
    const settings = await openDetails(user, '2 l Wasser');
    const training = within(settings).getByRole('switch', { name: 'Mit Training abhaken' });
    const water = within(settings).getByRole('switch', { name: 'Mit Wasserziel abhaken' });
    await user.click(training);
    expect(training).toBeChecked();
    await user.click(water);
    expect(water).toBeChecked();
    expect(training).not.toBeChecked();
    await user.click(within(settings).getByRole('button', { name: 'Speichern' }));
    await waitFor(async () => {
      expect((await listHabits(rt.db)).find((habit) => habit.id === a.id)?.autoDone).toBe('water');
    });
    await user.click(screen.getByRole('link', { name: 'Tagesaufgaben' }));
    expect(
      await within(await myTasks()).findByRole('link', { name: '2 l Wasser bearbeiten' }),
    ).toHaveAccessibleDescription('Täglich · mit Wasserziel abhaken');
    // Noch nichts getrunken: nicht abgehakt.
    expect(await listHabitLogs(rt.db)).toEqual([]);
  });
});
