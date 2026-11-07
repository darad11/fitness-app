// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdOwnPosition, PAGE_SCROLLER_ID } from '@/shared/ui/pageScroll';
import { ScrollManager } from './ScrollManager';

afterEach(() => {
  cleanup();
  for (const dialog of document.querySelectorAll('dialog')) dialog.remove();
});

/** Rahmen der Seite wie in `AppLayout`, darin ein Feld. */
function renderFrame() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <div id={PAGE_SCROLLER_ID}>
          <ScrollManager />
          <input aria-label="Feld" />
        </div>
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  const frame = document.getElementById(PAGE_SCROLLER_ID);
  if (!frame) throw new Error('Rahmen fehlt');
  return vi.spyOn(frame, 'scrollBy');
}

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('Scroll-Tasten ohne Fokus (Nachtrag zu D-384)', () => {
  it('scrollen den Rahmen, wenn der Fokus auf body liegt', () => {
    const scrollBy = renderFrame();
    // jsdom misst keine Höhe: Eine Bildschirmseite ist dann die Mindeststrecke von 40 px.
    expect(press(document.body, 'PageDown').defaultPrevented).toBe(true);
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 40, behavior: 'smooth' });
    expect(press(document.body, ' ', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(scrollBy).toHaveBeenLastCalledWith({ top: -40, behavior: 'smooth' });
    expect(press(document.body, 'ArrowDown').defaultPrevented).toBe(true);
    expect(scrollBy).toHaveBeenCalledTimes(3);
  });

  it('lassen Felder, Kürzel, andere Tasten und offene Dialoge in Ruhe', () => {
    const scrollBy = renderFrame();
    expect(press(screen.getByLabelText('Feld'), ' ').defaultPrevented).toBe(false);
    expect(press(document.body, 'PageDown', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press(document.body, 'a').defaultPrevented).toBe(false);
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    dialog.setAttribute('open', '');
    expect(press(document.body, 'PageDown').defaultPrevented).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

describe('Leseposition beim Größenwechsel (D-375, Nachtrag zu D-384)', () => {
  const nextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });

  /**
   * Rahmen mit einem Absatz auf der Leselinie. jsdom misst nichts: Lage des Absatzes und
   * `elementsFromPoint` sind nachgestellt. Mit `gap` liegt auf der Linie selbst nur der Rahmen
   * (Lücke zwischen Karten), der Absatz erst darunter. Gibt Rahmen und Setzer für die Oberkante
   * zurück.
   */
  async function renderReading(gap = false) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <div id={PAGE_SCROLLER_ID}>
            <ScrollManager />
            <main id="inhalt">
              <p>Absatz</p>
            </main>
          </div>
        ),
      },
    ]);
    render(<RouterProvider router={router} />);
    const frame = document.getElementById(PAGE_SCROLLER_ID);
    const main = document.getElementById('inhalt');
    if (!frame || !main) throw new Error('Rahmen fehlt');
    const text = screen.getByText('Absatz');
    let top = 100;
    vi.spyOn(text, 'getBoundingClientRect').mockImplementation(() =>
      DOMRect.fromRect({ x: 0, y: top, width: 300, height: 20 }),
    );
    vi.spyOn(main, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 400, height: 2000 }),
    );
    const line = window.innerHeight * 0.25;
    document.elementsFromPoint = (_x: number, y: number) =>
      gap && y <= line ? [main] : [text, main];
    // Gescrollt: Der Absatz auf der Leselinie wird zum Bezug.
    frame.scrollTop = 200;
    frame.dispatchEvent(new Event('scroll'));
    await nextFrame();
    return {
      frame,
      moveTo: (value: number) => {
        top = value;
      },
    };
  }

  afterEach(() => {
    Reflect.deleteProperty(document, 'elementsFromPoint');
  });

  it('gleicht aus, wenn sich der Absatz verschiebt', async () => {
    const { frame, moveTo } = await renderReading();
    moveTo(150);
    window.dispatchEvent(new Event('resize'));
    expect(frame.scrollTop).toBe(250);
  });

  it('nimmt bei einer Lücke auf der Leselinie das Element knapp darunter (D-504)', async () => {
    const { frame, moveTo } = await renderReading(true);
    moveTo(150);
    window.dispatchEvent(new Event('resize'));
    expect(frame.scrollTop).toBe(250);
  });

  it('lässt die Lage der Seite, die sie selbst hält (Player)', async () => {
    const { frame, moveTo } = await renderReading();
    const release = holdOwnPosition();
    try {
      moveTo(150);
      window.dispatchEvent(new Event('resize'));
      expect(frame.scrollTop).toBe(200);
    } finally {
      release();
    }
  });
});
