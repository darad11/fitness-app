import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import template from '../../public/splash/splash.svg?raw';

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

interface Pixels {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
}

/** PNG (8 Bit, RGB oder RGBA, ohne Zeilensprung) in Pixel, mit den Mitteln der Laufzeit. */
async function decodePng(dataUrl: string): Promise<Pixels> {
  const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (c) =>
    c.charCodeAt(0),
  );
  const view = new DataView(bytes.buffer);
  let width = 0;
  let height = 0;
  let channels = 0;
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (let p = 8; p < bytes.length;) {
    const length = view.getUint32(p);
    const type = String.fromCharCode(...bytes.subarray(p + 4, p + 8));
    if (type === 'IHDR') {
      width = view.getUint32(p + 8);
      height = view.getUint32(p + 12);
      expect(bytes[p + 16], 'Bittiefe').toBe(8);
      expect(bytes[p + 20], 'ohne Zeilensprung').toBe(0);
      channels = bytes[p + 17] === 6 ? 4 : 3;
      expect([2, 6]).toContain(bytes[p + 17]);
    } else if (type === 'IDAT') {
      chunks.push(bytes.slice(p + 8, p + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    p += 12 + length;
  }
  const stream = new Blob(chunks).stream().pipeThrough(new DecompressionStream('deflate'));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());
  const stride = width * channels;
  const data = new Uint8Array(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const from = y * (stride + 1) + 1;
    const to = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? (data[to + x - channels] ?? 0) : 0;
      const b = y > 0 ? (data[to - stride + x] ?? 0) : 0;
      const c = x >= channels && y > 0 ? (data[to - stride + x - channels] ?? 0) : 0;
      let value = raw[from + x] ?? 0;
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      data[to + x] = value & 255;
    }
  }
  return { width, height, channels, data };
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Ausmaße von Symbol (Lime), Wortmarke (Weiß) und Claim (Grau unten) in Pixeln. Ein Pixel zählt,
 * wenn er mindestens halb so kräftig ist wie die Farbe auf der Nacht-Fläche; so liegt die Kante
 * auf eine Viertelpixel genau dort, wo auch die Regel sie setzt.
 */
function measure({ width, height, channels, data }: Pixels) {
  const empty = (): Box => ({ left: Infinity, top: Infinity, right: -1, bottom: -1 });
  const boxes = { symbol: empty(), wordmark: empty(), claim: empty() };
  const add = (box: Box, x: number, y: number) => {
    box.left = Math.min(box.left, x);
    box.right = Math.max(box.right, x + 1);
    box.top = Math.min(box.top, y);
    box.bottom = Math.max(box.bottom, y + 1);
  };
  const split = 0.72 * height;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const [r, g, b] = [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
      if (y < split) {
        if (g > 136 && b < 120) add(boxes.symbol, x, y);
        else if (b > 140 && r > 140) add(boxes.wordmark, x, y);
      } else if ((r + g + b) / 3 > 99) {
        add(boxes.claim, x, y);
      }
    }
  }
  return boxes;
}

function pixel({ width, channels, data }: Pixels, x: number, y: number) {
  const i = (Math.round(y) * width + Math.round(x)) * channels;
  return [data[i], data[i + 1], data[i + 2]];
}

/** Regel C3 aus dem Auftrag F5 Abschnitt 4.5 (`tools/splash.mjs`). */
const RULE = {
  wordWidth: 0.36,
  symbolHeight: 2.28,
  gap: 0.82,
  centerY: 0.47,
  claimSize: 0.0325,
  baseline: 58,
  /** „FORM YOURSELF.“ in Inter SemiBold mit 0,21 em Laufweite: Breite und Höhe der Tinte je em. */
  claimWidth: 11.283,
  claimHeight: 0.7485,
};

