// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

afterEach(() => {
  cleanup();
});

function renderSheet() {
  const onClose = vi.fn();
  render(
    <Dialog open variant="sheet" title="Übung wählen" closeLabel="Schließen" onClose={onClose}>
      <p>Inhalt</p>
    </Dialog>,
  );
  // Kopf des Blatts mit Griff, Titel und „Schließen“: dort lässt es sich wegwischen.
  const head = screen.getByRole('heading', { name: 'Übung wählen' }).parentElement?.parentElement;
  if (!head) throw new Error('Kopf fehlt');
  const sheet = screen.getByRole('dialog', { name: 'Übung wählen' });
  return { onClose, head, sheet };
}

function swipe(head: HTMLElement, fromY: number, toY: number) {
  const pointer = { pointerId: 1, isPrimary: true, button: 0 };
  fireEvent.pointerDown(head, { ...pointer, clientY: fromY });
  fireEvent.pointerMove(head, { ...pointer, clientY: toY });
  fireEvent.pointerUp(head, { ...pointer, clientY: toY });
}

describe('Blatt (Sheet) der Marke FORM (D-314)', () => {
  it('schließt beim Wegwischen nach unten ab 80 px', () => {
    const { onClose, head } = renderSheet();
    swipe(head, 100, 260);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gleitet bei kurzer Bewegung zurück und bleibt offen', () => {
    const { onClose, head, sheet } = renderSheet();
    const pointer = { pointerId: 1, isPrimary: true, button: 0 };
    fireEvent.pointerDown(head, { ...pointer, clientY: 100 });
    fireEvent.pointerMove(head, { ...pointer, clientY: 150 });
    expect(sheet.style.transform).toBe('translateY(50px)');
    fireEvent.pointerUp(head, { ...pointer, clientY: 150 });
    expect(onClose).not.toHaveBeenCalled();
    expect(sheet.style.transform).toBe('');
  });

  it('wischt nicht nach oben und lässt einen Tipp auf „Schließen“ als Klick durch', () => {
    const { onClose, head } = renderSheet();
    swipe(head, 300, 100);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('zeigt den Griff nur am Blatt, nicht an der Rückfrage', () => {
    const { sheet } = renderSheet();
    expect(sheet.querySelector('span[aria-hidden="true"].rounded-pill')).not.toBeNull();
    cleanup();
    render(
      <Dialog open title="Wirklich löschen?" closeLabel="Schließen" onClose={vi.fn()}>
        <p>Text</p>
      </Dialog>,
    );
    const confirm = screen.getByRole('dialog', { name: 'Wirklich löschen?' });
    expect(confirm.querySelector('span[aria-hidden="true"].rounded-pill')).toBeNull();
  });
});
