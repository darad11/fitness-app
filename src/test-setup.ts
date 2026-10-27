// Gemeinsame Testumgebung für Vitest (Node und jsdom).
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';

// Seiten, Dialoge und Karten laden nach (`lazy`). Läuft die ganze Suite parallel mit Coverage
// (CI), dauert das erste Laden eines Moduls oft länger als die Standardwartezeit von 1 s;
// `findBy…` und `waitFor` warten deshalb bis zu 5 s. Ein echter Fehler scheitert weiterhin.
configure({ asyncUtilTimeout: 5000 });

// jsdom kennt matchMedia nicht; Komponenten fragen damit Darstellung und Startart ab.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom kennt showModal und close des <dialog> nicht; im Browser (Safari ab 15.4) gibt es beide.
if (
  typeof HTMLDialogElement !== 'undefined' &&
  typeof HTMLDialogElement.prototype.showModal !== 'function'
) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

// jsdom kennt scrollTo und scrollBy an Elementen nicht; die Seite scrollt im Rahmen der App
// (D-384, `pageScroll.ts`). Im Browser gibt es beide.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollTo !== 'function') {
  const topOf = (options?: ScrollToOptions | number, y?: number) =>
    typeof options === 'object' ? options.top : y;
  Element.prototype.scrollTo = function scrollTo(
    this: Element,
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    const top = topOf(options, y);
    if (typeof top === 'number') this.scrollTop = top;
  };
  Element.prototype.scrollBy = function scrollBy(
    this: Element,
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    const top = topOf(options, y);
    if (typeof top === 'number') this.scrollTop += top;
  };
}

// Visuals der Übungen (D-397): Die Liste liegt in `public/uebungen/medien.json` und wird per
// `fetch` mit relativer Adresse geladen. In Tests kommt sie aus der Datei, ohne Netz; Tests, die
// bestimmte Visuals brauchen, ersetzen `fetch` selbst.
if (typeof window !== 'undefined') {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('/uebungen/')) {
      const media = (await import('../public/uebungen/medien.json')).default;
      return new Response(JSON.stringify(media), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return original(input, init);
  };
}
