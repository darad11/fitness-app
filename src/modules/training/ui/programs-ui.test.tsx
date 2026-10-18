// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { findActiveSession } from '../data/sessionRepository';
import { trainingRoutes } from '../routes';

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
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent(
      'Ganzkörper A/BBeispielEinsteiger · Studio · 3 Tage pro Woche · 2 Trainingstage',
    );
    expect(cards[2]).toHaveTextContent('Fortgeschritten · Studio · 3–6 Tage pro Woche');
    expect(cards[3]).toHaveTextContent('Zuhause mit Kurzhanteln');
    expect(cards[3]).toHaveTextContent('Einsteiger · Zuhause');
    await user.click(within(cards[0]!).getByRole('link'));
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
