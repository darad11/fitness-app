// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { listBodyWeights } from '../data/bodyWeightRepository';
import { bodyRoutes } from '../routes';
import { addBodyWeight } from '../service/bodyWeightService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

async function renderPage() {
  const router = createMemoryRouter(bodyRoutes, { initialEntries: ['/fortschritt/gewicht'] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  await screen.findByRole('heading', { level: 1, name: 'Körpergewicht' });
  return router;
}

const daysAgo = (days: number, hour = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

describe('Körpergewicht (S-28, AK-BW-01 bis AK-BW-06)', () => {
  it('zeigt den Leerzustand und erfasst einen Eintrag über das Sheet', async () => {
    const user = userEvent.setup();
    await renderPage();
    expect(await screen.findByText('Noch kein Gewicht erfasst')).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: 'Gewicht erfassen' })[0]!);
    const sheet = await screen.findByRole('dialog', { name: 'Gewicht erfassen' });
    await user.type(within(sheet).getByLabelText('Gewicht in kg'), '80,26');
    await user.type(within(sheet).getByLabelText('Notiz (optional)'), 'nüchtern');
    await user.click(within(sheet).getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    const saved = await listBodyWeights(rt.db);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ weightKg: 80.3, note: 'nüchtern' });
    expect((await screen.findAllByText('80,3', { exact: false })).length).toBeGreaterThan(0);
  });

  it('lehnt ungültige Werte ab und warnt bei einem Sprung (AK-BW-01, AK-BW-02)', async () => {
    const user = userEvent.setup();
    await addBodyWeight(rt, { weightKg: 80, measuredAt: daysAgo(1) });
    await renderPage();
    await user.click(await screen.findByRole('button', { name: 'Gewicht erfassen' }));
    const sheet = await screen.findByRole('dialog', { name: 'Gewicht erfassen' });
    const field = within(sheet).getByLabelText('Gewicht in kg');
    await user.type(field, '19');
    await user.click(within(sheet).getByRole('button', { name: 'Speichern' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent('Gewicht von 20 bis 400 kg');
    await user.clear(field);
    await user.type(field, '84');
    expect(await within(sheet).findByRole('status')).toHaveTextContent('Bitte prüfen');
    await user.clear(field);
    await user.type(field, '81');
    await waitFor(() => {
      expect(within(sheet).queryByRole('status')).toBeNull();
    });
    expect(await listBodyWeights(rt.db)).toHaveLength(1);
  });

  it('listet nach Monaten mit Differenz, bearbeitet und löscht mit Rückgängig (AK-BW-03, AK-BW-04)', async () => {
    const user = userEvent.setup();
    const older = await addBodyWeight(rt, { weightKg: 82, measuredAt: daysAgo(40) });
    const newer = await addBodyWeight(rt, { weightKg: 81.2, measuredAt: daysAgo(2) });
    await renderPage();
    const list = await screen.findByRole('region', { name: 'Alle Einträge' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('81,2 kg');
    expect(buttons[0]).toHaveTextContent('-0,8');
    expect(buttons[1]).toHaveTextContent('82,0 kg');
    expect(within(list).getAllByRole('heading', { level: 3 })).toHaveLength(2);

    await user.click(buttons[0]!);
    const sheet = await screen.findByRole('dialog', { name: 'Eintrag bearbeiten' });
    expect(within(sheet).getByLabelText('Gewicht in kg')).toHaveValue('81,2');
    const field = within(sheet).getByLabelText('Gewicht in kg');
    await user.clear(field);
    await user.type(field, '81,4');
    await user.click(within(sheet).getByRole('button', { name: 'Speichern' }));
    await waitFor(async () => {
      expect((await listBodyWeights(rt.db)).find((e) => e.id === newer.id)?.weightKg).toBe(81.4);
    });

    await user.click(within(list).getAllByRole('button')[1]!);
    const edit = await screen.findByRole('dialog', { name: 'Eintrag bearbeiten' });
    await user.click(within(edit).getByRole('button', { name: 'Eintrag löschen' }));
    expect(await screen.findByText('Eintrag gelöscht')).toBeVisible();
    await waitFor(async () => {
      expect((await listBodyWeights(rt.db)).map((e) => e.id)).toEqual([newer.id]);
    });
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () => {
      expect((await listBodyWeights(rt.db)).map((e) => e.id)).toEqual([newer.id, older.id]);
    });
  });

  it('bietet Zeitraum, Tabellenansicht mit Durchschnitt und Veränderung (AK-BW-05, AK-BW-06)', async () => {
    const user = userEvent.setup();
    await addBodyWeight(rt, { weightKg: 82, measuredAt: daysAgo(20) });
    await addBodyWeight(rt, { weightKg: 81.5, measuredAt: daysAgo(10) });
    await addBodyWeight(rt, { weightKg: 81.1, measuredAt: daysAgo(6) });
    await addBodyWeight(rt, { weightKg: 80.6, measuredAt: daysAgo(1) });
    await renderPage();
    expect(await screen.findByText('Veränderung 90 Tage')).toBeVisible();
    expect(screen.getByText('-1,4')).toBeVisible();
    await user.click(screen.getByRole('switch', { name: 'Als Tabelle' }));
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(5);
    expect(rows[1]).toHaveTextContent('82,0 kg');
    expect(rows[1]).toHaveTextContent('82,0 kg82,0 kg');
    expect(rows[4]).toHaveTextContent('80,6 kg');
    expect(rows[4]).toHaveTextContent(/80,[6-9] kg$/);
    await user.click(screen.getByRole('radio', { name: '30 Tage' }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(5);
    await user.click(screen.getByRole('radio', { name: 'Gesamt' }));
    expect(screen.getByText('Veränderung Gesamt')).toBeVisible();
  });
});
