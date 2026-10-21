// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { coreExerciseId, loadCoreExercises, savePrefs } from '@/modules/exercises';
import { playRestEndSound } from '@/shared/lib/sound';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { getSession } from '../../data/sessionRepository';
import { loadSampleTemplate } from '../../data/sampleTemplates';
import { trainingRoutes } from '../../routes';
import {
  addExercise,
  adjustRest,
  completeSet,
  finishSession,
  planFromTemplateDay,
  setExerciseNote,
  setValues,
  startSession,
} from '../../service/sessionService';
import { SAVE_DELAY_MS } from './ValueInput';

vi.mock('@/shared/lib/sound', () => ({
  playRestEndSound: vi.fn(() => true),
  unlockSound: vi.fn(),
}));

const toSec = (text: string | null) => {
  const [m = 0, s = 0] = (text ?? '0:00').replace('+', '').split(':').map(Number);
  return m * 60 + s;
};

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  vi.mocked(playRestEndSound).mockClear();
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

  it('belegt Distanzen ab 1000 m ohne Tausenderpunkt vor (D-291)', async () => {
    const session = await startTemplate();
    const exercises = await loadCoreExercises();
    const rower = exercises.find((e) => e.id === coreExerciseId('rowing_machine'))!;
    const withRower = await addExercise(rt, session.id, {
      exerciseId: rower.id,
      name: rower.name,
      trackingMode: 'time_distance',
      distanceUnit: 'm',
    });
    const set = withRower.exercises.at(-1)!.sets[0]!;
    await setValues(rt, session.id, set.id, { distanceM: 2000 });
    renderAt(`/training/einheit/${session.id}`);
    expect(await screen.findByLabelText('Distanz in m, Rudergerät, Arbeitssatz 1')).toHaveValue(
      '2000',
    );
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

  it('zeigt die Pause mit Restzeit, nächstem Satz, ±15 s, Vollansicht und Überspringen (AK-TRN-10, -11)', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    const warmup = 'Kniebeuge mit Langhantel, Aufwärmsatz 1';
    await user.type(await screen.findByLabelText(`Gewicht in kg, ${warmup}`), '40');
    await user.click(screen.getByRole('button', { name: `Satz erledigt, ${warmup}` }));
    const stage = await screen.findByRole('region', { name: 'Pause' });
    const timer = within(stage).getByRole('timer');
    expect(timer).toHaveTextContent(/^\d:\d\d$/);
    const before = toSec(timer.textContent);
    expect(before).toBeGreaterThan(30);
    expect(stage).toHaveTextContent(
      'Nächster Satz: Kniebeuge mit Langhantel, Aufwärmsatz 2 · Ziel 5',
    );
    await user.click(within(stage).getByRole('button', { name: '15 s weniger' }));
    await waitFor(() => {
      expect(toSec(timer.textContent)).toBeLessThanOrEqual(before - 14);
    });
    await user.click(within(stage).getByRole('button', { name: '15 s mehr' }));
    await waitFor(() => {
      expect(toSec(timer.textContent)).toBeGreaterThanOrEqual(before - 2);
    });
    // Während der Pause ist die Bühne „Jetzt" ausgeblendet; der nächste Satz bleibt hervorgehoben.
    expect(screen.queryByRole('region', { name: 'Jetzt' })).toBeNull();
    expect(
      screen.getByRole('listitem', { name: 'Kniebeuge mit Langhantel, Aufwärmsatz 2' }),
    ).toHaveAttribute('aria-current', 'step');

    await user.click(screen.getByRole('button', { name: 'Pause groß anzeigen' }));
    const collapse = await screen.findByRole('button', { name: 'Pause klein anzeigen' });
    expect(screen.getAllByRole('timer')).toHaveLength(1);
    await user.click(collapse);
    expect(screen.getByRole('button', { name: 'Pause groß anzeigen' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause überspringen' }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Pause' })).toBeNull();
    });
    expect(screen.getByRole('region', { name: 'Jetzt' })).toHaveTextContent(
      'Kniebeuge mit Langhantel',
    );
    expect(playRestEndSound).not.toHaveBeenCalled();
  });

  it('zeigt nach einer Rückkehr die Überziehung ohne nachträglichen Ton (AK-TRN-11, -12)', async () => {
    const session = await startTemplate();
    const setId = session.exercises[0]!.sets[0]!.id;
    await setValues(rt, session.id, setId, { weightKg: 40 });
    await completeSet(rt, session.id, setId, {
      restDefaultSec: 90,
      autoStartRest: true,
      now: () => new Date(Date.now() - 200_000),
    });
    renderAt(`/training/einheit/${session.id}`);
    const stage = await screen.findByRole('region', { name: 'Pause' });
    expect(stage).toHaveTextContent('Pause vorbei');
    expect(within(stage).getByRole('timer')).toHaveTextContent(/^\+\d:\d\d$/);
    expect(within(stage).getByRole('timer')).toHaveAccessibleName(/^Pause vorbei seit /);
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    expect(playRestEndSound).not.toHaveBeenCalled();
  });

  it('spielt den Ton, wenn das Pausenende während der Anzeige erreicht wird (AK-TRN-12)', async () => {
    const session = await startTemplate();
    const setId = session.exercises[0]!.sets[0]!.id;
    await setValues(rt, session.id, setId, { weightKg: 40 });
    const completed = await completeSet(rt, session.id, setId, {
      restDefaultSec: 90,
      autoStartRest: true,
    });
    await adjustRest(rt, session.id, -(completed.restTimer!.durationSec - 1));
    renderAt(`/training/einheit/${session.id}`);
    const stage = await screen.findByRole('region', { name: 'Pause' });
    expect(within(stage).getByRole('timer')).toHaveTextContent(/^0:0[12]$/);
    await waitFor(
      () => {
        expect(playRestEndSound).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    expect(stage).toHaveTextContent('Pause vorbei');
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
    await user.click(
      within(plank).getByRole('button', { name: 'Weitere Aktionen, Unterarmstütz (Plank)' }),
    );
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
    await user.click(
      within(curl).getByRole('button', { name: 'Weitere Aktionen, Beinbeuger liegend' }),
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

describe('Player ausgebaut (Schritt D): Info, Umsortieren, Ersetzen, Übungstimer', () => {
  const headings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

  it('zeigt die Übungsinfo mit Muskeln, Gerät und Erfassung', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Übungsinfo, Kniebeuge mit Langhantel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Kniebeuge mit Langhantel' });
    await waitFor(() => {
      expect(within(dialog).getByText('Hauptmuskeln')).toBeVisible();
    });
    expect(within(dialog).getByText('Gerät')).toBeVisible();
    expect(within(dialog).getByText('Langhantel', { selector: 'dd' })).toBeVisible();
    expect(within(dialog).getByText('Gewicht und Wiederholungen')).toBeVisible();
  });

  it('sortiert Übungen nach oben und unten; am Rand sind die Tasten gesperrt', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    expect(headings().slice(0, 2)).toEqual([
      'Kniebeuge mit Langhantel',
      'Bankdrücken mit Langhantel',
    ]);
    await user.click(
      screen.getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel' }),
    );
    expect(screen.getByRole('button', { name: 'Nach oben' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Nach unten' }));
    await waitFor(() => {
      expect(headings().slice(0, 2)).toEqual([
        'Bankdrücken mit Langhantel',
        'Kniebeuge mit Langhantel',
      ]);
    });
    await user.click(screen.getByRole('button', { name: 'Nach oben' }));
    await waitFor(() => {
      expect(headings()[0]).toBe('Kniebeuge mit Langhantel');
    });
  });

  it('ersetzt eine Übung über die Alternativen und merkt sich die Herkunft (AK-TRN-09)', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    await user.click(
      screen.getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel' }),
    );
    await user.click(screen.getByRole('button', { name: 'Übung ersetzen' }));
    const picker = await screen.findByRole('dialog', { name: 'Kniebeuge mit Langhantel ersetzen' });
    const alternatives = await within(picker).findByRole('region', { name: 'Alternativen' });
    const names = within(alternatives)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names.length).toBeGreaterThan(2);
    expect(names.some((n) => n.startsWith('Beinpresse'))).toBe(true);
    expect(names.some((n) => n.startsWith('Kniebeuge mit Langhantel'))).toBe(false);
    const legPress = within(alternatives)
      .getAllByRole('button')
      .find((b) => b.querySelector('span')?.textContent === 'Beinpresse')!;
    await user.click(legPress);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /ersetzen$/ })).toBeNull();
    });
    expect(await screen.findByRole('region', { name: 'Beinpresse' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Kniebeuge mit Langhantel' })).toBeNull();
    expect(headings()[0]).toBe('Beinpresse');
    // Sätze und Ziele bleiben: 2 Aufwärmsätze + 3 Arbeitssätze.
    expect(
      within(screen.getByRole('region', { name: 'Beinpresse' })).getAllByRole('listitem'),
    ).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Übungsinfo, Beinpresse' }));
    const dialog = await screen.findByRole('dialog', { name: 'Beinpresse' });
    expect(await within(dialog).findByText('Ersetzt Kniebeuge mit Langhantel')).toBeVisible();
  });

  it('startet und stoppt den Übungstimer eines Zeitsatzes und speichert die Dauer (AK-TRN-14)', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    const plankSet = 'Unterarmstütz (Plank), Arbeitssatz 1';
    // Kein Timer an Übungen ohne Zeitfeld.
    await user.click(screen.getByRole('button', { name: `Weitere Aktionen, ${SQUAT_W1}` }));
    expect(screen.queryByRole('button', { name: /^Timer starten/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: `Weitere Aktionen, ${plankSet}` }));
    await user.click(screen.getByRole('button', { name: `Timer starten, ${plankSet}` }));
    const stop = await screen.findByRole('button', { name: `Timer stoppen, ${plankSet}` });
    expect((await getSession(rt.db, session.id))!.setTimer?.setId).toBeDefined();
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });
    expect(stop).toHaveTextContent(/Timer stoppen 0:0[1-9]/);
    await user.click(stop);
    await waitFor(() => {
      const input = screen.getByLabelText<HTMLInputElement>(`Zeit in Sekunden, ${plankSet}`);
      expect(input.value).toMatch(/^[1-9]$/);
    });
    expect((await getSession(rt.db, session.id))!.setTimer).toBeNull();
    // „Erledigt" übernimmt die gespeicherte Zeit.
    await user.click(screen.getByRole('button', { name: `Satz erledigt, ${plankSet}` }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `Erledigt zurücknehmen, ${plankSet}` }),
      ).toBeVisible();
    });
  });
});

