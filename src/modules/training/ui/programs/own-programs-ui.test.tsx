// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listOwnPrograms } from '../../data/programRepository';
import { findActiveSession } from '../../data/sessionRepository';
import { loadTrainingState } from '../../data/trainingStateRepository';
import { trainingRoutes } from '../../routes';
import { createProgram } from '../../service/programService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

async function renderAt(path: string, heading: string | RegExp) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 10_000 });
  return router;
}

describe('Eigene Programme (AP 2.1 bis 2.4, D-257)', () => {
  it('legt ein Programm an, baut einen Tag auf und startet ihn', { timeout: 30_000 }, async () => {
    const user = userEvent.setup();
    const router = await renderAt('/training/programme', 'Programme und Vorlagen');
    expect(await screen.findByText('Noch keine eigenen Programme.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Neues Programm' }));
    await user.type(screen.getByLabelText('Name'), 'Mein Plan');
    await user.click(screen.getByRole('button', { name: 'Anlegen' }));
    await screen.findByRole('heading', { level: 1, name: 'Mein Plan' });
    expect(router.state.location.pathname).toMatch(
      /^\/training\/programme\/[0-9a-f-]+\/bearbeiten$/,
    );

    // Woche hinzufügen und umbenennen.
    await user.click(screen.getByRole('button', { name: 'Woche hinzufügen' }));
    await screen.findByRole('heading', { level: 3, name: 'Woche 2' });
    await user.click(screen.getByRole('button', { name: 'Woche 2 umbenennen' }));
    const nameField = screen.getByLabelText('Name', { selector: '#name-dialog-input' });
    await user.clear(nameField);
    await user.type(nameField, 'Deload');
    await user.click(
      within(screen.getByRole('dialog', { name: 'Woche umbenennen' })).getByRole('button', {
        name: 'Speichern',
      }),
    );
    await screen.findByRole('heading', { level: 3, name: 'Deload' });
    // Die letzte verbleibende Woche ließe sich nicht löschen; mit zwei Wochen geht es mit Rückfrage.
    await user.click(screen.getByRole('button', { name: 'Deload löschen' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Deload löschen?' })).getByRole('button', {
        name: 'Löschen',
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Deload' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Woche 1 löschen' })).toBeDisabled();

    // Tag öffnen, Übung hinzufügen, Satzschema anpassen.
    await user.click(screen.getByRole('link', { name: /^Tag 1\s*bearbeiten/ }));
    await screen.findByRole('heading', { level: 1, name: 'Tag 1' });
    await user.click(screen.getByRole('button', { name: 'Übung hinzufügen' }));
    await user.type(await screen.findByLabelText('Übungen suchen'), 'Bankdrücken mit Langhantel');
    await user.click(
      await screen.findByRole('button', { name: /^Bankdrücken mit Langhantel/ }, { timeout: 5000 }),
    );
    await screen.findByRole('heading', { level: 3, name: 'Bankdrücken mit Langhantel' });
    const max = screen.getByLabelText('Wdh. bis, Satz 1, Bankdrücken mit Langhantel');
    expect(max).toHaveValue('12');
    await user.clear(max);
    await user.type(max, '10{Enter}');
    await user.type(
      screen.getByLabelText('Zielgewicht (kg), Satz 1, Bankdrücken mit Langhantel'),
      '60{Enter}',
    );
    await user.click(
      screen.getByRole('button', { name: 'Drop-Satz nach Satz 3, Bankdrücken mit Langhantel' }),
    );
    await screen.findByText('Satz 4 · Drop');
    await waitFor(async () => {
      const [program] = await listOwnPrograms(rt.db);
      const sets = program?.weeks[0]?.days[0]?.exercises[0]?.sets ?? [];
      expect(sets.map((s) => [s.type, s.repsMin, s.repsMax, s.weightKg])).toEqual([
        ['working', 8, 10, 60],
        ['working', 8, 12, undefined],
        ['working', 8, 12, undefined],
        ['drop', 8, 12, undefined],
      ]);
    });

    // Wochentag-Hinweis speichern.
    await user.selectOptions(screen.getByLabelText('Wochentag (optional)'), 'Montag');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('status');

    // Zurück zur Programmansicht, aktivieren und den nächsten Tag starten.
    await user.click(screen.getByRole('link', { name: /Zum Editor/ }));
    await screen.findByRole('heading', { level: 1, name: 'Mein Plan' });
    await user.click(screen.getByRole('link', { name: /Zum Programm/ }));
    await screen.findByRole('button', { name: 'Programm aktivieren' });
    const day = screen.getByRole('region', { name: 'Woche 1' });
    expect(
      within(day).getByText(/1 Übung · 4 Sätze · ca\. \d+ min · Geplant für Montag/),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Programm aktivieren' }));
    await screen.findByRole('button', { name: 'Training starten' });
    const [program] = await listOwnPrograms(rt.db);
    expect((await loadTrainingState(rt.db)).activeProgramId).toBe(program?.id);
    await user.click(screen.getByRole('button', { name: 'Training starten' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/training\/einheit\//);
    });
    const session = await findActiveSession(rt.db);
    expect(session?.program).toMatchObject({ programId: program?.id, programName: 'Mein Plan' });
    expect(session?.exercises[0]?.sets[0]?.target).toEqual({
      repsMin: 8,
      repsMax: 10,
      weightKg: 60,
    });
  });

  it('übernimmt ein gebündeltes Programm als eigenes', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    const router = await renderAt('/training/vorlagen/full_body_ab', 'Ganzkörper A/B');
    await user.click(screen.getByRole('button', { name: 'Als eigenes Programm übernehmen' }));
    await screen.findByText('Eigenes Programm', {}, { timeout: 10_000 });
    expect(router.state.location.pathname).toMatch(/^\/training\/programme\/[0-9a-f-]+$/);
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toBeVisible();
    const [copy] = await listOwnPrograms(rt.db);
    expect(copy).toMatchObject({ origin: 'sample-copy', sampleKey: 'full_body_ab' });
  });

  it(
    'löscht mit Rückfrage und macht das Löschen rückgängig (AK-PRG-11)',
    { timeout: 20_000 },
    async () => {
      const user = userEvent.setup();
      const program = await createProgram(rt, {
        name: 'Alt',
        firstWeek: 'Woche 1',
        firstDay: 'Tag 1',
      });
      const router = await renderAt(`/training/programme/${program.id}`, 'Alt');
      await user.click(screen.getByRole('button', { name: 'Löschen' }));
      const dialog = screen.getByRole('dialog', { name: '„Alt“ löschen?' });
      expect(within(dialog).getByText(/10 Sekunden lang rückgängig/)).toBeVisible();
      await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));
      await screen.findByText('„Alt“ gelöscht');
      expect(router.state.location.pathname).toBe('/training/programme');
      expect(await listOwnPrograms(rt.db)).toEqual([]);
      await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
      await screen.findByRole('link', { name: /^Alt/ });
      expect((await listOwnPrograms(rt.db)).map((p) => p.name)).toEqual(['Alt']);
    },
  );

  it('archiviert, zeigt das Archiv und dupliziert (AK-PRG-05)', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    const program = await createProgram(rt, {
      name: 'Plan',
      firstWeek: 'Woche 1',
      firstDay: 'Tag 1',
    });
    await renderAt(`/training/programme/${program.id}`, 'Plan');
    await user.click(screen.getByRole('button', { name: 'Duplizieren' }));
    await screen.findByRole('heading', { level: 1, name: 'Plan (Kopie)' });
    await user.click(screen.getByRole('button', { name: 'Archivieren' }));
    await screen.findByText(/Dieses Programm ist archiviert/);
    expect(screen.queryByRole('button', { name: 'Programm aktivieren' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Programme und Vorlagen' }));
    await screen.findByText('Archiv (1)');
    const own = screen.getByRole('region', { name: 'Meine Programme' });
    expect(within(own).getByRole('link', { name: /^Plan/ })).toBeVisible();
  });
});
