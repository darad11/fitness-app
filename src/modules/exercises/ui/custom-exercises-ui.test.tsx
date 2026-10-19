// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { progressRoutes } from '@/modules/progress';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listCustomExercises, listExercisePrefs } from '../data/customExercises';
import { exercisesRoutes } from '../routes';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

async function renderAt(path: string, heading: string) {
  const router = createMemoryRouter([...exercisesRoutes, ...progressRoutes], {
    initialEntries: [path],
  });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 5000 });
  return router;
}

describe('Eigene Übungen und persönliche Angaben (AK-EXL-03 bis AK-EXL-05, D-258)', () => {
  it('legt eine Übung an, speichert Angaben und archiviert sie', { timeout: 40_000 }, async () => {
    const user = userEvent.setup();
    const router = await renderAt('/uebungen', 'Übungen');
    await user.click(screen.getByRole('button', { name: 'Eigene Übung' }));
    const dialog = await screen.findByRole('dialog', { name: 'Eigene Übung anlegen' });
    // Hinweis bei gleichem Namen, Speichern bleibt möglich.
    await user.type(within(dialog).getByLabelText('Name'), 'bankdruecken mit langhantel');
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Es gibt schon eine Übung mit dem Namen „Bankdrücken mit Langhantel“.',
    );
    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Brustpresse Technogym');
    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText('Hauptmuskelgruppe'), 'Brust');
    await user.selectOptions(
      within(dialog).getByLabelText('Weitere Muskelgruppe (optional)'),
      'Trizeps',
    );
    await user.selectOptions(within(dialog).getByLabelText('Gerät'), 'Maschine');
    await user.click(within(dialog).getByRole('button', { name: 'Anlegen' }));
    await screen.findByRole(
      'heading',
      { level: 1, name: 'Brustpresse Technogym' },
      { timeout: 10_000 },
    );
    const [created] = await listCustomExercises(rt.db);
    expect(router.state.location.pathname).toBe(`/uebungen/${created?.id ?? ''}`);
    expect(screen.getByText('Eigene Übung')).toBeVisible();
    expect(screen.getByText('Brust')).toBeVisible();
    expect(screen.getByText('Trizeps')).toBeVisible();
    expect(await screen.findByText('Mit dieser Übung hast du noch nicht trainiert.')).toBeVisible();

    // Persönliche Angaben.
    await user.type(screen.getByLabelText('Notiz (z. B. Sitzhöhe, Griff)'), 'Sitz Stufe 4');
    await user.selectOptions(screen.getByLabelText('Standardpause'), '2:30 min');
    await user.selectOptions(screen.getByLabelText('Gewichtsschritt für − und +'), '1,25 kg');
    await user.type(screen.getByLabelText('Videolink (optional)'), 'http://example.org');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('mit https:// beginnt');
    await user.clear(screen.getByLabelText('Videolink (optional)'));
    await user.type(screen.getByLabelText('Videolink (optional)'), 'https://example.org/presse');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    const video = await screen.findByRole('link', { name: 'Video öffnen' });
    expect(video).toHaveAttribute('href', 'https://example.org/presse');
    expect(video).toHaveAttribute('target', '_blank');
    expect(video).toHaveAttribute('rel', 'noopener noreferrer');
    const prefs = await listExercisePrefs(rt.db);
    expect(prefs.get(created?.id ?? '')).toMatchObject({
      notes: 'Sitz Stufe 4',
      defaultRestSec: 150,
      weightStepKg: 1.25,
    });

    // Bearbeiten.
    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const edit = await screen.findByRole('dialog', { name: 'Eigene Übung bearbeiten' });
    await user.clear(within(edit).getByLabelText('Name'));
    await user.type(within(edit).getByLabelText('Name'), 'Brustpresse');
    await user.click(within(edit).getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('heading', { level: 1, name: 'Brustpresse' }, { timeout: 10_000 });

    // Archivieren: nicht mehr unter „Eigene Übungen“, aber im Archiv.
    await user.click(screen.getByRole('button', { name: 'Archivieren' }));
    await screen.findByText('Archiviert');
    await user.click(screen.getByRole('link', { name: 'Übungen' }));
    await screen.findByText('Archivierte eigene Übungen (1)', {}, { timeout: 10_000 });
    expect(screen.queryByRole('heading', { level: 2, name: 'Eigene Übungen' })).toBeNull();
    expect(screen.getByText('124 Übungen')).toBeInTheDocument();
  });

  it(
    'zeigt eigene Übungen zuerst und bietet bei leerer Suche das Anlegen an',
    { timeout: 30_000 },
    async () => {
      const user = userEvent.setup();
      await renderAt('/uebungen', 'Übungen');
      await user.type(screen.getByLabelText('Übungen suchen'), 'Zirkeltraining Spezial');
      await user.click(
        await screen.findByRole('button', {
          name: '„Zirkeltraining Spezial“ als eigene Übung anlegen',
        }),
      );
      const dialog = await screen.findByRole('dialog', { name: 'Eigene Übung anlegen' });
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Zirkeltraining Spezial');
      await user.selectOptions(within(dialog).getByLabelText('Erfassung'), 'Zeit und Distanz');
      await user.selectOptions(within(dialog).getByLabelText('Distanz in'), 'Metern');
      await user.click(within(dialog).getByRole('button', { name: 'Anlegen' }));
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Zirkeltraining Spezial' },
        { timeout: 10_000 },
      );
      expect((await listCustomExercises(rt.db))[0]).toMatchObject({
        trackingMode: 'time_distance',
        distanceUnit: 'm',
        category: 'cardio',
      });
      await user.click(screen.getByRole('link', { name: 'Übungen' }));
      await screen.findByRole('heading', { level: 1, name: 'Übungen' }, { timeout: 10_000 });
      await user.clear(screen.getByLabelText('Übungen suchen'));
      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Eigene Übungen');
      });
      const own = screen.getByRole('list', { name: 'Eigene Übungen' });
      expect(within(own).getByText('Eigene')).toBeVisible();
    },
  );

  it(
    'speichert Angaben zu einer Basisübung, ohne die Bibliothek zu ändern',
    { timeout: 30_000 },
    async () => {
      const user = userEvent.setup();
      await renderAt('/uebungen', 'Übungen');
      await user.click(screen.getByRole('link', { name: /^Bankdrücken mit Langhantel/ }));
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Bankdrücken mit Langhantel' },
        { timeout: 10_000 },
      );
      expect(screen.queryByRole('button', { name: 'Archivieren' })).toBeNull();
      await user.type(
        screen.getByLabelText('Notiz (z. B. Sitzhöhe, Griff)'),
        'Daumen um die Stange',
      );
      await user.click(screen.getByRole('button', { name: 'Speichern' }));
      await screen.findByText('Gespeichert');
      expect(await rt.db.exercises.count()).toBe(0);
      expect(await rt.db.exercisePrefs.count()).toBe(1);
    },
  );
});