describe('Persönliche Angaben im Player (AK-EXL-04, D-258)', () => {
  it('nutzt Standardpause und Gewichtsschritt der Übung, wenn der Plan keine Pause hat', async () => {
    const user = userEvent.setup();
    const benchId = coreExerciseId('bench_press_barbell');
    await savePrefs(rt, benchId, { defaultRestSec: 45, weightStepKg: 1.25 });
    const session = await startSession(rt, {
      source: 'free',
      title: 'Frei',
      exercises: [
        {
          exerciseId: benchId,
          name: 'Bankdrücken mit Langhantel',
          trackingMode: 'weight_reps',
          sets: [{ type: 'working' }, { type: 'working' }],
        },
      ],
    });
    renderAt(`/training/einheit/${session.id}`);
    const first = 'Bankdrücken mit Langhantel, Arbeitssatz 1';
    await user.click(await screen.findByRole('button', { name: 'Gewicht + 1,25' }));
    await waitFor(() => {
      expect(screen.getByLabelText(`Gewicht in kg, ${first}`)).toHaveValue('1,25');
    });
    await user.type(screen.getByLabelText(`Wiederholungen, ${first}`), '8');
    await user.click(screen.getByRole('button', { name: `Satz erledigt, ${first}` }));
    await waitFor(async () => {
      expect((await getSession(rt.db, session.id))?.restTimer?.durationSec).toBe(45);
    });
  });
});

