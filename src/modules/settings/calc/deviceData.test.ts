import { describe, expect, it } from 'vitest';
import script from '../../../../public/startflaeche.js?raw';
import {
  deviceRows,
  type DeviceSnapshot,
  type DeviceTexts,
  type StartPlacement,
} from './deviceData';

const TEXTS: DeviceTexts = {
  window: 'Fenster',
  screen: 'screen',
  available: 'screen.avail',
  outer: 'outer',
  position: 'screenX / screenY',
  startScreen: 'Startfläche: Bildschirm',
  startShift: 'Startfläche: Verschiebung',
  startSource: { bildschirm: 'aus screen.*', duo: 'Maße des Duo', fenster: 'mittig im Fenster' },
  viewport: 'visualViewport',
  viewportOffset: 'offsetTop / pageTop',
  safeArea: 'Sichere Bereiche',
  orientation: 'screen.orientation',
  pixelRatio: 'devicePixelRatio',
  displayMode: 'Anzeigemodus',
  standalone: 'App vom Home-Bildschirm',
  browser: 'Browser',
  unavailable: 'nicht verfügbar',
};

const num = (value: number) =>
  value.toLocaleString('de-AT', { maximumFractionDigits: 2, useGrouping: false });

/** Rechnung aus `public/startflaeche.js`, wie sie die Gerätedaten über `window` aufrufen. */
type StartLage = (messung: {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
}) => StartPlacement;

function loadStartLage(): StartLage {
  const fake = {
    innerWidth: 390,
    innerHeight: 844,
    screen: { width: 390, height: 844 },
    screenX: 0,
    screenY: 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as Window & { __formStartLage?: StartLage };
  const doc = {
    readyState: 'loading',
    documentElement: { style: { setProperty: () => undefined } },
    getElementById: () => null,
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- nur im Test: die Datei aus public/
  const execute = new Function('window', 'document', script) as (
    win: unknown,
    doc: unknown,
  ) => void;
  execute(fake, doc);
  const startLage = fake.__formStartLage;
  if (!startLage) throw new Error('__formStartLage fehlt');
  return startLage;
}

const startLage = loadStartLage();

/** Schnappschuss mit Rechnung der Startfläche, wie `DeviceData` ihn baut. */
function snapshot(values: Omit<DeviceSnapshot, 'start'>): DeviceSnapshot {
  return {
    ...values,
    start: startLage({
      fenster: { b: values.inner.width, h: values.inner.height },
      bildschirm: values.screen ? { b: values.screen.width, h: values.screen.height } : null,
    }),
  };
}

/**
 * Gemessen am iPhone Duo (Gerätedaten vom 27.10.2026, D-393), zugeklappt hoch. `screen.*` war in
 * D-388 noch nicht zu sehen; angenommen ist das äußere Display, 466 × 678.
 */
const DUO_ZU = snapshot({
  inner: { width: 382, height: 678 },
  screen: { width: 466, height: 678, availWidth: 466, availHeight: 678 },
  outer: { width: 382, height: 678 },
  position: { x: 0, y: 0 },
  viewport: { width: 382, height: 678, offsetTop: 0, pageTop: 0 },
  safeArea: { top: 0, right: 0, bottom: 34, left: 0 },
  orientation: { type: 'portrait-primary', angle: 0 },
  pixelRatio: 3,
  standalone: true,
});

describe('deviceRows (D-388, D-393)', () => {
  it('zeigt alle Werte in fester Reihenfolge, mit Bildschirm, Lage des Fensters und Startfläche', () => {
    expect(deviceRows(DUO_ZU, TEXTS, num)).toEqual([
      ['Fenster', '382 × 678'],
      ['screen', '466 × 678'],
      ['screen.avail', '466 × 678'],
      ['outer', '382 × 678'],
      ['screenX / screenY', '0 / 0'],
      ['visualViewport', '382 × 678'],
      ['offsetTop / pageTop', '0 / 0'],
      ['Sichere Bereiche', '0, 0, 34, 0'],
      ['screen.orientation', 'portrait-primary, 0°'],
      ['devicePixelRatio', '3'],
      ['Anzeigemodus', 'App vom Home-Bildschirm'],
      ['Startfläche: Bildschirm', '466 × 678, aus screen.*'],
      ['Startfläche: Verschiebung', '42, 0'],
    ]);
  });

  it('aufgeklappt hoch und quer: Startfläche nach den Maßen des Duo, wenn screen.* das äußere Display meldet', () => {
    const hoch = snapshot({
      ...DUO_ZU,
      inner: { width: 669, height: 869 },
      outer: { width: 669, height: 869 },
      viewport: { width: 669, height: 869, offsetTop: 0, pageTop: 0 },
      orientation: { type: 'portrait-secondary', angle: 180 },
    });
    const quer = snapshot({
      ...DUO_ZU,
      inner: { width: 867, height: 587 },
      outer: { width: 867, height: 587 },
      viewport: { width: 867, height: 587, offsetTop: 0, pageTop: 0 },
      orientation: { type: 'landscape-secondary', angle: 270 },
    });
    expect(deviceRows(hoch, TEXTS, num).slice(-2)).toEqual([
      ['Startfläche: Bildschirm', '669 × 951, Maße des Duo'],
      ['Startfläche: Verschiebung', '0, -41'],
    ]);
    expect(deviceRows(quer, TEXTS, num).slice(-2)).toEqual([
      ['Startfläche: Bildschirm', '951 × 669, Maße des Duo'],
      ['Startfläche: Verschiebung', '42, -41'],
    ]);
  });

  it('nennt Bruchteile von Pixeln und den Browser', () => {
    const rows = deviceRows(
      {
        ...DUO_ZU,
        viewport: { width: 382, height: 640.5, offsetTop: 37.25, pageTop: 1200 },
        standalone: false,
      },
      TEXTS,
      num,
    );
    expect(rows[5]).toEqual(['visualViewport', '382 × 640,5']);
    expect(rows[6]).toEqual(['offsetTop / pageTop', '37,25 / 1200']);
    expect(rows[10]).toEqual(['Anzeigemodus', 'Browser']);
  });

  it('meldet fehlende Schnittstellen und eine fehlende Rechnung als nicht verfügbar', () => {
    const rows = deviceRows(
      { ...DUO_ZU, screen: null, viewport: null, orientation: null, start: null },
      TEXTS,
      num,
    );
    for (const index of [1, 2, 5, 6, 8, 11, 12]) {
      expect(rows[index]?.[1], rows[index]?.[0]).toBe('nicht verfügbar');
    }
  });
});