describe('Startbilder für die installierte App (D-317, D-325)', () => {
  const links = startupLinks();

  it('jede Zeile in index.html ist vollständig lesbar', () => {
    expect(links.length).toBe(html.match(/apple-touch-startup-image/g)?.length);
    expect(links.length).toBe(40);
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

  // Die drei Größen des Markenpakets (iPhone, Pro Max, iPad) und ein Bild quer.
  for (const size of ['1170x2532', '1290x2796', '2048x2732', '2532x1170']) {
    it(`${size} folgt der Regel C3: Logo vertikal mittig bei 47 %, „FORM YOURSELF.“ 58 pt über dem Rand`, async () => {
      const link = links.find((l) => l.href === `/splash/splash-${size}.png`);
      expect(link).toBeDefined();
      const dpr = link?.ratio ?? 1;
      const image = await decodePng(files[fileOf(link?.href ?? '')] ?? '');
      const { width, height } = image;
      const short = Math.min(width, height);
      const { symbol, wordmark, claim } = measure(image);
      const w = (box: Box) => box.right - box.left;
      const h = (box: Box) => box.bottom - box.top;
      const centerX = (box: Box) => (box.left + box.right) / 2;

      // Fläche Nacht, Symbol Lime, Wortmarke Weiß, Claim Grau.
      expect(pixel(image, 2, 2)).toEqual([12, 18, 25]);
      expect(pixel(image, width - 3, height - 3)).toEqual([12, 18, 25]);
      expect(pixel(image, centerX(symbol), symbol.top + h(symbol) * 0.08)).toEqual([199, 255, 70]);
      // Senkrechter Strich des F in der Wortmarke.
      expect(
        pixel(image, wordmark.left + w(wordmark) * 0.012, wordmark.top + h(wordmark) / 2),
      ).toEqual([255, 255, 255]);

      // Logo: Wortmarke 36 % der kurzen Seite, F 2,28 Versalhöhen hoch, Abstand 0,82.
      const cap = h(wordmark);
      expect(Math.abs(w(wordmark) - RULE.wordWidth * short)).toBeLessThanOrEqual(2);
      expect(Math.abs(h(symbol) - RULE.symbolHeight * cap)).toBeLessThanOrEqual(3);
      expect(Math.abs(wordmark.top - symbol.bottom - RULE.gap * cap)).toBeLessThanOrEqual(2.5);
      expect(Math.abs(centerX(symbol) - width / 2)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(centerX(wordmark) - width / 2)).toBeLessThanOrEqual(1.5);
      expect(
        Math.abs((symbol.top + wordmark.bottom) / 2 - RULE.centerY * height),
      ).toBeLessThanOrEqual(1.5);

      // Claim: 3,25 % der kurzen Seite groß, mittig, Grundlinie 58 pt über dem unteren Rand.
      const fontSize = RULE.claimSize * short;
      const baseline = height - RULE.baseline * dpr;
      expect(Math.abs(centerX(claim) - width / 2)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(w(claim) - RULE.claimWidth * fontSize)).toBeLessThanOrEqual(3);
      expect(Math.abs(h(claim) - RULE.claimHeight * fontSize)).toBeLessThanOrEqual(2);
      expect(claim.bottom).toBeGreaterThanOrEqual(baseline - 1);
      expect(claim.bottom).toBeLessThanOrEqual(baseline + 0.02 * fontSize + 1);
    });
  }
});

/** Pfade (`d`) einer Gruppe nach ihrer id. */
function groupPaths(source: string, id: string): string[] {
  const group = new RegExp(`<g id="${id}"([^>]*)>([\\s\\S]*?)</g>`).exec(source);
  expect(group, id).not.toBeNull();
  return [...(group?.[2] ?? '').matchAll(/ d="([^"]+)"/g)].map((m) => m[1] ?? '');
}

function groupAttribute(source: string, id: string, name: string): string {
  const group = new RegExp(`<g id="${id}"([^>]*)>`).exec(source);
  return new RegExp(`${name}="([^"]+)"`).exec(group?.[1] ?? '')?.[1] ?? '';
}

describe('Vorlage splash.svg und Startfläche in index.html (D-325)', () => {
  const surface = /<div id="startflaeche"[\s\S]*?<\/div>/.exec(html)?.[0] ?? '';
  const style = /#startflaeche\{display:none\}[^<]*/.exec(html)?.[0] ?? '';

  it('die Vorlage hat die Gruppen symbol, wortmarke und claim in den Farben der Logo-Dateien', () => {
    expect(template).toContain('viewBox="0 0 390 844"');
    expect(template).toContain('<rect id="hintergrund" width="390" height="844" fill="#0C1219"/>');
    expect(groupAttribute(template, 'symbol', 'fill')).toBe('#C7FF46');
    expect(groupAttribute(template, 'wortmarke', 'fill')).toBe('#FFFFFF');
    expect(groupAttribute(template, 'claim', 'fill')).toBe('#AAB2BE');
    expect(groupPaths(template, 'symbol')).toHaveLength(2);
    expect(groupPaths(template, 'wortmarke').length).toBeGreaterThanOrEqual(4);
    expect(groupPaths(template, 'claim')).toHaveLength(1);
  });

  it('die Startfläche nutzt dieselben Pfade und Lagen wie die Vorlage', () => {
    expect(surface).toContain('aria-hidden="true"');
    expect(groupPaths(surface, 'start-symbol')).toEqual(groupPaths(template, 'symbol'));
    expect(groupPaths(surface, 'start-wortmarke')).toEqual(groupPaths(template, 'wortmarke'));
    expect(groupPaths(surface, 'start-claim')).toEqual(groupPaths(template, 'claim'));
    for (const [inner, outer] of [
      ['start-symbol', 'symbol'],
      ['start-wortmarke', 'wortmarke'],
    ] as const) {
      expect(groupAttribute(surface, inner, 'transform')).toBe(
        groupAttribute(template, outer, 'transform'),
      );
      expect(groupAttribute(surface, inner, 'fill')).toBe(groupAttribute(template, outer, 'fill'));
    }
    expect(groupAttribute(surface, 'start-claim', 'fill')).toBe('#AAB2BE');
    // Keine doppelten ids im Dokument durch die eingebetteten Pfade.
    expect(surface).not.toMatch(/<path id=/);
  });

  it('die Startfläche setzt die Regel in Prozent des Bildschirms und zeigt sich nur in der installierten App', () => {
    expect(style).toContain('@media (display-mode:standalone){#startflaeche{display:block;');
    expect(style).toContain('background:#0C1219');
    expect(style).toContain('#startflaeche.weg{opacity:0;transition:opacity 250ms ease-out}');
    expect(style).toContain(
      '@media (prefers-reduced-motion:reduce){#startflaeche.weg{transition:none}}',
    );
    expect(style).toContain('@media (orientation:landscape){#startflaeche .hoch{display:none}}');
    expect(style).toContain('@media (orientation:portrait){#startflaeche .quer{display:none}}');
    // Grundlinie 58 pt über dem Rand (abzüglich des winzigen Überhangs von O und S).
    expect(style).toMatch(/\.start-unten\{transform:translateY\(calc\(0\.0\d+vmin - 58px\)\)\}/);

    const viewBox = (id: string) =>
      (new RegExp(`<symbol id="${id}" viewBox="([^"]+)"`).exec(surface)?.[1] ?? '')
        .split(' ')
        .map(Number);
    /** Lage einer `<use>`-Ansicht in Prozent des Bildschirms (x, y, width, height). */
    const use = (orientation: string, href: string): Record<string, number> => {
      const match = new RegExp(`<use class="${orientation}" href="#${href}" ([^>]*)/>`).exec(
        surface,
      );
      const values: Record<string, number> = {};
      for (const a of (match?.[1] ?? '').matchAll(/(\w+)="([-\d.]+)%?"/g)) {
        values[a[1] ?? ''] = Number(a[2]);
      }
      return values;
    };
    const near = (a: number | undefined, b: number) => {
      expect(Math.abs((a ?? NaN) - b)).toBeLessThan(0.001);
    };
    const [, , logoW = 1, logoH = 1] = viewBox('start-logo');
    const logoHeight = RULE.wordWidth * 100 * (logoH / logoW);
    // Hochkant ist die kurze Seite die Breite: Logo 36 % breit, Mitte bei 47 % der Höhe.
    const logoPortrait = use('hoch', 'start-logo');
    near(logoPortrait.x, 50 - RULE.wordWidth * 50);
    near(logoPortrait.width, RULE.wordWidth * 100);
    near(logoPortrait.y, RULE.centerY * 100 - 50);
    // Quer ist die kurze Seite die Höhe: Logo so hoch wie 36 % der Höhe es verlangen.
    const logoLandscape = use('quer', 'start-logo');
    near(logoLandscape.height, Number(logoHeight.toFixed(4)));
    near(logoLandscape.y, Number((RULE.centerY * 100 - logoHeight / 2).toFixed(4)));
    // Claim: 3,25 % der kurzen Seite je em, mittig, am unteren Rand ausgerichtet.
    const [, , claimW = 1, claimH = 1] = viewBox('start-claim-zeichen');
    const claimWidth = RULE.claimSize * 100 * (claimW / 1000);
    expect(Math.abs(claimWidth - RULE.claimSize * 100 * RULE.claimWidth)).toBeLessThan(0.05);
    const claimPortrait = use('hoch', 'start-claim-zeichen');
    near(claimPortrait.width, Number(claimWidth.toFixed(4)));
    near(claimPortrait.x, Number((50 - claimWidth / 2).toFixed(4)));
    const claimLandscape = use('quer', 'start-claim-zeichen');
    const claimHeight = RULE.claimSize * 100 * (claimH / 1000);
    near(claimLandscape.height, Number(claimHeight.toFixed(4)));
    near(claimLandscape.y, Number((100 - claimHeight).toFixed(4)));
    expect(surface).toContain('preserveAspectRatio="xMidYMax meet"');
    // Steht vor der App, damit sie mit dem ersten Bild da ist.
    expect(html.indexOf('<div id="startflaeche"')).toBeLessThan(html.indexOf('<div id="root">'));
  });
});
