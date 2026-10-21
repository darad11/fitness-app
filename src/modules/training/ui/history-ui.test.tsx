// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { coreExerciseId, loadCoreExercises } from '@/modules/exercises';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { loadSampleTemplate } from '../data/sampleTemplates';
import { getSession, latestHistory, listCompletedSessions } from '../data/sessionRepository';
import { trainingRoutes } from '../routes';
import {
  completeSet,
  finishSession,
  planFromTemplateDay,
  setValues,
  skipSet,
  startSession,
} from '../service/sessionService';

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

/** Eine abgeschlossene Einheit aus Tag A mit einem erledigten und einem übersprungenen Satz. */
async function finishedTemplateSession(now: Date) {
  const exercises = await loadCoreExercises();
  const template = (await loadSampleTemplate('full_body_ab'))!;
  const session = await startSession(
    rt,
    planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
    { now: () => now },
  );
  const squat = session.exercises[0]!;
  const working = squat.sets.find((set) => set.type === 'working')!;
  await setValues(rt, session.id, working.id, { weightKg: 60, reps: 8 });
  await completeSet(rt, session.id, working.id, {
    restDefaultSec: 90,
    autoStartRest: false,
    now: () => now,
  });
  await skipSet(rt, session.id, squat.sets[0]!.id);
  return finishSession(rt, session.id, {
    skipOpen: true,
    now: () => new Date(now.getTime() + 25 * 60_000),
  });
}

describe('Verlauf (S-11, AK-HIS-01, AK-HIS-02)', () => {
  it('zeigt ohne Einheiten einen Leerzustand mit Aktion', async () => {
    renderAt('/training/verlauf');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Noch kein Training gespeichert' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vorlage wählen' })).toHaveAttribute(
      'href',
      '/training/programme',
    );
  });

  it('listet abgeschlossene Einheiten nach Woche, neueste zuerst, mit Dauer, Sätzen und Volumen', async () => {
    const older = await finishedTemplateSession(new Date('2026-10-07T17:00:00'));
    const newer = await finishedTemplateSession(new Date('2026-10-14T18:30:00'));
    const user = userEvent.setup();
    const router = renderAt('/training/verlauf');
    const weeks = await screen.findAllByRole('heading', { level: 2 });
    expect(weeks.map((h) => h.textContent)).toEqual([
      'Woche ab 12. Oktober 2026',
      'Woche ab 5. Oktober 2026',
    ]);
    const links = screen.getAllByRole('link', { name: /Tag A · Ganzkörper A\/B/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', `/training/verlauf/${newer.id}`);
    expect(links[0]).toHaveTextContent('Mittwoch, 14. Oktober · 25:00 · 1 Satz · 480 kg');
    expect(links[1]).toHaveAttribute('href', `/training/verlauf/${older.id}`);

    await user.click(links[0]!);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tag A · Ganzkörper A/B' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/training/verlauf/${newer.id}`);
    expect(screen.getByText('Abgeschlossenes Training')).toBeInTheDocument();
    const squat = screen.getByRole('region', { name: 'Kniebeuge mit Langhantel' });
    const rows = within(squat).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Aufwärmsatz 1–Übersprungen');
    expect(rows[2]).toHaveTextContent('Arbeitssatz 160 × 8Erledigt');
    // „Beenden“ mit offenen Sätzen markiert sie als übersprungen (AK-TRN-19).
    expect(rows[3]).toHaveTextContent('Arbeitssatz 2–Übersprungen');
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      '25:00',
      '5',
      '1',
      '480 kg',
    ]);
  });

  it('meldet unbekannte oder laufende Einheiten im Verlauf', async () => {
    renderAt('/training/verlauf/00000000-0000-4000-8000-000000000000');
    expect(await screen.findByText('Dieses Training gibt es nicht mehr.')).toBeInTheDocument();
  });
});

