// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NameRest } from './NameRest';

afterEach(() => {
  cleanup();
});

describe('NameRest (D-377)', () => {
  it('ergänzt den sichtbaren Namen um den versteckten Rest, mit Leerzeichen', () => {
    render(
      <a href="/aufgabe">
        <span>Hafer Flocken</span>
        <NameRest full="Hafer Flocken bearbeiten" visible="Hafer Flocken" />
      </a>,
    );
    // Ohne das Leerzeichen außerhalb des versteckten Teils hieße der Link „Hafer Flockenbearbeiten“.
    expect(screen.getByRole('link', { name: 'Hafer Flocken bearbeiten' })).toBeTruthy();
    expect(screen.getByText('bearbeiten').className).toBe('sr-only');
    // Der sichtbare Name steht allein in seinem Element.
    expect(screen.getByText('Hafer Flocken', { exact: true }).tagName).toBe('SPAN');
  });

  it('setzt auch vor einen Rest mit Gedankenstrich genau ein Leerzeichen', () => {
    render(
      <a href="/aufgabe">
        <span>Lesen</span>
        <NameRest full="Lesen – Auswertung öffnen" visible="Lesen" />
      </a>,
    );
    expect(screen.getByRole('link', { name: 'Lesen – Auswertung öffnen' })).toBeTruthy();
    expect(screen.getByText('– Auswertung öffnen').className).toBe('sr-only');
  });

  it('nennt den ganzen Namen, wenn er nicht mit dem sichtbaren Text beginnt', () => {
    render(
      <a href="/aufgabe">
        <span>Lesen</span>
        <NameRest full="Aufgabe Lesen bearbeiten" visible="Lesen" />
      </a>,
    );
    expect(screen.getByRole('link', { name: 'Lesen Aufgabe Lesen bearbeiten' })).toBeTruthy();
  });

  it('rendert nichts, wenn kein Rest bleibt', () => {
    const { container } = render(<NameRest full="Lesen" visible="Lesen" />);
    expect(container.innerHTML).toBe('');
  });
});