describe('Notizen im Player (AK-TRN-24, D-260)', () => {
  const benchInput = () => ({
    source: 'free' as const,
    title: 'Frei',
    exercises: [
      {
        exerciseId: coreExerciseId('bench_press_barbell'),
        name: 'Bankdrücken mit Langhantel',
        trackingMode: 'weight_reps' as const,
        sets: [{ type: 'working' as const }],
      },
    ],
  });

  it('schreibt Notizen zu Übung und Einheit und zeigt die Notiz vom letzten Mal', async () => {
    const user = userEvent.setup();
    const earlier = await startSession(rt, benchInput());
    await setExerciseNote(rt, earlier.id, earlier.exercises[0]!.id, 'Griff enger');
    await completeSet(rt, earlier.id, earlier.exercises[0]!.sets[0]!.id, {
      previous: { weightKg: 60, reps: 8 },
      restDefaultSec: 90,
      autoStartRest: false,
    });
    await finishSession(rt, earlier.id, { skipOpen: false });

    const session = await startSession(rt, benchInput());
    renderAt(`/training/einheit/${session.id}`);
    expect(await screen.findByText('Griff enger')).toBeVisible();
    expect(screen.getByText(/Notiz vom letzten Mal/)).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Weitere Aktionen, Bankdrücken mit Langhantel' }),
    );
    await user.click(screen.getByRole('button', { name: 'Notiz' }));
    const dialog = screen.getByRole('dialog', { name: 'Notiz zu Bankdrücken mit Langhantel' });
    await user.type(within(dialog).getByLabelText('Notiz'), 'Heute leichter');
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByText('Heute leichter')).toBeVisible();
    expect(screen.queryByText(/Notiz vom letzten Mal/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Notiz zur Einheit' }));
    const sessionDialog = screen.getByRole('dialog', { name: 'Notiz zur Einheit' });
    await user.type(within(sessionDialog).getByLabelText('Notiz'), 'Wenig Schlaf');
    await user.click(within(sessionDialog).getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByText('Wenig Schlaf')).toBeVisible();
    const stored = await getSession(rt.db, session.id);
    expect(stored?.notes).toBe('Wenig Schlaf');
    expect(stored?.exercises[0]?.note).toBe('Heute leichter');
  });
});