describe('Verlauf bearbeiten und löschen (AK-HIS-03, AK-HIS-04)', () => {
  it('ändert Titel und Werte, aktualisiert die Vorwerte und entfernt einen Satz', async () => {
    const user = userEvent.setup();
    const session = await finishedTemplateSession(new Date('2026-10-15T17:00:00.000Z'));
    renderAt(`/training/verlauf/${session.id}`);
    await screen.findByRole('heading', { level: 1, name: 'Tag A · Ganzkörper A/B' });
    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const title = await screen.findByLabelText('Titel');
    await user.clear(title);
    await user.type(title, 'Tag A schwer');
    const weight = screen.getByLabelText('Gewicht in kg, Kniebeuge mit Langhantel, Arbeitssatz 1');
    expect(weight).toHaveValue('60');
    await user.clear(weight);
    await user.type(weight, '62,5');
    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Tag A schwer' })).toBeVisible();
    const squatId = session.exercises[0]!.exerciseId;
    expect((await latestHistory(rt.db, squatId))?.best).toEqual({ weightKg: 62.5, reps: 8 });

    // Satz entfernen: danach hat die Übung keinen erledigten Satz mehr.
    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await user.click(
      await screen.findByRole('button', {
        name: 'Satz entfernen, Kniebeuge mit Langhantel, Arbeitssatz 1',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    await screen.findByRole('heading', { level: 1, name: 'Tag A schwer' });
    expect(await latestHistory(rt.db, squatId)).toMatchObject({ best: null, sets: [] });
  });

  it('belegt Distanzen ab 1000 m ohne Tausenderpunkt vor (D-291)', async () => {
    const user = userEvent.setup();
    const now = new Date('2026-10-15T17:00:00.000Z');
    const exercises = await loadCoreExercises();
    const rower = exercises.find((e) => e.id === coreExerciseId('rowing_machine'))!;
    const started = await startSession(
      rt,
      {
        source: 'free',
        title: 'Rudern',
        exercises: [
          {
            exerciseId: rower.id,
            name: rower.name,
            trackingMode: 'time_distance',
            distanceUnit: 'm',
            sets: [{ type: 'working' }],
          },
        ],
      },
      { now: () => now },
    );
    const set = started.exercises[0]!.sets[0]!;
    await setValues(rt, started.id, set.id, { durationSec: 600, distanceM: 2000 });
    await completeSet(rt, started.id, set.id, {
      restDefaultSec: 90,
      autoStartRest: false,
      now: () => now,
    });
    const session = await finishSession(rt, started.id, {
      skipOpen: true,
      now: () => new Date(now.getTime() + 11 * 60_000),
    });
    renderAt(`/training/verlauf/${session.id}`);
    await screen.findByRole('heading', { level: 1, name: 'Rudern' });
    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const distance = await screen.findByLabelText('Distanz in m, Rudergerät, Arbeitssatz 1');
    expect(distance).toHaveValue('2000');
    expect(screen.getByLabelText('Zeit in Minuten, Rudergerät, Arbeitssatz 1')).toHaveValue('10');
    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Änderungen speichern' })).toBeNull();
    });
    const stored = await getSession(rt.db, session.id);
    expect(stored?.exercises[0]?.sets[0]?.actual).toEqual({ durationSec: 600, distanceM: 2000 });
  });

  it('zeigt Fehler beim Bearbeiten und speichert nichts', async () => {
    const user = userEvent.setup();
    const session = await finishedTemplateSession(new Date('2026-10-15T17:00:00.000Z'));
    renderAt(`/training/verlauf/${session.id}`);
    await user.click(await screen.findByRole('button', { name: 'Bearbeiten' }));
    const weight = await screen.findByLabelText(
      'Gewicht in kg, Kniebeuge mit Langhantel, Arbeitssatz 1',
    );
    await user.clear(weight);
    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Jeder erledigte Satz braucht alle Werte',
    );
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect((await getSession(rt.db, session.id))?.hlc).toBe(session.hlc);
  });

  it('löscht mit Rückfrage und stellt mit „Rückgängig“ wieder her', async () => {
    const user = userEvent.setup();
    const session = await finishedTemplateSession(new Date('2026-10-15T17:00:00.000Z'));
    const router = renderAt(`/training/verlauf/${session.id}`);
    await user.click(await screen.findByRole('button', { name: 'Löschen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Training löschen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/training/verlauf');
    });
    expect(await screen.findByText('Training gelöscht')).toBeVisible();
    expect(await listCompletedSessions(rt.db)).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () => {
      expect((await listCompletedSessions(rt.db)).map((s) => s.id)).toEqual([session.id]);
    });
    expect(await screen.findByRole('link', { name: /Tag A · Ganzkörper A\/B/ })).toBeVisible();
  });
});
