import { describe, expect, it } from 'vitest';
import { deviceRows, type DeviceSnapshot, type DeviceTexts } from './deviceData';

const TEXTS: DeviceTexts = {
  window: 'Fenster',
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

const DUO_ZU: DeviceSnapshot = {
  inner: { width: 466, height: 678 },
  viewport: { width: 466, height: 678, offsetTop: 0, pageTop: 0 },
  safeArea: { top: 0, right: 84, bottom: 34, left: 0 },
  orientation: { type: 'portrait-primary', angle: 0 },
  pixelRatio: 3,
  standalone: true,
};

describe('deviceRows (D-388)', () => {
  it('zeigt alle Werte in fester Reihenfolge', () => {
    expect(deviceRows(DUO_ZU, TEXTS, num)).toEqual([
      ['Fenster', '466 × 678'],
      ['visualViewport', '466 × 678'],
      ['offsetTop / pageTop', '0 / 0'],
      ['Sichere Bereiche', '0, 84, 34, 0'],
      ['screen.orientation', 'portrait-primary, 0°'],
      ['devicePixelRatio', '3'],
      ['Anzeigemodus', 'App vom Home-Bildschirm'],
    ]);
  });

  it('nennt Bruchteile von Pixeln und den Browser', () => {
    const rows = deviceRows(
      {
        ...DUO_ZU,
        viewport: { width: 466, height: 640.5, offsetTop: 37.25, pageTop: 1200 },
        standalone: false,
      },
      TEXTS,
      num,
    );
    expect(rows[1]).toEqual(['visualViewport', '466 × 640,5']);
    expect(rows[2]).toEqual(['offsetTop / pageTop', '37,25 / 1200']);
    expect(rows[6]).toEqual(['Anzeigemodus', 'Browser']);
  });

  it('meldet fehlende Schnittstellen als nicht verfügbar', () => {
    const rows = deviceRows({ ...DUO_ZU, viewport: null, orientation: null }, TEXTS, num);
    expect(rows[1]?.[1]).toBe('nicht verfügbar');
    expect(rows[2]?.[1]).toBe('nicht verfügbar');
    expect(rows[4]?.[1]).toBe('nicht verfügbar');
  });
});
