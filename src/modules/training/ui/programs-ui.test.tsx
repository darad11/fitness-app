// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stableId } from '@/shared/lib/uuid';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { findActiveSession } from '../data/sessionRepository';
import { loadTrainingState } from '../data/trainingStateRepository';
import { trainingRoutes } from '../routes';
import { activateProgram } from '../service/programService';
import { finishSession, startSession } from '../service/sessionService';
import { loadSampleTemplate } from '../data/sampleTemplates';
import { loadCoreExercises } from '@/modules/exercises';
import { planFromTemplateDay } from '../service/sessionService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

async function renderAt(path: string, heading: string) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: heading });
  return router;
}

describe('Programme und Vorlagen (S-04, S-49, AK-PRG-06)', () => {
  it('führt von Training über die Liste der Beispielvorlagen zur Vorlage', async () => {
    const user = userEvent.setup();
    const router = await renderAt('/training', 'Training');
    await user.click(screen.getByRole('link', { name: 'Programme und Vorlagen' }));
    await screen.findByRole('heading', { level: 1, name: 'Programme und Vorlagen' });
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(7);
    // Programme zuerst, mit Beschreibung; danach die Beispielvorlagen.
    expect(cards[0]).toHaveTextContent(
      'Ganzkörper A/B, 4 TageProgrammFortgeschrittene Einsteiger · Studio · 4 Tage pro Woche · 8 Wochen, 32 Trainingstage',
    );
    expect(cards[0]).toHaveTextContent('Wiedereinstieg nach längerer Pause');
    expect(cards[2]).toHaveTextContent('Winter Arc 2026 (Nachbau)Programm');
    expect(cards[3]).toHaveTextContent(
      'Ganzkörper A/BBeispielEinsteiger · Studio · 3 Tage pro Woche · 2 Trainingstage',
    );
    expect(cards[5]).toHaveTextContent('Fortgeschritten · Studio · 3–6 Tage pro Woche');
    expect(cards[6]).toHaveTextContent('Zuhause mit Kurzhanteln');
    expect(cards[6]).toHaveTextContent('Einsteiger · Zuhause');
    await user.click(within(cards[3]!).getByRole('link'));
    await screen.findByRole('heading', { level: 1, name: 'Ganzkörper A/B' });
    expect(router.state.location.pathname).toBe('/training/vorlagen/full_body_ab');
  });

  it('zeigt Etikett, Hinweis, Ablauf und das Satzschema jedes Tages', async () => {
    await renderAt('/training/vorlagen/full_body_ab', 'Ganzkörper A/B');
    expect(screen.getByText('Beispiel')).toBeInTheDocument();
    expect(
      screen.getByText(/^Beispieldaten – keine individuelle Trainingsempfehlung\./),
    ).toBeInTheDocument();
    const schedule = screen.getByRole('region', { name: 'Ablauf' });
    expect(
      within(schedule)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Woche 1: Tag A, Tag B, Tag A', 'Woche 2: Tag B, Tag A, Tag B']);
    const dayA = screen.getByRole('region', { name: 'Tag A' });
    const rows = within(dayA)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(rows).toEqual([
      '1Kniebeuge mit Langhantel2 Aufwärmsätze, 3 Sätze · 6–8 Wdh. · Pause 2:30 min',
      '2Bankdrücken mit Langhantel1 Aufwärmsatz, 3 Sätze · 6–8 Wdh. · Pause 2:30 min',
      '3Rudern am Kabel, sitzend3 Sätze · 8–12 Wdh. · Pause 2:00 min',
      '4Beinbeuger liegend2 Sätze · 10–12 Wdh. · Pause 1:15 min',
      '5Unterarmstütz (Plank)3 Sätze · 30–45 s · Pause 1:00 min',
    ]);
    const dayB = screen.getByRole('region', { name: 'Tag B' });
    expect(within(dayB).getByText('2 Sätze je Seite · 20–40 s · Pause 1:00 min')).toBeVisible();
    // Keine Bearbeitung: Beispielvorlagen sind schreibgeschützt; nur „heute trainieren".
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Tag A heute trainieren',
      'Tag B heute trainieren',
    ]);
  });

  it('zeigt Drop-Sätze mit eigenem Bereich', async () => {
    await renderAt('/training/vorlagen/upper_lower', 'Oberkörper/Unterkörper');
    const day = screen.getByRole('region', { name: 'Oberkörper 1' });
    expect(
      within(day).getByText('2 Sätze, 1 Drop-Satz · 10–12 Wdh., Drop 8–12 Wdh. · Pause 1:15 min'),
    ).toBeVisible();
    expect(
      screen.getByText('Woche 1: Oberkörper 1, Unterkörper 1, Oberkörper 2, Unterkörper 2'),
    ).toBeVisible();
  });

  it('startet einen Tag der Vorlage als Training und bietet danach Fortsetzen an (AK-TRN-22)', async () => {
    const user = userEvent.setup();
    const router = await renderAt('/training/vorlagen/full_body_ab', 'Ganzkörper A/B');
    await user.click(screen.getByRole('button', { name: 'Tag B heute trainieren' }));
    const active = await waitFor(async () => {
      const found = await findActiveSession(rt.db);
      expect(found).toBeDefined();
      return found!;
    });
    expect(active).toMatchObject({ source: 'template', title: 'Tag B · Ganzkörper A/B' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/training/einheit/${active.id}`);
    });
    await router.navigate('/training/vorlagen/full_body_ab');
    await screen.findByRole('heading', { level: 1, name: 'Ganzkörper A/B' });
    await user.click(screen.getByRole('button', { name: 'Tag A heute trainieren' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Es läuft bereits ein Training.');
    expect(screen.getByRole('link', { name: 'Training fortsetzen' })).toHaveAttribute(
      'href',
      `/training/einheit/${active.id}`,
    );
  });
});

describe('Programme aktivieren und den nächsten Tag starten (AK-PRG-07, AK-PRG-08, TP-19, TP-21)', () => {
  const A = stableId('sample-template:compound_ab_4');

  /** Schließt einen Tag des Programms als Einheit ab, wie es der Player täte. */
  async function completeDay(weekIndex: number, dayIndex: number) {
    const [template, exercises] = await Promise.all([
      loadSampleTemplate('compound_ab_4'),
      loadCoreExercises(),
    ]);
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const session = await startSession(
      rt,
      planFromTemplateDay(template!, weekIndex, dayIndex, (id) => byId.get(id), 'program'),
    );
    await finishSession(rt, session.id, { skipOpen: true });
  }

  it('aktiviert das Programm auf seiner Seite, markiert den nächsten Tag und zeigt den Zähler', async () => {
    const user = userEvent.setup();
    await renderAt('/training/vorlagen/compound_ab_4', 'Ganzkörper A/B, 4 Tage');
    expect(screen.getByText('Programm', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/^Wiedereinstieg nach längerer Pause/)).toBeVisible();
    expect(screen.queryByText('Als Nächstes')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Programm aktivieren' }));
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Trainingstag 1 von 32' }),
    ).toBeVisible();
    expect((await loadTrainingState(rt.db)).activeProgramId).toBe(A);
    const dayA = screen.getByRole('region', { name: 'Tag A' });
    expect(within(dayA).getByText('Als Nächstes')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Trainingstag starten' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Programm beenden' })).toBeVisible();
  });

  it('zählt nach einer abgeschlossenen Einheit weiter und markiert den Folgetag', async () => {
    await activateProgram(rt, A);
    await completeDay(0, 0);
    await renderAt('/training/vorlagen/compound_ab_4', 'Ganzkörper A/B, 4 Tage');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Trainingstag 2 von 32' }),
    ).toBeVisible();
    const dayB = screen.getByRole('region', { name: 'Tag B' });
    expect(within(dayB).getByText('Als Nächstes')).toBeVisible();
    // Bei wiederholten Tagen (A, B, A, B) gibt es keine Markierung „Erledigt" (wäre mehrdeutig).
    expect(screen.queryByText('Erledigt')).toBeNull();
  });

  it('startet den nächsten Tag von der Seite Training als Einheit des Programms', async () => {
    const user = userEvent.setup();
    await activateProgram(rt, A);
    await completeDay(0, 0);
    const router = await renderAt('/training', 'Training');
    expect(await screen.findByText('Aktives Programm')).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Tag B' })).toBeVisible();
    expect(screen.getByText('Trainingstag 2 von 32 · Ganzkörper A/B, 4 Tage')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Anderen Tag wählen' })).toHaveAttribute(
      'href',
      '/training/vorlagen/compound_ab_4',
    );
    await user.click(screen.getByRole('button', { name: 'Trainingstag starten' }));
    const active = await waitFor(async () => {
      const found = await findActiveSession(rt.db);
      expect(found).toBeDefined();
      return found!;
    });
    expect(active).toMatchObject({
      source: 'program',
      title: 'Tag B · Ganzkörper A/B, 4 Tage',
      program: { sampleKey: 'compound_ab_4', weekIndex: 0, dayIndex: 1 },
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/training/einheit/${active.id}`);
    });
  });

  it('zeigt in der Zusammenfassung „Trainingstag x von n" und auf der Liste das Etikett „Aktiv"', async () => {
    await activateProgram(rt, A);
    await completeDay(1, 0);
    const session = (await rt.db.sessions.toArray())[0]!;
    await renderAt(`/training/einheit/${session.id}/zusammenfassung`, 'Zusammenfassung');
    expect(
      await screen.findByText('Tag A · Ganzkörper A/B, 4 Tage · Trainingstag 5 von 32'),
    ).toBeVisible();
    cleanup();
    await renderAt('/training/programme', 'Programme und Vorlagen');
    const cards = screen.getAllByRole('listitem');
    await waitFor(() => {
      expect(within(cards[0]!).getByText('Aktiv')).toBeVisible();
    });
    expect(within(cards[1]!).getByText('Programm')).toBeVisible();
  });

  it('beendet das Programm wieder', async () => {
    const user = userEvent.setup();
    await activateProgram(rt, A);
    await renderAt('/training/vorlagen/compound_ab_4', 'Ganzkörper A/B, 4 Tage');
    await user.click(await screen.findByRole('button', { name: 'Programm beenden' }));
    expect(await screen.findByRole('button', { name: 'Programm aktivieren' })).toBeVisible();
    expect((await loadTrainingState(rt.db)).activeProgramId).toBeUndefined();
    expect(screen.queryByText('Als Nächstes')).toBeNull();
  });

  it('Winter Arc: Wochenüberschriften, Hinweise, Xeela-Namen und „Erledigt" je Tag', async () => {
    await activateProgram(rt, stableId('sample-template:winter_arc_2026'));
    const [template, exercises] = await Promise.all([
      loadSampleTemplate('winter_arc_2026'),
      loadCoreExercises(),
    ]);
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const session = await startSession(
      rt,
      planFromTemplateDay(template!, 0, 0, (id) => byId.get(id), 'program'),
    );
    await finishSession(rt, session.id, { skipOpen: true });
    await renderAt('/training/vorlagen/winter_arc_2026', 'Winter Arc 2026 (Nachbau)');
    // 40 Tage mit rund 280 Übungen: in jsdom auf langsamen CI-Runnern deutlich über 1 s.
    expect(
      await screen.findByRole(
        'heading',
        { level: 2, name: 'Trainingstag 2 von 40' },
        { timeout: 10_000 },
      ),
    ).toBeVisible();
    // Während des Ladens nie „abgeschlossen“ (Befund aus der CI von #12).
    expect(screen.queryByText('Programm abgeschlossen')).toBeNull();
    // Die Tagesnamen tragen den Kalendertag der Aufnahme (Tag 1, 4, 5, 6, 7, 10, ...).
    expect(screen.getAllByRole('heading', { level: 2, name: /^Woche \d$/ })).toHaveLength(8);
    const day1 = screen.getByRole('region', { name: /^Tag 1 · / });
    expect(within(day1).getByText('Erledigt')).toBeVisible();
    const day2 = screen.getByRole('region', { name: /^Tag 4 · / });
    expect(within(day2).getByText('Als Nächstes')).toBeVisible();
    expect(screen.getAllByText(/^Xeela: /).length).toBeGreaterThan(100);
    expect(screen.getAllByText(/^Dropset: schwer beginnen/).length).toBeGreaterThan(5);
    expect(screen.getByText(/^Quelle: Rekonstruktion/)).toBeVisible();
  }, 20_000);
});
