// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { addDays, dayKey, isoWeekday, localTimeZone } from '@/shared/lib/time';
import { createTestRuntime } from '@/shared/testing/db';
import { habitsRoutes } from '../routes';
import { addHabit, setHabitDone } from '../service/habitService';

// Recharts misst im Browser; in jsdom ohne Größe genügt ein leerer Platzhalter.
vi.mock('./ProgressChart', () => ({ ProgressChart: () => <div data-testid="verlauf" /> }));

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

const today = () => dayKey(new Date(), localTimeZone());
const daysAgo = (n: number) => ({ now: () => new Date(Date.now() - n * 86_400_000) });

function renderAt(path: string) {
  const router = createMemoryRouter(habitsRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
}

/** Wasser seit 10 Tagen, an 8 Tagen erledigt, an einem Tag kein Eintrag; Lesen seit 3 Tagen. */
async function seed() {
  const water = await addHabit(rt, 'Wasser', daysAgo(10));
  const read = await addHabit(rt, 'Lesen', daysAgo(3));
  for (let i = 10; i >= 1; i--) {
    if (i === 6) continue; // kein Eintrag
    await setHabitDone(rt, water.id, addDays(today(), -i), i !== 4);
  }
  await setHabitDone(rt, read.id, addDays(today(), -1), true);
  await setHabitDone(rt, water.id, today(), true);
  return { water, read };
}

describe('Fortschritt der Tagesaufgaben (D-284)', () => {
  it('zeigt Kennzahlen, Gesamtübersicht und je Aufgabe, ohne Rückwirkung für neue Aufgaben', async () => {
    const user = userEvent.setup();
    await seed();
    renderAt('/heute/aufgaben');
    const stats = await screen.findByRole('region', { name: 'Fortschritt' });
    const tiles = await within(stats).findAllByRole('definition');
    // Heute: Wasser erledigt, Lesen offen.
    expect(tiles[0]).toHaveTextContent('1 / 2');
    // Fällig mit Daten (ohne heute): Wasser 9 Tage (8 erledigt), Lesen 3 Tage (1 erledigt) → 9/12.
    expect(tiles[1]).toHaveTextContent('75 %');
    // Wochenbild statt Serie (D-318); der Wert hängt vom Wochentag des Testlaufs ab.
    expect(within(stats).getAllByRole('term')[2]).toHaveTextContent('Diese Woche');
    expect(tiles[2]).toHaveTextContent(/^(\d+ von \d+|–)/);
    expect(tiles[3]).toHaveTextContent('2');
    expect(screen.queryByText(/Serie/)).toBeNull();
    expect(within(stats).getByText(/An 1 Tag gab es keinen Eintrag/)).toBeVisible();

    const perTask = within(stats).getByRole('region', { name: 'Je Aufgabe' });
    const table = within(perTask).getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3); // Kopf + 2 Aufgaben
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Wasser', 'Lesen']);
    // Lesen ist vor dem Anlegen nicht fällig, nicht verpasst.
    const lesen = within(table).getAllByRole('row')[2]!;
    expect(within(lesen).getAllByText(/nicht fällig/).length).toBeGreaterThan(0);
    expect(within(perTask).getByText(/an 1 von 3 fälligen Tagen/)).toBeVisible();
    expect(within(perTask).getByText(/an 8 von 9 fälligen Tagen/)).toBeVisible();

    // Sortieren: niedrigste Quote zuerst.
    await user.selectOptions(
      within(perTask).getByLabelText('Sortieren'),
      'Niedrigste Quote zuerst',
    );
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Lesen', 'Wasser']);

    // Zeitraum 7 Tage: -6 ohne Eintrag, -5 bis -1 fällig, -4 offen → 4 von 5.
    await user.click(within(stats).getByRole('radio', { name: '7' }));
    expect(within(perTask).getByText(/an 4 von 5 fälligen Tagen/)).toBeVisible();
  });

  it('öffnet die Auswertung einer Aufgabe mit Wochenbild und Kalender', async () => {
    const user = userEvent.setup();
    await seed();
    renderAt('/heute/aufgaben');
    await user.click(await screen.findByRole('link', { name: 'Wasser: Auswertung öffnen' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Wasser' })).toBeVisible();
    const tiles = screen.getAllByRole('definition');
    expect(tiles[0]).toHaveTextContent('89 %');
    expect(tiles[1]).toHaveTextContent('8 / 9');
    // Diese Woche ab Montag: -4 offen, -6 ohne Eintrag (zählt nicht), sonst erledigt; heute erledigt.
    const back = Array.from({ length: isoWeekday(today()) }, (_, i) => i);
    const due = back.filter((i) => i !== 6).length;
    const done = back.filter((i) => i !== 6 && i !== 4).length;
    expect(tiles[2]).toHaveTextContent(`${String(done)} von ${String(due)}`);
    expect(screen.queryByText(/Serie/)).toBeNull();
    expect(screen.getByText(/Kein Vergleich/)).toBeVisible();
    const calendar = screen.getByRole('list', { name: /Kalender/ });
    expect(
      within(calendar)
        .getAllByRole('listitem')
        .filter((li) => li.title).length,
    ).toBe(11);
    expect(screen.getByText(/mindestens drei fällige Tage je Wochentag/)).toBeVisible();
  });

  it('ohne Aufgaben ein Hinweis statt Zahlen', async () => {
    renderAt('/heute/aufgaben');
    expect(await screen.findByText(/Sobald du Aufgaben abhakst/)).toBeVisible();
  });
});
