// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addBodyWeight } from '@/modules/body';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import {
  completeSet,
  finishSession,
  liveExercises,
  liveSets,
  loadSampleTemplate,
  planFromTemplateDay,
  startSession,
} from '@/modules/training';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { progressRoutes } from '../routes';

let rt: DbRuntime;
let exercises: readonly Exercise[];
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  exercises = await loadCoreExercises();
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

const T0 = Date.parse('2026-10-01T09:00:00.000Z');
const at =
  (days: number, plusSec = 0) =>
  () =>
    new Date(T0 + days * 86_400_000 + plusSec * 1000);

/** Tag A der Beispielvorlage: erster Arbeitssatz Kniebeuge mit Gewicht × Wdh., dann beenden. */
async function completeDayA(day: number, weightKg: number, reps: number) {
  const template = (await loadSampleTemplate('full_body_ab'))!;
  const session = await startSession(
    rt,
    planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
    { now: at(day) },
  );
  const squat = liveExercises(session)[0]!;
  const working = liveSets(squat).find((set) => set.type === 'working')!;
  await completeSet(rt, session.id, working.id, {
    previous: { weightKg, reps },
    restDefaultSec: 90,
    autoStartRest: false,
    now: at(day, 600),
  });
  return finishSession(rt, session.id, { skipOpen: true, now: at(day, 3000) });
}

async function renderAt(path: string, heading: string) {
  const router = createMemoryRouter(progressRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: heading });
  return router;
}

describe('Fortschritt (S-27, TH-05, TH-06)', () => {
  it('zeigt den Leerzustand ohne Daten', async () => {
    await renderAt('/fortschritt', 'Fortschritt');
    expect(await screen.findByText('Noch keine Daten')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Gewicht erfassen' })).toHaveAttribute(
      'href',
      '/fortschritt/gewicht',
    );
  });

  it('zeigt Kennzahlen je Zeitraum, Kalorien nur mit Körpergewicht, Bestleistungen und Übungsverläufe', async () => {
    const user = userEvent.setup();
    await completeDayA(0, 60, 8);
    await completeDayA(7, 70, 6);
    await addBodyWeight(rt, { weightKg: 80, measuredAt: new Date(T0 + 3 * 86_400_000) });
    await renderAt('/fortschritt', 'Fortschritt');
    await user.click(await screen.findByRole('radio', { name: 'Gesamt' }));
    const tiles = screen.getAllByRole('definition');
    expect(tiles[0]).toHaveTextContent('2');
    expect(tiles[1]).toHaveTextContent('100 min');
    expect(tiles[2]).toHaveTextContent('900 kg');
    // Die erste Einheit liegt vor dem Gewichtseintrag: eine Schätzung fehlt.
    expect(tiles[3]).toHaveTextContent('kcal');
    expect(screen.getByText('1 Training ohne Schätzung (kein Körpergewicht)')).toBeVisible();

    const records = screen.getByRole('region', { name: 'Bestleistungen' });
    expect(within(records).getByText('Kniebeuge mit Langhantel')).toBeVisible();
    expect(within(records).getByText('70 × 6')).toBeVisible();
    expect(within(records).getByText(/1RM ca\. 84 kg/)).toBeVisible();

    const weight = screen.getByRole('region', { name: 'Körpergewicht' });
    expect(within(weight).getByText('80,0 kg')).toBeVisible();

    const list = screen.getByRole('region', { name: 'Übungsverläufe' });
    const link = within(list).getByRole('link', { name: /Kniebeuge mit Langhantel/ });
    expect(link).toHaveTextContent('2 Einheiten');
    await user.click(link);
    await screen.findByRole('heading', { level: 1, name: 'Kniebeuge mit Langhantel' });
    // Unter drei Einheiten: Liste statt Linie.
    expect(await screen.findByText(/mindestens drei Einheiten/)).toBeVisible();
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('70 kg');
    expect(rows[1]).toHaveTextContent('70 × 6');
    await user.click(screen.getByRole('radio', { name: 'Geschätztes 1RM' }));
    expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent('84 kg');
  });

  it('meldet eine unbekannte Übung als nicht gefunden', async () => {
    const router = createMemoryRouter(progressRoutes, {
      initialEntries: ['/fortschritt/uebung/00000000-0000-4000-8000-000000000000'],
    });
    render(
      <DbProvider runtime={rt}>
        <RouterProvider router={router} />
      </DbProvider>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Übung nicht gefunden' }),
    ).toBeVisible();
    expect(router.state.errors).toBeNull();
  });
});
