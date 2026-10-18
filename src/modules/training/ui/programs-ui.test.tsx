// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it } from 'vitest';
import { trainingRoutes } from '../routes';

afterEach(cleanup);

async function renderAt(path: string, heading: string) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
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
      'Kniebeuge mit Langhantel2 Aufwärmsätze, 3 Sätze · 6–8 Wdh. · Pause 2:30 min',
      'Bankdrücken mit Langhantel1 Aufwärmsatz, 3 Sätze · 6–8 Wdh. · Pause 2:30 min',
      'Rudern am Kabel, sitzend3 Sätze · 8–12 Wdh. · Pause 2:00 min',
      'Beinbeuger liegend2 Sätze · 10–12 Wdh. · Pause 1:15 min',
      'Unterarmstütz (Plank)3 Sätze · 30–45 s · Pause 1:00 min',
    ]);
    const dayB = screen.getByRole('region', { name: 'Tag B' });
    expect(within(dayB).getByText('2 Sätze je Seite · 20–40 s · Pause 1:00 min')).toBeVisible();
    // Keine Bearbeitung: Beispielvorlagen sind schreibgeschützt.
    expect(screen.queryByRole('button')).toBeNull();
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
});
