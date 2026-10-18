// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCoreExercises } from '@/modules/exercises';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { getSession } from '../../data/sessionRepository';
import { loadSampleTemplate } from '../../data/sampleTemplates';
import { trainingRoutes } from '../../routes';
import {
  completeSet,
  finishSession,
  planFromTemplateDay,
  startSession,
} from '../../service/sessionService';
import { SAVE_DELAY_MS } from './ValueInput';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

async function startTemplate() {
  const exercises = await loadCoreExercises();
  const template = (await loadSampleTemplate('full_body_ab'))!;
  return startSession(
    rt,
    planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
  );
}

function renderAt(path: string) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  return router;
}

const SQUAT_W1 = 'Kniebeuge mit Langhantel, Arbeitssatz 1';

describe('Trainingsplayer (S-07)', () => {
  it('zeigt Kopf, Übungen, Satzzeilen und den hervorgehobenen Satz', async () => {
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tag A · Ganzkörper A/B' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 von 17 Sätzen/)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Kniebeuge mit Langhantel',
      'Bankdrücken mit Langhantel',
      'Rudern am Kabel, sitzend',
      'Beinbeuger liegend',
      'Unterarmstütz (Plank)',
    ]);
    const first = screen.getByRole('listitem', { name: 'Kniebeuge mit Langhantel, Aufwärmsatz 1' });
    expect(first).toHaveAttribute('aria-current', 'step');
    expect(within(first).getByLabelText(/^Wiederholungen/)).toHaveAttribute('placeholder', '10');
    expect(
      screen.getByLabelText('Zeit in Sekunden, Unterarmstütz (Plank), Arbeitssatz 1'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Erstes Mal')).toHaveLength(5);
  });

  it('speichert Eingaben verzögert, erledigt mit ±-Taste und zeigt Fehler am Satz', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    const weight = await screen.findByLabelText(`Gewicht in kg, ${SQUAT_W1}`);
    await user.type(weight, '60,5');
    await user.type(screen.getByLabelText(`Wiederholungen, ${SQUAT_W1}`), '7');
    await act(() => new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS + 100)));
    await waitFor(async () => {
      const stored = await getSession(rt.db, session.id);
      expect(stored?.exercises[0]?.sets[2]?.actual).toEqual({ weightKg: 60.5, reps: 7 });
    });

    await user.clear(screen.getByLabelText(`Wiederholungen, ${SQUAT_W1}`));
    await user.type(screen.getByLabelText(`Wiederholungen, ${SQUAT_W1}`), 'abc');
    await user.tab();
    expect(
      await screen.findByText('Wiederholungen als ganze Zahl von 0 bis 200'),
    ).toBeInTheDocument();

    const warmup = 'Kniebeuge mit Langhantel, Aufwärmsatz 1';
    await user.click(screen.getByRole('button', { name: 'Gewicht + 2,5' }));
    await waitFor(() => {
      expect(screen.getByLabelText(`Gewicht in kg, ${warmup}`)).toHaveValue('2,5');
    });
    await user.click(screen.getByRole('button', { name: 'Satz erledigt' }));
    expect(
      await screen.findByRole('button', { name: `Erledigt zurücknehmen, ${warmup}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 von 17 Sätzen/)).toBeInTheDocument();
  });

  it('überspringt und entfernt Sätze, fügt Sätze hinzu und entfernt Übungen mit Rückfrage', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: `Weitere Aktionen, ${SQUAT_W1}` }));
    await user.click(screen.getByRole('button', { name: 'Satz überspringen' }));
    expect(await screen.findByText('Übersprungen')).toBeInTheDocument();
    expect(screen.getByText(/0 von 16 Sätzen/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Wieder öffnen, ${SQUAT_W1}` }));
    await waitFor(() => {
      expect(screen.queryByText('Übersprungen')).toBeNull();
    });

    const plank = screen.getByRole('region', { name: 'Unterarmstütz (Plank)' });
    await user.click(within(plank).getByRole('button', { name: 'Satz hinzufügen' }));
    await waitFor(() => {
      expect(within(plank).getAllByRole('listitem')).toHaveLength(4);
    });
    await user.click(
      within(plank).getByRole('button', {
        name: 'Weitere Aktionen, Unterarmstütz (Plank), Arbeitssatz 4',
      }),
    );
    await user.click(within(plank).getByRole('button', { name: 'Satz entfernen' }));
    await waitFor(() => {
      expect(within(plank).getAllByRole('listitem')).toHaveLength(3);
    });

    // Ohne erledigte Sätze ohne Rückfrage, mit erledigten Sätzen mit Rückfrage.
    await user.click(within(plank).getByRole('button', { name: 'Übung entfernen' }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Unterarmstütz (Plank)' })).toBeNull();
    });
    const curl = screen.getByRole('region', { name: 'Beinbeuger liegend' });
    await completeSet(
      rt,
      session.id,
      (await getSession(rt.db, session.id))!.exercises[3]!.sets[0]!.id,
      {
        previous: { weightKg: 30, reps: 10 },
        restDefaultSec: 90,
        autoStartRest: false,
      },
    );
    await user.click(within(curl).getByRole('button', { name: 'Übung entfernen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Übung entfernen?' });
    expect(dialog).toHaveTextContent('Ein erledigter Satz wird mit entfernt.');
    await user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Beinbeuger liegend' })).toBeNull();
    });
  });

  it('meldet unbekannte Einheiten und leitet abgeschlossene zur Zusammenfassung', async () => {
    renderAt('/training/einheit/00000000-0000-4000-8000-000000000000');
    expect(await screen.findByText('Dieses Training gibt es nicht mehr.')).toBeInTheDocument();
    cleanup();
    const session = await startTemplate();
    await finishSession(rt, session.id, { skipOpen: true });
    const router = renderAt(`/training/einheit/${session.id}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Zusammenfassung' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/training/einheit/${session.id}/zusammenfassung`);
    expect(screen.getAllByText('Kein erledigter Satz')).toHaveLength(5);
  });

  it('zeigt die Zusammenfassung nur für abgeschlossene Einheiten', async () => {
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}/zusammenfassung`);
    expect(await screen.findByText('Dieses Training gibt es nicht mehr.')).toBeInTheDocument();
  });
});
