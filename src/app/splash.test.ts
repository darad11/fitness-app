import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';

/** Startbilder als Data-URL (nur für den Test; die App lädt sie nicht). */
const files = import.meta.glob<string>('../../public/splash/splash-*x*.png', {
  query: '?inline',
  import: 'default',
  eager: true,
});

interface StartupLink {
  width: number;
  height: number;
  ratio: number;
  orientation: string;
  href: string;
}

/** `<link rel="apple-touch-startup-image">` aus `index.html` mit den Werten der `media`-Abfrage. */
function startupLinks(): StartupLink[] {
  const pattern =
    /<link\s+rel="apple-touch-startup-image"\s+media="\(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\) and \(orientation: (portrait|landscape)\)"\s+href="([^"]+)"\s*\/>/g;
  return [...html.matchAll(pattern)].map((m) => ({
    width: Number(m[1]),
    height: Number(m[2]),
    ratio: Number(m[3]),
    orientation: m[4] ?? '',
    href: m[5] ?? '',
  }));
}

/** Breite und Höhe aus dem Kopf (IHDR) einer PNG-Datei. */
function pngSize(dataUrl: string): [number, number] {
  const head = atob(dataUrl.slice(dataUrl.indexOf(',') + 1, dataUrl.indexOf(',') + 33));
  const read = (at: number) =>
    ((head.charCodeAt(at) << 24) |
      (head.charCodeAt(at + 1) << 16) |
      (head.charCodeAt(at + 2) << 8) |
      head.charCodeAt(at + 3)) >>>
    0;
  return [read(16), read(20)];
}

const fileOf = (href: string) => `../../public${href}`;

describe('Startbilder für die installierte App (D-317)', () => {
  const links = startupLinks();

  it('jede Zeile in index.html ist vollständig lesbar', () => {
    expect(links.length).toBe(html.match(/apple-touch-startup-image/g)?.length);
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('jede Zeile zeigt auf ein Bild in genau der Größe des Bildschirms', () => {
    for (const link of links) {
      const [w, h] = [link.width * link.ratio, link.height * link.ratio];
      const [width, height] = link.orientation === 'portrait' ? [w, h] : [h, w];
      expect(link.href).toBe(`/splash/splash-${String(width)}x${String(height)}.png`);
      const data = files[fileOf(link.href)];
      expect(data, link.href).toBeDefined();
      expect(pngSize(data ?? '')).toEqual([width, height]);
    }
  });

  it('jedes Gerät hat ein Bild hochkant und eines quer, jedes Bild ist verlinkt', () => {
    const devices = new Set(
      links.map((l) => `${String(l.width)}x${String(l.height)}@${String(l.ratio)}`),
    );
    for (const device of devices) {
      const orientations = links
        .filter((l) => `${String(l.width)}x${String(l.height)}@${String(l.ratio)}` === device)
        .map((l) => l.orientation)
        .sort();
      expect(orientations, device).toEqual(['landscape', 'portrait']);
    }
    expect(new Set(links.map((l) => fileOf(l.href)))).toEqual(new Set(Object.keys(files)));
  });

  it('enthält die drei Bilder aus dem Markenpaket (iPhone, Pro Max, iPad)', () => {
    const hrefs = links.map((l) => l.href);
    for (const size of ['1170x2532', '1290x2796', '2048x2732']) {
      expect(hrefs).toContain(`/splash/splash-${size}.png`);
    }
  });
});
