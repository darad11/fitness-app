// Gemeinsame Testumgebung für Vitest (Node und jsdom).
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

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
