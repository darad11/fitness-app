import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import startScript from '../../public/startflaeche.js?raw';
import template from '../../public/splash/splash.svg?raw';
import { START_FADE_MS } from './startSurface';

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
    expect(links.length).toBe(44);
  });

  it('das iPhone Duo hat Startbilder für beide Displays, hoch und quer (D-390)', () => {
    const duo = links
      .filter((l) => l.ratio === 3 && [466, 669].includes(l.width))
      .map((l) => `${String(l.width)}x${String(l.height)} ${l.orientation} ${l.href}`)
      .sort();
    expect(duo).toEqual([
      '466x678 landscape /splash/splash-2034x1398.png',
      '466x678 portrait /splash/splash-1398x2034.png',
      '669x951 landscape /splash/splash-2853x2007.png',
      '669x951 portrait /splash/splash-2007x2853.png',
    ]);
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

  // Die drei Größen des Markenpakets (iPhone, Pro Max, iPad), ein Bild quer und das iPhone Duo
  // zugeklappt hoch und aufgeklappt quer (D-390).
  for (const size of [
    '1170x2532',
    '1290x2796',
    '2048x2732',
    '2532x1170',
    '1398x2034',
    '2853x2007',
  ]) {
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
    // Ausblenden so lang wie in startSurface.ts (F6, D-337: 300 ms).
    expect(style).toContain(
      `#startflaeche.weg{opacity:0;transition:opacity ${String(START_FADE_MS)}ms ease-out}`,
    );
    expect(style).toContain(
      '@media (prefers-reduced-motion:reduce){#startflaeche.weg{transition:none}}',
    );
    expect(style).toContain('@media (orientation:landscape){#startflaeche .hoch{display:none}}');
    expect(style).toContain('@media (orientation:portrait){#startflaeche .quer{display:none}}');
    // Grundlinie 58 pt über dem Rand (abzüglich des winzigen Überhangs von O und S); die kurze
    // Seite ist die des Bildschirms: das aktuelle Fenster plus die Streifen aus
    // public/startflaeche.js, ohne das Skript das Fenster (D-393, D-394).
    expect(style).toContain(
      '#startflaeche .start-unten{transform:translateY(calc(0.000365 * min(100vw + var(--start-links,0px) + var(--start-rechts,0px), 100vh + var(--start-oben,0px) + var(--start-unten,0px)) - 58px))}',
    );

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

  it('die Startfläche richtet sich nach dem ganzen Bildschirm, nicht nach den sicheren Bereichen (D-390, D-393, D-394)', () => {
    // Ohne Bedienelemente: kein Abstand für Systemleiste, Kamera oder Home-Balken.
    expect(style).not.toContain('safe-area');
    expect(surface).not.toContain('safe-area');
    expect(style).toContain('position:fixed;inset:0;');
    expect(style).toContain('overflow:hidden;');
    // Die Grafik ist per CSS das aktuelle Fenster plus die Streifen daneben, die
    // public/startflaeche.js in jedem Bild setzt: so groß wie der Bildschirm und dort, wo das
    // Startbild liegt; ohne das Skript füllt sie das Fenster (D-394). Keine Regeln nach
    // `device-width`: Das Duo meldet dort auch aufgeklappt das äußere Display (D-393).
    expect(style).toContain(
      '#startflaeche>svg{display:block;position:absolute;left:calc(var(--start-links,0px) * -1);top:calc(var(--start-oben,0px) * -1);width:calc(100% + var(--start-links,0px) + var(--start-rechts,0px));height:calc(100% + var(--start-oben,0px) + var(--start-unten,0px))}',
    );
    expect(style).not.toContain('device-width');
    expect(style).not.toMatch(/--start-(b|h|x|y|kurz)\b/);
    // Das Logo bleibt unsichtbar, solange das Skript wartet, höchstens 300 ms, auch wenn das
    // Skript nicht weiterkommt; dieselbe Zeit wie im Skript (D-394).
    expect(style).toContain(
      'html[data-startlage=warten] #startflaeche>svg{visibility:hidden;animation:startlage-netz 0s 300ms forwards}',
    );
    expect(style).toContain('@keyframes startlage-netz{to{visibility:visible}}');
    expect(startScript).toContain('var WARTEN_MS = 300;');
    // Das Skript läuft vor der Fläche, im Kopf, nach dem Farbschema.
    const script = html.indexOf('<script src="/startflaeche.js"></script>');
    expect(script).toBeGreaterThan(html.indexOf('<script src="/theme-init.js"></script>'));
    expect(script).toBeLessThan(html.indexOf('</head>'));
  });
});

/** Rechnung der Startfläche aus public/startflaeche.js, ausgeführt mit einem ruhenden Fenster. */
function loadStartLage() {
  const fake: Record<string, unknown> = {
    innerWidth: 390,
    innerHeight: 844,
    screen: { width: 390, height: 844 },
    performance: { now: () => 0 },
    setTimeout: () => 0,
    clearTimeout: () => undefined,
    requestAnimationFrame: () => 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
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
  const execute = new Function('window', 'document', startScript) as (
    win: unknown,
    doc: unknown,
  ) => void;
  execute(fake, doc);
  return fake.__formStartLage as (messung: {
    fenster: { b: number; h: number };
    bildschirm: { b: number; h: number } | null;
    ausrichtung: 'hoch' | 'quer' | null;
  }) => {
    b: number;
    h: number;
    links: number;
    rechts: number;
    oben: number;
    unten: number;
    dx: number;
    dy: number;
  };
}

describe('Startbild und Startfläche liegen am iPhone Duo in allen vier Zuständen gleich (D-393, D-394)', () => {
  const links = startupLinks();
  const surface = /<div id="startflaeche"[\s\S]*?<\/div>/.exec(html)?.[0] ?? '';
  const style = /#startflaeche\{display:none\}[^<]*/.exec(html)?.[0] ?? '';
  const startLage = loadStartLage();

  /** Ansicht `<use>` in Prozent der Grafik. */
  const useBox = (orientation: string, href: string) => {
    const match = new RegExp(`<use class="${orientation}" href="#${href}" ([^>]*)/>`).exec(surface);
    const values: Record<string, number> = {};
    for (const a of (match?.[1] ?? '').matchAll(/(\w+)="([-\d.]+)%?"/g)) {
      values[a[1] ?? ''] = Number(a[2]);
    }
    return { x: values.x ?? 0, y: values.y ?? 0, w: values.width ?? 0, h: values.height ?? 0 };
  };
  const [, , logoW = 1, logoH = 1] = (
    /<symbol id="start-logo" viewBox="([^"]+)"/.exec(surface)?.[1] ?? ''
  )
    .split(' ')
    .map(Number);
  /** Unterkante des Claims: Faktor der kurzen Seite und Abstand vom unteren Rand. */
  const claimShift = /translateY\(calc\(([\d.]+) \* min\(100vw .*?\)\) - (\d+)px\)\)/.exec(style);
  const below = Number(claimShift?.[1]);
  const baseline = Number(claimShift?.[2]);

  // Fenster am Gerät gemessen; zugeklappt quer angenommen (84 pt schmaler wie Safari dort);
  // aufgeklappt quer beim Start laut Messbild noch ohne Streifen oben. screen.* meldet wie am
  // Gerät vermutet überall das äußere Display, 466 × 678.
  const STATES = [
    { name: 'zugeklappt hoch', fenster: { b: 382, h: 678 } },
    { name: 'zugeklappt quer', fenster: { b: 594, h: 466 } },
    { name: 'aufgeklappt hoch', fenster: { b: 669, h: 869 } },
    { name: 'aufgeklappt quer', fenster: { b: 867, h: 587 } },
    { name: 'aufgeklappt quer beim Start', fenster: { b: 867, h: 669 } },
  ];

  for (const state of STATES) {
    it(`${state.name}: Logo und Claim der Fläche stehen auf dem Bildschirm wie im Startbild, die Verschiebung stimmt mit den Gerätedaten`, async () => {
      const lage = startLage({
        fenster: state.fenster,
        bildschirm: { b: 466, h: 678 },
        ausrichtung: state.fenster.b > state.fenster.h ? 'quer' : 'hoch',
      });
      const quer = lage.b > lage.h;
      const link = links.find(
        (l) =>
          l.ratio === 3 &&
          l.width === Math.min(lage.b, lage.h) &&
          l.height === Math.max(lage.b, lage.h) &&
          l.orientation === (quer ? 'landscape' : 'portrait'),
      );
      expect(link, 'Startbild für diesen Bildschirm').toBeDefined();
      const image = await decodePng(files[fileOf(link?.href ?? '')] ?? '');
      expect([image.width / 3, image.height / 3]).toEqual([lage.b, lage.h]);
      const { symbol, wordmark, claim } = measure(image);
      // Startbild über den ganzen Bildschirm, in pt.
      const picture = {
        x: (Math.min(symbol.left, wordmark.left) + Math.max(symbol.right, wordmark.right)) / 6,
        y: (symbol.top + wordmark.bottom) / 6,
        width: (wordmark.right - wordmark.left) / 3,
        claimX: (claim.left + claim.right) / 6,
        claimBottom: claim.bottom / 3,
      };

      // Startfläche wie das CSS aus index.html sie zeichnet: Die Grafik ist das Fenster plus die
      // Streifen und beginnt im Fenster bei (−links, −oben). Das Fenster liegt rechts und unter
      // den Streifen, auf dem Bildschirm also bei (links, oben): Dort beginnt die Grafik bei (0, 0),
      // wie das Startbild.
      const fenster = { x: lage.links, y: lage.oben };
      const left = fenster.x - lage.links;
      const top = fenster.y - lage.oben;
      const width = state.fenster.b + lage.links + lage.rechts;
      const height = state.fenster.h + lage.oben + lage.unten;
      expect([width, height]).toEqual([lage.b, lage.h]);
      const logo = useBox(quer ? 'quer' : 'hoch', 'start-logo');
      const claimUse = useBox(quer ? 'quer' : 'hoch', 'start-claim-zeichen');
      const flaeche = {
        x: left + (width * (logo.x + logo.w / 2)) / 100,
        y: top + (height * (logo.y + logo.h / 2)) / 100,
        width: quer ? ((height * logo.h) / 100) * (logoW / logoH) : (width * logo.w) / 100,
        claimX: left + (width * (claimUse.x + claimUse.w / 2)) / 100,
        claimBottom: top + height - baseline + below * Math.min(width, height),
      };

      expect(Math.abs(flaeche.x - picture.x), 'Mitte des Logos waagrecht').toBeLessThanOrEqual(1);
      expect(Math.abs(flaeche.y - picture.y), 'Mitte des Logos senkrecht').toBeLessThanOrEqual(1);
      expect(Math.abs(flaeche.width - picture.width), 'Breite der Wortmarke').toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs(flaeche.claimX - picture.claimX), 'Mitte des Claims').toBeLessThanOrEqual(1);
      expect(
        Math.abs(flaeche.claimBottom - picture.claimBottom),
        'Claim unten',
      ).toBeLessThanOrEqual(1);
      // In der Mitte des ganzen Bildschirms, auf 47 % der Höhe.
      expect(Math.abs(picture.x - lage.b / 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(picture.y - 0.47 * lage.h)).toBeLessThanOrEqual(1);
      // Vom Fenster aus: Die Mitte des Bildschirms liegt um die Verschiebung aus den Gerätedaten
      // neben der Mitte des Fensters.
      expect(lage.b / 2 - fenster.x - state.fenster.b / 2).toBeCloseTo(lage.dx, 6);
      expect(lage.h / 2 - fenster.y - state.fenster.h / 2).toBeCloseTo(lage.dy, 6);
    });
  }
});
