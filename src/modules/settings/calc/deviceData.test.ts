import { describe, expect, it } from 'vitest';
import script from '../../../../public/startflaeche.js?raw';
import {
  deviceRows,
  type DeviceSnapshot,
  type DeviceTexts,
  type StartLog,
  type StartMeasurement,
  type StartPlacement,
} from './deviceData';

const TEXTS: DeviceTexts = {
  window: 'Fenster',
  layout: 'Layout',
  screen: 'screen',
  available: 'screen.avail',
  outer: 'outer',
  position: 'screenX / screenY',
  startScreen: 'Startfläche: Bildschirm',
  startShift: 'Startfläche: Verschiebung',
  startSource: {
    bildschirm: 'aus screen.*',
    duo: 'Maße des Duo',
    fenster: 'mittig im Fenster',
    widerspruch: 'Widerspruch',
  },
  startFirst: 'Start: zuerst',
  startChanges: 'Start: Änderungen',
  startShown: 'Start: Logo',
  startNoChanges: 'keine',
  startNotShown: 'nicht gezeigt',
  startReason: { stabil: 'stabil', zeit: 'nach der Wartezeit' },
  startLayout: (size) => `Layout ${size}`,
  startScreenOf: (size) => `Bildschirm ${size}`,
  startAfter: (ms) => `nach ${ms} ms`,
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

/** Rechnung aus `public/startflaeche.js`, wie die Gerätedaten sie über `window` aufrufen. */
type StartLage = (messung: {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
  ausrichtung: 'hoch' | 'quer' | null;
}) => StartPlacement;

/** Führt die Datei aus public/ mit einem ruhenden Fenster aus und gibt die Rechnung zurück. */
function loadStartLage(): StartLage {
  const fake = {
    innerWidth: 390,
    innerHeight: 844,
    screen: { width: 390, height: 844 },
    performance: { now: () => 0 },
    setTimeout: () => 0,
    clearTimeout: () => undefined,
    requestAnimationFrame: () => 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as Window & { __formStartLage?: StartLage };
  const doc = {
    readyState: 'loading',
    documentElement: {
      clientWidth: 390,
      clientHeight: 844,
      style: { setProperty: () => undefined },
      setAttribute: () => undefined,
      removeAttribute: () => undefined,
    },
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
  const type = values.orientation?.type ?? '';
  return {
    ...values,
    start: startLage({
      fenster: { b: values.layout.width, h: values.layout.height },
      bildschirm: values.screen ? { b: values.screen.width, h: values.screen.height } : null,
      ausrichtung: values.orientation ? (type.startsWith('landscape') ? 'quer' : 'hoch') : null,
    }),
  };
}

const messung = (
  t: number,
  b: number,
  h: number,
  typ: string | null,
  winkel: number | null,
  layout = { b, h },
): StartMeasurement => ({
  t,
  fenster: layout,
  innen: { b, h },
  bildschirm: { b: 466, h: 678 },
  ausrichtung: typ ? (typ.startsWith('landscape') ? 'quer' : 'hoch') : null,
  typ,
  winkel,
});

/**
 * Start wie im Bild vom vierten Start (D-394): zuerst 466 × 669 (Breite zugeklappt, Höhe
 * aufgeklappt quer), dann 867 × 669; das Logo nach zwei gleichen Bildern.
 */
const LOG: StartLog = {
  erste: messung(12, 466, 669, 'landscape-secondary', 270),
  aenderungen: [messung(31, 867, 669, 'landscape-secondary', 270)],
  sichtbar: { t: 48, grund: 'stabil' },
};

/**
 * Gemessen am iPhone Duo (Gerätedaten vom 27.10.2026, D-393), zugeklappt hoch. `screen.*` war in
 * D-388 noch nicht zu sehen; angenommen ist das äußere Display, 466 × 678.
 */
const DUO_ZU = snapshot({
  inner: { width: 382, height: 678 },
  layout: { width: 382, height: 678 },
  screen: { width: 466, height: 678, availWidth: 466, availHeight: 678 },
  outer: { width: 382, height: 678 },
  position: { x: 0, y: 0 },
  viewport: { width: 382, height: 678, offsetTop: 0, pageTop: 0 },
  safeArea: { top: 0, right: 0, bottom: 34, left: 0 },
  orientation: { type: 'portrait-primary', angle: 0 },
  pixelRatio: 3,
  standalone: true,
  startLog: LOG,
});

describe('deviceRows (D-388, D-393, D-394)', () => {
  it('zeigt alle Werte in fester Reihenfolge, mit Layout, Bildschirm, Startfläche und Protokoll des Starts', () => {
    expect(deviceRows(DUO_ZU, TEXTS, num)).toEqual([
      ['Fenster', '382 × 678'],
      ['Layout', '382 × 678'],
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
      ['Start: zuerst', '466 × 669, Bildschirm 466 × 678, landscape-secondary, 270°, nach 12 ms'],
      [
        'Start: Änderungen',
        'nach 31 ms: 867 × 669, Bildschirm 466 × 678, landscape-secondary, 270°',
      ],
      ['Start: Logo', 'nach 48 ms, stabil'],
    ]);
  });

  it('aufgeklappt hoch und quer: Startfläche nach den Maßen des Duo, wenn screen.* das äußere Display meldet', () => {
    const hoch = snapshot({
      ...DUO_ZU,
      inner: { width: 669, height: 869 },
      layout: { width: 669, height: 869 },
      outer: { width: 669, height: 869 },
      viewport: { width: 669, height: 869, offsetTop: 0, pageTop: 0 },
      orientation: { type: 'portrait-secondary', angle: 180 },
    });
    const quer = snapshot({
      ...DUO_ZU,
      inner: { width: 867, height: 587 },
      layout: { width: 867, height: 587 },
      outer: { width: 867, height: 587 },
      viewport: { width: 867, height: 587, offsetTop: 0, pageTop: 0 },
      orientation: { type: 'landscape-secondary', angle: 270 },
    });
    expect(deviceRows(hoch, TEXTS, num).slice(12, 14)).toEqual([
      ['Startfläche: Bildschirm', '669 × 951, Maße des Duo'],
      ['Startfläche: Verschiebung', '0, -41'],
    ]);
    expect(deviceRows(quer, TEXTS, num).slice(12, 14)).toEqual([
      ['Startfläche: Bildschirm', '951 × 669, Maße des Duo'],
      ['Startfläche: Verschiebung', '42, -41'],
    ]);
  });

  it('Werte, die sich widersprechen (466 × 669 bei Ausrichtung quer), zählen nicht', () => {
    const rows = deviceRows(
      snapshot({
        ...DUO_ZU,
        inner: { width: 466, height: 669 },
        layout: { width: 466, height: 669 },
        orientation: { type: 'landscape-secondary', angle: 270 },
      }),
      TEXTS,
      num,
    );
    expect(rows.slice(12, 14)).toEqual([
      ['Startfläche: Bildschirm', '466 × 669, Widerspruch'],
      ['Startfläche: Verschiebung', '0, 0'],
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
    expect(rows[6]).toEqual(['visualViewport', '382 × 640,5']);
    expect(rows[7]).toEqual(['offsetTop / pageTop', '37,25 / 1200']);
    expect(rows[11]).toEqual(['Anzeigemodus', 'Browser']);
  });

  it('Protokoll: Layout, wenn es vom Fenster abweicht, ohne Änderungen, Logo nach der Wartezeit, Winkel ohne Typ', () => {
    const rows = deviceRows(
      {
        ...DUO_ZU,
        startLog: {
          erste: messung(3, 466, 678, null, 90, { b: 867, h: 669 }),
          aenderungen: [],
          sichtbar: { t: 300, grund: 'zeit' },
        },
      },
      TEXTS,
      num,
    );
    expect(rows.slice(14)).toEqual([
      ['Start: zuerst', '466 × 678 (Layout 867 × 669), Bildschirm 466 × 678, 90°, nach 3 ms'],
      ['Start: Änderungen', 'keine'],
      ['Start: Logo', 'nach 300 ms, nach der Wartezeit'],
    ]);
    const hidden = deviceRows(
      { ...DUO_ZU, startLog: { erste: null, aenderungen: [], sichtbar: null } },
      TEXTS,
      num,
    );
    expect(hidden.slice(14)).toEqual([
      ['Start: zuerst', 'nicht verfügbar'],
      ['Start: Änderungen', 'keine'],
      ['Start: Logo', 'nicht gezeigt'],
    ]);
  });

  it('meldet fehlende Schnittstellen, eine fehlende Rechnung und ein fehlendes Protokoll als nicht verfügbar', () => {
    const rows = deviceRows(
      {
        ...DUO_ZU,
        screen: null,
        viewport: null,
        orientation: null,
        start: null,
        startLog: null,
      },
      TEXTS,
      num,
    );
    for (const index of [2, 3, 6, 7, 9, 12, 13, 14, 15, 16]) {
      expect(rows[index]?.[1], rows[index]?.[0]).toBe('nicht verfügbar');
    }
  });
});
