// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it } from 'vitest';
import { exercisesRoutes } from '../routes';

afterEach(cleanup);

async function renderPage(path = '/uebungen') {
  const router = createMemoryRouter(exercisesRoutes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { level: 1, name: 'Übungen' });
  return router;
}

describe('Übungen (S-12, AK-EXL-01, AK-EXL-02)', () => {
  it('zeigt alle Übungen nach Gruppen mit Muskeln und Gerät', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Übungen' })).toBeInTheDocument();
    expect(screen.getByText('105 Übungen')).toBeInTheDocument();
    const groups = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(groups).toEqual([
      'Brust',
      'Rücken',
      'Schultern',
      'Bizeps und Unterarme',
      'Trizeps',
      'Rumpf',
      'Gesäß',
      'Oberschenkel vorne',
      'Oberschenkel hinten',
      'Waden, Adduktoren, Abduktoren',
      'Ganzkörper und Kondition',
    ]);
    expect(screen.getAllByRole('listitem')).toHaveLength(105);
    const chest = screen.getByRole('list', { name: 'Brust' });
    expect(within(chest).getAllByRole('listitem')[0]).toHaveTextContent(
      'Bankdrücken an der MultipresseBrust · Multipresse, Bank',
    );
    expect(
      screen.getByText('Oberschenkel vorne, Gesäß · Kurzhantel, Bank · je Seite'),
    ).toBeVisible();
  });

  it('sucht beim Tippen, merkt sich die Suche in der Adresse und leert sie wieder', async () => {
    const user = userEvent.setup();
    const router = await renderPage();
    await user.type(screen.getByLabelText('Übungen suchen'), 'bench press');
    const list = screen.getByRole('list', { name: /Treffer$/ });
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent(
      'Bankdrücken an der Multipresse',
    );
    expect(screen.getByRole('status')).toHaveTextContent(/^\d+ Treffer$/);
    expect(router.state.location.search).toBe('?q=bench+press');
    await user.click(screen.getByRole('button', { name: 'Suche leeren' }));
    expect(screen.getByLabelText('Übungen suchen')).toHaveValue('');
    expect(screen.getByLabelText('Übungen suchen')).toHaveFocus();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(11);
  });

  it('filtert nach Muskelgruppe und Gerät', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.selectOptions(screen.getByLabelText('Muskelgruppe'), 'Waden');
    await user.selectOptions(screen.getByLabelText('Gerät'), 'Maschine');
    const items = within(screen.getByRole('list', { name: '3 Treffer' })).getAllByRole('listitem');
    expect(items.map((item) => item.firstChild?.textContent)).toEqual([
      'Wadenheben an der Beinpresse',
      'Wadenheben sitzend',
      'Wadenheben stehend',
    ]);
  });

  it('verliert keinen Filter, wenn zwei Änderungen direkt aufeinander folgen', async () => {
    const router = await renderPage();
    fireEvent.change(screen.getByLabelText('Muskelgruppe'), { target: { value: 'calves' } });
    fireEvent.change(screen.getByLabelText('Gerät'), { target: { value: 'machine' } });
    await waitFor(() => {
      expect(router.state.location.search).toBe('?muskel=calves&geraet=machine');
    });
    expect(screen.getByLabelText('Muskelgruppe')).toHaveValue('calves');
    expect(screen.getByRole('status')).toHaveTextContent('3 Treffer');
  });

  it('übernimmt Suche und Filter aus der Adresse und ignoriert ungültige Werte', async () => {
    await renderPage('/uebungen?q=klimmz&muskel=lats&geraet=quatsch');
    expect(screen.getByLabelText('Übungen suchen')).toHaveValue('klimmz');
    expect(screen.getByLabelText('Muskelgruppe')).toHaveValue('lats');
    expect(screen.getByLabelText('Gerät')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('3 Treffer');
  });

  it('zeigt ohne Treffer einen Hinweis und setzt Suche und Filter zurück', async () => {
    const user = userEvent.setup();
    const router = await renderPage('/uebungen?q=zumba&muskel=calves');
    expect(screen.getByRole('heading', { name: 'Keine Übung gefunden' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 Treffer');
    await user.click(screen.getByRole('button', { name: 'Suche und Filter zurücksetzen' }));
    expect(router.state.location.search).toBe('');
    expect(screen.getAllByRole('listitem')).toHaveLength(105);
  });
});
