// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listCompletedSessions } from '../data/sessionRepository';
import { trainingRoutes } from '../routes';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

function renderAt(path: string) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  return router;
}

describe('Nachtragen (S-10, AK-TRN-23)', () => {
  it('trägt eine Aktivität ein und öffnet das Detail im Verlauf', async () => {
    const user = userEvent.setup();
    const router = renderAt('/training/nachtragen');
    await screen.findByRole('heading', { level: 1, name: 'Nachtragen' });
    await user.click(screen.getByRole('radio', { name: 'Aktivität' }));
    await user.selectOptions(screen.getByLabelText('Art der Aktivität'), 'cycle');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Dauer als ganze Minuten');
    await user.type(screen.getByLabelText('Dauer in Minuten'), '45');
    await user.type(screen.getByLabelText('Distanz in km (optional)'), '18,5');
    await user.type(screen.getByLabelText('Notiz (optional)'), 'Runde am Fluss');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/training\/verlauf\/[0-9a-f-]+$/);
    });
    const sessions = await listCompletedSessions(rt.db);
    expect(sessions[0]).toMatchObject({
      kind: 'activity',
      title: 'Radfahren',
      activity: { type: 'cycle', durationSec: 2700, distanceM: 18_500 },
      notes: 'Runde am Fluss',
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Radfahren' })).toBeVisible();
    expect(screen.getByText('Aktivität', { selector: 'p' })).toBeVisible();
    expect(screen.getByText(/Nachgetragen/)).toBeVisible();
    expect(screen.getAllByRole('definition')[1]).toHaveTextContent('18,5 km');
  });

  it('trägt ein Krafttraining mit Übung und Sätzen ein', async () => {
    const user = userEvent.setup();
    const router = renderAt('/training/nachtragen');
    await screen.findByRole('heading', { level: 1, name: 'Nachtragen' });
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Übung hinzufügen' }));
    const picker = await screen.findByRole('dialog', { name: 'Übung auswählen' });
    await user.type(within(picker).getByLabelText('Übungen suchen'), 'beinpresse');
    await user.click(
      within(picker)
        .getAllByRole('button')
        .find((b) => b.querySelector('span')?.textContent === 'Beinpresse')!,
    );
    const card = await screen.findByRole('region', { name: 'Beinpresse' });
    // Drei Arbeitssätze vorbelegt; einen entfernen, einen Aufwärmsatz davor.
    expect(within(card).getAllByRole('listitem')).toHaveLength(3);
    await user.click(
      within(card).getByRole('button', { name: 'Satz entfernen, Beinpresse, Arbeitssatz 3' }),
    );
    await user.click(within(card).getByRole('button', { name: 'Aufwärmsatz hinzufügen' }));
    await user.type(within(card).getByLabelText('Gewicht in kg, Beinpresse, Aufwärmsatz 1'), '60');
    await user.type(within(card).getByLabelText('Wiederholungen, Beinpresse, Aufwärmsatz 1'), '10');
    for (const n of [1, 2]) {
      await user.type(
        within(card).getByLabelText(`Gewicht in kg, Beinpresse, Arbeitssatz ${String(n)}`),
        '120',
      );
      await user.type(
        within(card).getByLabelText(`Wiederholungen, Beinpresse, Arbeitssatz ${String(n)}`),
        '10',
      );
    }
    await user.type(screen.getByLabelText('Titel'), 'Beine kurz');
    await user.type(screen.getByLabelText('Dauer in Minuten'), '30');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/training\/verlauf\/[0-9a-f-]+$/);
    });
    const session = (await listCompletedSessions(rt.db))[0]!;
    expect(session).toMatchObject({
      kind: 'strength',
      source: 'manual',
      title: 'Beine kurz',
      durationSec: 1800,
    });
    expect(session.exercises[0]!.sets.map((s) => [s.type, s.actual])).toEqual([
      ['warmup', { weightKg: 60, reps: 10 }],
      ['working', { weightKg: 120, reps: 10 }],
      ['working', { weightKg: 120, reps: 10 }],
    ]);
    expect(await rt.db.exerciseHistory.count()).toBe(1);
    expect(await screen.findByRole('heading', { level: 1, name: 'Beine kurz' })).toBeVisible();
    expect(screen.getAllByRole('definition')[3]).toHaveTextContent('2.400 kg');
  });
});
