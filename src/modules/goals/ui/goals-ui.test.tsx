// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadProfile } from '@/modules/settings';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { activeGoal } from '../calc/goals';
import { listGoals } from '../data/goalRepository';
import { goalsRoutes } from '../routes';
import { setGoal } from '../service/goalService';
import { WeeklyGoalCard } from './WeeklyGoalCard';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

function renderRoutes(routes: typeof goalsRoutes, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  return router;
}

describe('Profil und Ziele (S-33, AK-SET-01, AK-SET-05)', () => {
  it('setzt, ändert und entfernt Zielgewicht und Wochenziel mit Historie', async () => {
    const user = userEvent.setup();
    renderRoutes(goalsRoutes, '/mehr/profil');
    await screen.findByRole('heading', { level: 1, name: 'Profil und Ziele' });
    const weight = await screen.findByRole('region', { name: 'Zielgewicht' });
    expect(within(weight).getByText('Kein Zielgewicht gesetzt.')).toBeVisible();
    await user.type(within(weight).getByLabelText('Zielgewicht in kg'), '29');
    await user.click(within(weight).getByRole('button', { name: 'Festlegen' }));
    expect(await within(weight).findByRole('alert')).toHaveTextContent('30 bis 300 kg');
    await user.clear(within(weight).getByLabelText('Zielgewicht in kg'));
    await user.type(within(weight).getByLabelText('Zielgewicht in kg'), '78,0');
    await user.click(within(weight).getByRole('button', { name: 'Festlegen' }));
    expect(await within(weight).findByText('Aktuell: 78,0 kg')).toBeVisible();

    const weekly = screen.getByRole('region', { name: 'Wochenziel' });
    await user.selectOptions(within(weekly).getByLabelText('Trainings pro Woche'), '4');
    await user.click(within(weekly).getByRole('button', { name: 'Festlegen' }));
    expect(await within(weekly).findByText('Aktuell: 4 Trainings pro Woche')).toBeVisible();
    await user.click(within(weekly).getByRole('button', { name: 'Entfernen' }));
    expect(await within(weekly).findByText('Kein Wochenziel gesetzt.')).toBeVisible();

    const history = screen.getByRole('region', { name: 'Verlauf der Ziele' });
    const rows = within(history).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows.some((row) => /Wochenziel: 4 Trainings pro Woche.*bis/.test(row.textContent))).toBe(
      true,
    );
    expect(await listGoals(rt.db)).toHaveLength(2);
  });

  it('belegt das Auswahlfeld mit dem gespeicherten Wochenziel vor und speichert genau den gewählten Wert (F5, D-322)', async () => {
    const user = userEvent.setup();
    await setGoal(rt, 'weekly_sessions', 4);
    renderRoutes(goalsRoutes, '/mehr/profil');
    const weekly = await screen.findByRole('region', { name: 'Wochenziel' });
    const select = within(weekly).getByLabelText<HTMLSelectElement>('Trainings pro Woche');
    expect(within(weekly).getByText('Aktuell: 4 Trainings pro Woche')).toBeVisible();
    expect(select.value).toBe('4');
    for (const value of ['5', '3', '4']) {
      await user.selectOptions(select, value);
      await user.click(within(weekly).getByRole('button', { name: 'Ändern' }));
      expect(
        await within(weekly).findByText(`Aktuell: ${value} Trainings pro Woche`),
      ).toBeVisible();
      expect(select.value).toBe(value);
    }
    expect(activeGoal(await listGoals(rt.db), 'weekly_sessions')?.value).toBe(4);
    // Ohne Wochenziel schlägt das Feld 3 vor.
    await user.click(within(weekly).getByRole('button', { name: 'Entfernen' }));
    expect(await within(weekly).findByText('Kein Wochenziel gesetzt.')).toBeVisible();
    expect(select.value).toBe('3');
  });

  it('speichert den optionalen Anzeigenamen', async () => {
    const user = userEvent.setup();
    renderRoutes(goalsRoutes, '/mehr/profil');
    const field = await screen.findByLabelText('Anzeigename (optional)');
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    await user.type(field, 'Dali');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Gespeichert.');
    expect((await loadProfile(rt.db)).displayName).toBe('Dali');
  });
});

describe('Karte „Wochenziel“ (AK-DSH-05)', () => {
  it('zeigt ohne Ziel den Weg zum Festlegen, mit Ziel Fortschritt und Erreichen', async () => {
    await setGoal(rt, 'weekly_sessions', 2);
    const { rerender } = render(
      <DbProvider runtime={rt}>
        <RouterProvider
          router={createMemoryRouter(
            [
              {
                path: '/',
                Component: () => (
                  <WeeklyGoalCard sessions={[]} target={undefined} today="2026-10-18" />
                ),
              },
            ],
            { initialEntries: ['/'] },
          )}
        />
      </DbProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Wochenziel festlegen' })).toHaveAttribute(
      'href',
      '/mehr/profil',
    );
    rerender(
      <DbProvider runtime={rt}>
        <RouterProvider
          router={createMemoryRouter(
            [
              {
                path: '/',
                Component: () => (
                  <WeeklyGoalCard
                    sessions={[
                      { dayKey: '2026-10-12' },
                      { dayKey: '2026-10-17' },
                      { dayKey: '2026-10-05' },
                    ]}
                    target={2}
                    today="2026-10-18"
                  />
                ),
              },
            ],
            { initialEntries: ['/'] },
          )}
        />
      </DbProvider>,
    );
    expect(await screen.findByText('2 von 2 Trainings diese Woche')).toBeVisible();
    expect(screen.getByText('Wochenziel erreicht')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });
  });
});
